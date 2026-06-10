import { NavLink } from 'react-router-dom'
import { navItems } from '../lib/nav'
import { useTheme } from '../../../hooks/useTheme'

const TIME_RANGES = [
  { id: '1h', label: '1h' },
  { id: '24h', label: '24h' },
  { id: '7d', label: '7d' },
  { id: '30d', label: '30d' },
]

function Icon({ name }) {
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
    sun: <>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
    </>,
    moon: <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />,
  }
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {paths[name] ?? null}
    </svg>
  )
}

function TopBar({ timeRange, onTimeRangeChange, currentUser }) {
  const [theme, toggleTheme] = useTheme()
  return (
    <header
      className="grid grid-cols-[280px_1fr_auto] items-center gap-6 px-5 py-2.5 bg-gradient-to-b from-bg-2 to-bg-1 border-b border-border sticky top-0 z-30"
      role="banner"
    >
      <div className="flex items-center gap-3">
        <div
          className="w-9 h-9 grid place-items-center bg-gradient-to-br from-slate-800 to-[#0b1220] border border-border-strong rounded-[9px] text-cyan shadow-[0_0_0_1px_rgb(94_234_212/0.06),inset_0_1px_0_rgb(255_255_255/0.04)]"
          aria-hidden="true"
        >
          <Icon name="shield" />
        </div>
        <div className="flex flex-col leading-tight">
          <strong className="text-[15px] tracking-wide">WebShield</strong>
          <span className="text-[11px] text-fg-dim uppercase tracking-wider">Security Operations Center</span>
        </div>
      </div>

      <div className="flex justify-center">
        <div
          className="w-full max-w-[560px] flex items-center gap-2.5 px-3 py-2 bg-bg-2 border border-border rounded-[10px] text-fg-muted transition-[border-color,background] duration-120 focus-within:border-blue focus-within:bg-bg-3"
          role="search"
        >
          <Icon name="search" />
          <input
            type="search"
            placeholder="Buscar IP, URI, evento, regla CRS…"
            aria-label="Búsqueda global"
            className="flex-1 bg-transparent border-0 text-fg text-[13px] outline-0 placeholder:text-fg-dim"
          />
          <kbd className="font-mono text-[11px] px-1.5 py-0.5 border border-border-strong rounded bg-bg-3 text-fg-muted">
            ⌘K
          </kbd>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div
          className="flex items-center gap-2 px-2.5 py-1.5 bg-bg-2 border border-border rounded-full text-xs text-fg-muted"
          title="WAF en línea"
        >
          <span
            className="w-2 h-2 rounded-full bg-green animate-pulse-status motion-reduce:animate-none"
            aria-hidden="true"
          />
          <span>WAF online</span>
        </div>
        <div className="flex bg-bg-2 border border-border rounded-[10px] p-0.5" role="group" aria-label="Rango de tiempo">
          {TIME_RANGES.map((r) => (
            <button
              key={r.id}
              type="button"
              className={
                timeRange === r.id
                  ? 'border-0 px-3 py-1.5 text-xs font-medium rounded-md cursor-pointer bg-bg-3 text-fg shadow-[0_0_0_1px_var(--color-border-strong)]'
                  : 'border-0 px-3 py-1.5 text-xs font-medium rounded-md cursor-pointer bg-transparent text-fg-muted'
              }
              onClick={() => onTimeRangeChange(r.id)}
            >
              {r.label}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={toggleTheme}
          className="w-[34px] h-[34px] grid place-items-center bg-bg-2 border border-border rounded-[10px] text-fg-muted cursor-pointer hover:text-fg hover:border-border-strong transition-colors"
          aria-label={theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
          title={theme === 'dark' ? 'Modo claro' : 'Modo oscuro'}
        >
          <Icon name={theme === 'dark' ? 'sun' : 'moon'} />
        </button>
        <button
          type="button"
          className="relative w-[34px] h-[34px] grid place-items-center bg-bg-2 border border-border rounded-[10px] text-fg-muted cursor-pointer hover:text-fg hover:border-border-strong"
          aria-label="Notificaciones (3 nuevas)"
        >
          <Icon name="bell" />
          <span className="absolute -top-1 -right-1 bg-rose text-white text-[10px] font-semibold px-[5px] py-px rounded-full border-2 border-bg-1">
            3
          </span>
        </button>
        {currentUser && (
          <div
            className="flex items-center gap-2.5 pl-1 pr-2.5 py-1 bg-bg-2 border border-border rounded-full"
            title={`${currentUser.name} · ${currentUser.role}`}
          >
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue to-violet grid place-items-center text-[11px] font-bold text-white">
              {currentUser.initials}
            </div>
            <div className="flex flex-col leading-tight">
              <strong className="text-xs">{currentUser.name}</strong>
              <span className="text-[10px] text-fg-dim uppercase tracking-wide">{currentUser.role}</span>
            </div>
          </div>
        )}
      </div>
    </header>
  )
}

function Sidebar() {
  return (
    <nav
      className="w-60 shrink-0 bg-bg-1 border-r border-border flex flex-col px-3 py-4"
      aria-label="Navegación principal"
    >
      <ul className="list-none m-0 p-0 flex-1 flex flex-col gap-0.5">
        {navItems.map((item) => (
          <li key={item.id}>
            <NavLink
              to={item.path}
              className={({ isActive }) =>
                isActive
                  ? 'flex items-center gap-[11px] px-3 py-2 rounded-lg text-[13px] font-medium no-underline relative bg-gradient-to-r from-blue-soft to-transparent text-fg shadow-[inset_2px_0_0_var(--color-blue)]'
                  : 'flex items-center gap-[11px] px-3 py-2 rounded-lg text-[13px] font-medium no-underline relative text-fg-muted hover:bg-surface-hover hover:text-fg'
              }
            >
              <span className="grid place-items-center w-[18px]">
                <Icon name={item.icon} />
              </span>
              <span className="flex-1">{item.label}</span>
              {item.badge != null && (
                <span
                  className={
                    typeof item.badge === 'string'
                      ? 'text-[10px] px-1.5 py-0.5 rounded-full font-semibold font-mono bg-rose-soft text-rose tracking-wider'
                      : 'text-[10px] px-1.5 py-0.5 rounded-full font-semibold font-mono bg-bg-3 text-fg-muted'
                  }
                >
                  {item.badge}
                </span>
              )}
              {item.adminOnly && (
                <span className="text-[10px] opacity-50" title="Solo admin">
                  🔒
                </span>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
      <div className="border-t border-border mt-3 pt-3 flex flex-col gap-2.5">
        <div className="flex flex-col gap-1 text-[11px] text-fg-dim">
          <div className="flex justify-between px-1.5 py-1 rounded bg-bg-2">
            <span>Modelo</span>
            <strong className="text-green">healthy</strong>
          </div>
          <div className="flex justify-between px-1.5 py-1 rounded bg-bg-2">
            <span>DB</span>
            <strong className="text-green">healthy</strong>
          </div>
          <div className="flex justify-between px-1.5 py-1 rounded bg-bg-2">
            <span>Backend</span>
            <strong className="text-green">healthy</strong>
          </div>
        </div>
        <p className="m-0 text-[10px] text-fg-dim font-mono text-center">webshield v0.1.0 · build #boceto</p>
      </div>
    </nav>
  )
}

export default function AppShell({ children, timeRange, onTimeRangeChange, currentUser }) {
  return (
    <div
      className="min-h-screen flex flex-col text-sm leading-[1.45] text-fg font-sans bg-bg-0 bg-[radial-gradient(1200px_600px_at_20%_-10%,rgb(96_165_250/0.06),transparent_60%),radial-gradient(900px_500px_at_110%_10%,rgb(167_139_250/0.05),transparent_60%),var(--color-bg-0)] [&_*]:box-border [&_*::before]:box-border [&_*::after]:box-border [&_*:focus-visible]:outline-2 [&_*:focus-visible]:outline-blue [&_*:focus-visible]:outline-offset-2 [&_*:focus-visible]:rounded"
    >
      <TopBar timeRange={timeRange} onTimeRangeChange={onTimeRangeChange} currentUser={currentUser} />
      <div className="flex flex-1 min-h-0">
        <Sidebar />
        <main className="flex-1 px-6 pt-5 pb-8 overflow-x-hidden flex flex-col gap-4" id="main">
          {children}
        </main>
      </div>
    </div>
  )
}
