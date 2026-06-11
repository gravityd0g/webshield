import { useState } from 'react'
import Login from './pages/Login/Login'
import Register from './pages/Login/Register'
import Dashboard from './pages/Dashboard/Dashboard'

function deriveCurrentUser(rawUser) {
  if (!rawUser?.email) return null
  const local = rawUser.email.split('@')[0] ?? ''
  const parts = local.split(/[._-]/).filter(Boolean)
  const initials =
    parts.slice(0, 2).map((p) => p[0]?.toUpperCase()).join('') ||
    rawUser.email[0]?.toUpperCase() ||
    '?'
  const name = parts.map((p) => p[0].toUpperCase() + p.slice(1).toLowerCase()).join(' ') || local
  return { name, email: rawUser.email, role: 'analyst', initials }
}

export default function App() {
  const [user, setUser] = useState(null)
  const [page, setPage] = useState('login')

  if (!user) {
    if (page === 'register') {
      return <Register onRegistered={() => setPage('login')} onGoToLogin={() => setPage('login')} />
    }
    return <Login onLogin={setUser} onGoToRegister={() => setPage('register')} />
  }

  return <Dashboard currentUser={deriveCurrentUser(user)} />
}
