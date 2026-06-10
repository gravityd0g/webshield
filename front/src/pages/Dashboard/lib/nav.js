export const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: 'grid', path: '/dashboard' },
  { id: 'live', label: 'Live events', icon: 'pulse', path: '/live', badge: 'LIVE' },
  { id: 'alerts', label: 'Alerts', icon: 'bell', path: '/alerts', badge: 12 },
  { id: 'triage', label: 'Triage queue', icon: 'inbox', path: '/triage', badge: 4 },
  { id: 'investigations', label: 'Investigations', icon: 'search', path: '/investigations' },
  { id: 'rules', label: 'Rules & model', icon: 'shield', path: '/rules' },
  { id: 'users', label: 'Users', icon: 'users', path: '/users', adminOnly: true },
  { id: 'audit', label: 'Audit log', icon: 'history', path: '/audit', adminOnly: true },
  { id: 'settings', label: 'Settings', icon: 'cog', path: '/settings' },
]
