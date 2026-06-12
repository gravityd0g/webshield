import { query } from '../db.js'

function mapEvent(row) {
  let headers = {}
  if (typeof row.headers === 'string') {
    try {
      headers = JSON.parse(row.headers)
    } catch {
      headers = {}
    }
  } else if (row.headers && typeof row.headers === 'object') {
    headers = row.headers
  }

  return {
    id: row.id,
    ts: row.ts instanceof Date ? row.ts.toISOString() : String(row.ts),
    ip: row.ip,
    method: row.method,
    uri: row.uri,
    verdict: row.verdict,
    action: row.action,
    score: Number(row.score ?? 0),
    body: row.body ?? null,
    headers,
  }
}

export async function getDashboardData() {
  const rows = await query(
    `SELECT re.event_id AS id, re.detected_at AS ts, re.client_ip AS ip,
            re.verdict, re.action, re.confidence_score AS score,
            rh.http_method AS method, rh.uri,
            rh.post_data AS body, rh.request_headers AS headers
       FROM request_events re
       LEFT JOIN request_http rh ON rh.event_id = re.event_id
       ORDER BY re.detected_at DESC
       LIMIT 200`,
  )

  return { recentEvents: rows.map(mapEvent) }
}
