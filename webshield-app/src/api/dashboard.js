const API_BASE = import.meta.env.VITE_API_URL ?? ''

export async function fetchDashboard() {
  const res = await fetch(`${API_BASE}/api/dashboard`)
  if (!res.ok) {
    throw new Error('No se pudo cargar el dashboard')
  }
  return res.json()
}

export async function fetchHealth() {
  const res = await fetch(`${API_BASE}/api/health`)
  if (!res.ok) throw new Error('API unreachable')
  return res.json()
}
