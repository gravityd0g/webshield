import { useState } from 'react'
import Login from './pages/Login/Login'
import Register from './pages/Login/Register'
import Dashboard from './pages/Dashboard/Dashboard'

export default function App() {
  const [user, setUser] = useState(null)
  const [page, setPage] = useState('login')

  if (!user) {
    if (page === 'register') {
      return <Register onRegistered={() => setPage('login')} onGoToLogin={() => setPage('login')} />
    }
    return <Login onLogin={setUser} onGoToRegister={() => setPage('register')} />
  }

  return <Dashboard />
}
