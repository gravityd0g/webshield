import { apiFetch } from './client'

export async function login({ email, password }) {
  const { user } = await apiFetch('/api/auth/login', {
    method: 'POST',
    body: { email, password },
  })
  return user
}

export async function register({ email, password, name }) {
  const { user } = await apiFetch('/api/auth/register', {
    method: 'POST',
    body: { email, password, name },
  })
  return user
}

export async function fetchMe() {
  const { user } = await apiFetch('/api/auth/me')
  return user
}

export async function logout() {
  await apiFetch('/api/auth/logout', { method: 'POST' })
}
