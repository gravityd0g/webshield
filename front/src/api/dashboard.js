import { apiFetch } from './client'

export async function fetchDashboard() {
  return apiFetch('/api/dashboard')
}

export async function fetchHealth() {
  return apiFetch('/api/health')
}
