// Cliente HTTP para la ML API.
// Lo usan las rutas /api/model/* del dashboard cuando se quiere consultar el modelo
// directamente (en producción los eventos los ingesta el WAF, no este cliente).

function modelUrl(path = '') {
  const base = process.env.MODEL_API_URL ?? ''
  if (!base) throw new Error('MODEL_API_URL no configurado')
  return base.replace(/\/$/, '') + path
}

function modelKey() {
  return process.env.MODEL_API_KEY ?? ''
}

function timeoutMs() {
  return Number(process.env.MODEL_API_TIMEOUT_MS ?? 5000)
}

async function callModel(path, { method = 'GET', body } = {}) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs())
  const key = modelKey()
  const headers = { 'Content-Type': 'application/json' }
  if (key) headers['Authorization'] = `Bearer ${key}`

  try {
    const response = await fetch(modelUrl(path), {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    })
    if (!response.ok) {
      const text = await response.text().catch(() => '')
      const err = new Error(`Model API error ${response.status}: ${text}`)
      err.status = 502
      throw err
    }
    return await response.json()
  } finally {
    clearTimeout(timer)
  }
}

export async function modelHealth() {
  return callModel('/health')
}

export async function modelAnalyze({ method, uri, query, body, headers, clientIp }) {
  const hdrs = headers && typeof headers === 'object' ? headers : {}
  return callModel('/inspect', {
    method: 'POST',
    body: {
      method: method ?? 'GET',
      uri: uri ?? '/',
      query: query ?? '',
      headers: hdrs,
      body: body ?? '',
      client_ip: clientIp ?? '',
    },
  })
}
