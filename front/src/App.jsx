import { useEffect, useState } from 'react'
import Login from './pages/Login/Login'
import Register from './pages/Login/Register'
import Dashboard from './pages/Dashboard/Dashboard'
import { fetchMe, logout as apiLogout } from './api/auth'

function deriveCurrentUser(rawUser) {
  if (!rawUser?.email) return null
  const fromBack = rawUser.name?.trim()
  const local = rawUser.email.split('@')[0] ?? ''
  const parts = (fromBack ?? local).split(/[\s._-]/).filter(Boolean)
  const initials =
    parts.slice(0, 2).map((p) => p[0]?.toUpperCase()).join('') ||
    rawUser.email[0]?.toUpperCase() ||
    '?'
  const name = fromBack ?? (parts.map((p) => p[0].toUpperCase() + p.slice(1).toLowerCase()).join(' ') || local)
  return { name, email: rawUser.email, role: 'analyst', initials }
}

export default function App() {
  const [user, setUser] = useState(null)
  const [page, setPage] = useState('login')
  const [restoring, setRestoring] = useState(true)

  useEffect(() => {
    let cancelled = false
    fetchMe()
      .then((u) => {
        if (!cancelled) setUser(u)
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setRestoring(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  async function handleLogout() {
    try {
      await apiLogout()
    } catch (_) {}
    setUser(null)
    setPage('login')
  }

  if (restoring) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-0 text-fg-muted text-sm">
        Loading…
      </div>
    )
  }

  if (!user) {
    if (page === 'register') {
      return (
        <Register
          onRegistered={(u) => setUser(u)}
          onGoToLogin={() => setPage('login')}
        />
      )
    }
    return (
      <Login
        onLogin={(u) => setUser(u)}
        onGoToRegister={() => setPage('register')}
      />
    )
  }

  return <Dashboard currentUser={deriveCurrentUser(user)} onLogout={handleLogout} />
}
