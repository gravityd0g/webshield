import { useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login/Login'
import Dashboard from './pages/Dashboard/Dashboard'
import LiveEventsPage from './pages/Dashboard/sections/LiveEventsPage'
import AlertsPage from './pages/Dashboard/sections/AlertsPage'
import TriagePage from './pages/Dashboard/sections/TriagePage'
import InvestigationsPage from './pages/Dashboard/sections/InvestigationsPage'
import RulesModelPage from './pages/Dashboard/sections/RulesModelPage'
import UsersPage from './pages/Dashboard/sections/UsersPage'
import AuditLogPage from './pages/Dashboard/sections/AuditLogPage'
import SettingsPage from './pages/Dashboard/sections/SettingsPage'

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

  if (!user) {
    return <Login onLogin={setUser} />
  }

  const currentUser = deriveCurrentUser(user)

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/dashboard" element={<Dashboard currentUser={currentUser} />} />
        <Route path="/live" element={<LiveEventsPage currentUser={currentUser} />} />
        <Route path="/alerts" element={<AlertsPage currentUser={currentUser} />} />
        <Route path="/triage" element={<TriagePage currentUser={currentUser} />} />
        <Route path="/investigations" element={<InvestigationsPage currentUser={currentUser} />} />
        <Route path="/rules" element={<RulesModelPage currentUser={currentUser} />} />
        <Route path="/users" element={<UsersPage currentUser={currentUser} />} />
        <Route path="/audit" element={<AuditLogPage currentUser={currentUser} />} />
        <Route path="/settings" element={<SettingsPage currentUser={currentUser} />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
