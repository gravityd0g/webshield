import { navItems, currentUser } from '../mockData'

const TIME_RANGES = [
  { id: '1h', label: '1h' },
  { id: '24h', label: '24h' },
  { id: '7d', label: '7d' },
  { id: '30d', label: '30d' },
]

function Icon({ name }) {
  // Iconos inline SVG, sin librería externa. Stroke siempre desde currentColor.
  const paths = {
    shield: <path d="M12 3l8 3v6c0 5-3.5 8.5-8 9-4.5-.5-8-4-8-9V6l8-3z" />,
    grid: <><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></>,
    pulse: <path d="M3 12h4l3-8 4 16 3-8h4" />,
    bell: <><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" /><path d="M10 21a2 2 0 0 0 4 0" /></>,
    inbox: <><path d="M22 12h-6l-2 3h-4l-2-3H2" /><path d="M5 4h14l3 8v7a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-7l3-8z" /></>,
    search: <><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.5-4.5" /></>,
    users: <><circle cx="9" cy="8" r="4" /><path d="M2 21v-1c0-3.3 3.1-6 7-6s7 2.7 7 6v1" /><circle cx="17" cy="9" r="3" /><path d="M22 21v-1c0-2.4-2.1-4.4-5-4.4" /></>,
    history: <><path d="M3 12a9 9 0 1 0 3-6.7" /><path d="M3 4v5h5" /><path d="M12 7v5l3 2" /></>,
    cog: <>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1" />
    </>,
  }
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {paths[name] ?? null}
    </svg>
  )
}

function TopBar({ timeRange, onTimeRangeChange }) {
  return (
    <header className="topbar" role="banner">
      <div className="topbar__brand">
        <div className="topbar__logo" aria-hidden="true">
          <Icon name="shield" />
        </div>
        <div className="topbar__brand-text">
          <strong>WebShield</strong>
          <span className="topbar__brand-sub">Security Operations Center</span>
        </div>
      </div>

      <div className="topbar__center">
        <div className="topbar__search" role="search">
          <Icon name="search" />
          <input
            type="search"
            placeholder="Buscar IP, URI, evento, regla CRS…"
            aria-label="Búsqueda global"
          />
          <kbd>⌘K</kbd>
        </div>
      </div>

      <div className="topbar__actions">
        <div className="topbar__status" title="WAF en línea">
          <span className="topbar__status-dot" aria-hidden="true"></span>
          <span>WAF online</span>
        </div>
        <div className="topbar__time-range" role="group" aria-label="Rango de tiempo">
          {TIME_RANGES.map((r) => (
            <button
              key={r.id}
              type="button"
              className={`topbar__time-btn ${timeRange === r.id ? 'is-active' : ''}`}
              onClick={() => onTimeRangeChange(r.id)}
            >
              {r.label}
            </button>
          ))}
        </div>
        <button type="button" className="topbar__icon-btn" aria-label="Notificaciones (3 nuevas)">
          <Icon name="bell" />
          <span className="topbar__badge">3</span>
        </button>
        <div className="topbar__user" title={`${currentUser.name} · ${currentUser.role}`}>
          <div className="topbar__avatar">{currentUser.initials}</div>
          <div className="topbar__user-text">
            <strong>{currentUser.name}</strong>
            <span>{currentUser.role}</span>
          </div>
        </div>
      </div>
    </header>
  )
}

function Sidebar() {
  return (
    <nav className="sidebar" aria-label="Navegación principal">
      <ul>
        {navItems.map((item) => (
          <li key={item.id}>
            <a
              href={`#${item.id}`}
              className={`sidebar__item ${item.active ? 'is-active' : ''}`}
              aria-current={item.active ? 'page' : undefined}
            >
              <span className="sidebar__icon"><Icon name={item.icon} /></span>
              <span className="sidebar__label">{item.label}</span>
              {item.badge != null && (
                <span className={`sidebar__badge ${typeof item.badge === 'string' ? 'sidebar__badge--live' : ''}`}>
                  {item.badge}
                </span>
              )}
              {item.adminOnly && <span className="sidebar__lock" title="Solo admin">🔒</span>}
            </a>
          </li>
        ))}
      </ul>
      <div className="sidebar__footer">
        <div className="sidebar__health">
          <div className="sidebar__health-row">
            <span>Modelo</span>
            <strong className="sidebar__health-ok">healthy</strong>
          </div>
          <div className="sidebar__health-row">
            <span>DB</span>
            <strong className="sidebar__health-ok">healthy</strong>
          </div>
          <div className="sidebar__health-row">
            <span>Backend</span>
            <strong className="sidebar__health-ok">healthy</strong>
          </div>
        </div>
        <p className="sidebar__version">webshield v0.1.0 · build #boceto</p>
      </div>
    </nav>
  )
}

export default function AppShell({ children, timeRange, onTimeRangeChange }) {
  return (
    <div className="app-shell">
      <TopBar timeRange={timeRange} onTimeRangeChange={onTimeRangeChange} />
      <div className="app-shell__body">
        <Sidebar />
        <main className="app-shell__main" id="main">
          {children}
        </main>
      </div>
    </div>
  )
}
