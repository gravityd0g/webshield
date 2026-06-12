// HTTP client compartido. Maneja base URL, cookies (credentials), y errores.
const API_BASE = (import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '')

export async function apiFetch(path, { method = 'GET', body, signal } = {}) {
  const url = `${API_BASE}${path}`
  const response = await fetch(url, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    credentials: 'include',
    body: body ? JSON.stringify(body) : undefined,
    signal,
  })

  if (response.status === 204) return null

  const text = await response.text()
  let json = null
  if (text) {
    try {
      json = JSON.parse(text)
    } catch {
      json = { error: text }
    }
  }

  if (!response.ok) {
    const err = new Error(json?.error ?? `HTTP ${response.status}`)
    err.status = response.status
    err.payload = json
    throw err
  }

  return json
}
