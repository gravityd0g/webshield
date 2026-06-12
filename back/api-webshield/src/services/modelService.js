// Cliente para el ML API que corre en la VLAN del TEC (Track Python, branch 32).
// El endpoint /analyze recibe metadata de una request HTTP y devuelve verdict.

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

export async function modelAnalyze({ method, uri, query, body, userAgent, cookie }) {
  return callModel('/analyze', {
    method: 'POST',
    body: {
      method: method ?? 'GET',
      uri: uri ?? '/',
      query: query ?? '',
      body: body ?? '',
      user_agent: userAgent ?? '',
      cookie: cookie ?? '',
    },
  })
}
