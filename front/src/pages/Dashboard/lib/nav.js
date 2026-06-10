// `labelKey`/`badgeKey` se resuelven con i18n en AppShell.
// `badge` numérico se queda como número (no se traduce).
export const navItems = [
  { id: 'dashboard', labelKey: 'nav.dashboard', icon: 'grid', path: '/dashboard' },
  { id: 'live', labelKey: 'nav.live', icon: 'pulse', path: '/live', badgeKey: 'nav.liveBadge' },
  { id: 'alerts', labelKey: 'nav.alerts', icon: 'bell', path: '/alerts', badge: 12 },
  { id: 'triage', labelKey: 'nav.triage', icon: 'inbox', path: '/triage', badge: 4 },
  { id: 'investigations', labelKey: 'nav.investigations', icon: 'search', path: '/investigations' },
  { id: 'rules', labelKey: 'nav.rules', icon: 'shield', path: '/rules' },
  { id: 'users', labelKey: 'nav.users', icon: 'users', path: '/users', adminOnly: true },
  { id: 'audit', labelKey: 'nav.audit', icon: 'history', path: '/audit', adminOnly: true },
  { id: 'settings', labelKey: 'nav.settings', icon: 'cog', path: '/settings' },
]
