import pool from '../db.js'

export class ValidationError extends Error {
  constructor(message) {
    super(message)
    this.name = 'ValidationError'
  }
}

const UUID_RE = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/
const ISO_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?Z$/
const HOST_HEADER_VALUES = new Set(['HTTP/1.0', 'HTTP/1.1'])

function isPlainObject(v) {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

function isString(v) {
  return typeof v === 'string'
}

function isNumber(v) {
  return typeof v === 'number' && Number.isFinite(v)
}

function isValidPayload(p) {
  if (!isPlainObject(p)) return 'payload must be an object'

  if (!isString(p.event_id) || !UUID_RE.test(p.event_id)) {
    return 'event_id must be a UUID string'
  }

  if (p.detected_at !== undefined && p.detected_at !== null) {
    if (!isString(p.detected_at) || !ISO_RE.test(p.detected_at)) {
      return 'detected_at must be an ISO 8601 string'
    }
  }

  if (p.verdict !== 'valid' && p.verdict !== 'anomalous') {
    return "verdict must be 'valid' or 'anomalous'"
  }

  if (p.action !== 'allowed' && p.action !== 'blocked') {
    return "action must be 'allowed' or 'blocked'"
  }

  if (!isNumber(p.confidence_score) || p.confidence_score < 0 || p.confidence_score > 1) {
    return 'confidence_score must be a number in [0,1]'
  }

  if (!isString(p.client_ip) || p.client_ip.length === 0) {
    return 'client_ip must be a non-empty string'
  }

  if (!isNumber(p.latency_ms) || !Number.isInteger(p.latency_ms) || p.latency_ms < 0) {
    return 'latency_ms must be a non-negative integer'
  }

  if (!isPlainObject(p.http)) {
    return 'http must be an object'
  }

  if (!isString(p.http.method) || p.http.method.length === 0) {
    return 'http.method is required'
  }

  if (!isString(p.http.uri) || p.http.uri.length === 0) {
    return 'http.uri is required'
  }

  if (p.http.host_header !== undefined && p.http.host_header !== null && p.http.host_header !== '') {
    if (!isString(p.http.host_header) || !HOST_HEADER_VALUES.has(p.http.host_header)) {
      return "http.host_header must be 'HTTP/1.0' or 'HTTP/1.1'"
    }
  }

  if (p.http.request_headers !== undefined && p.http.request_headers !== null) {
    if (!isPlainObject(p.http.request_headers)) {
      return 'http.request_headers must be an object'
    }
  }

  if (p.model_version !== undefined && p.model_version !== null) {
    if (!isString(p.model_version)) {
      return 'model_version must be a string'
    }
  }

  return null
}

function emptyToNull(v) {
  if (v === undefined || v === null) return null
  if (typeof v === 'string' && v === '') return null
  return v
}

function intOrZero(v) {
  if (!isNumber(v) || !Number.isInteger(v)) return 0
  return v
}

export async function insertEvent(payload) {
  const err = isValidPayload(payload)
  if (err) {
    throw new ValidationError(err)
  }

  const conn = await pool.getConnection()
  try {
    await conn.beginTransaction()

    const eventCols = ['event_id', 'verdict', 'action', 'confidence_score', 'client_ip', 'latency_ms', 'model_version']
    const eventVals = [
      payload.event_id,
      payload.verdict,
      payload.action,
      payload.confidence_score,
      payload.client_ip,
      payload.latency_ms,
      payload.model_version ?? null,
    ]

    if (payload.detected_at) {
      eventCols.splice(1, 0, 'detected_at')
      eventVals.splice(1, 0, new Date(payload.detected_at))
    }

    const placeholders = eventCols.map(() => '?').join(',')
    const eventSql = `INSERT INTO request_events (${eventCols.join(',')}) VALUES (${placeholders})`
    await conn.execute(eventSql, eventVals)

    const http = payload.http
    const hostHeader = HOST_HEADER_VALUES.has(http.host_header) ? http.host_header : 'HTTP/1.1'
    const httpSql = `INSERT INTO request_http
      (event_id, http_method, uri, get_query, post_data, cookie, user_agent, content_length, host_header, request_headers)
      VALUES (?,?,?,?,?,?,?,?,?,?)`
    const httpVals = [
      payload.event_id,
      http.method.toUpperCase(),
      http.uri,
      emptyToNull(http.get_query),
      emptyToNull(http.post_data),
      emptyToNull(http.cookie),
      emptyToNull(http.user_agent),
      intOrZero(http.content_length),
      hostHeader,
      JSON.stringify(http.request_headers ?? {}),
    ]
    await conn.execute(httpSql, httpVals)

    await conn.commit()
    return { duplicate: false }
  } catch (e) {
    try {
      await conn.rollback()
    } catch {
      /* ignore */
    }
    if (e && e.code === 'ER_DUP_ENTRY') {
      return { duplicate: true }
    }
    throw e
  } finally {
    conn.release()
  }
}
