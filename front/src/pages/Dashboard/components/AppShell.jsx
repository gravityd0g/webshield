import { useTranslation } from 'react-i18next'
import { useTheme } from '../../../hooks/useTheme'

function Icon({ name }) {
  const paths = {
    shield: <path d="M12 3l8 3v6c0 5-3.5 8.5-8 9-4.5-.5-8-4-8-9V6l8-3z" />,
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

function LanguageToggle() {
  const { i18n, t } = useTranslation()
  const current = i18n.language.startsWith('es') ? 'es' : 'en'
  const baseClass = 'border-0 px-2 py-1 text-[11px] font-semibold rounded-[5px] cursor-pointer font-mono tracking-wider'
  const activeClass = `${baseClass} bg-bg-3 text-fg shadow-[0_0_0_1px_var(--color-border-strong)]`
  const inactiveClass = `${baseClass} bg-transparent text-fg-muted`
  return (
    <div className="flex bg-bg-2 border border-border rounded-[10px] p-0.5" role="group" aria-label={t('topbar.languageAriaLabel')}>
      <button
        type="button"
        onClick={() => i18n.changeLanguage('en')}
        className={current === 'en' ? activeClass : inactiveClass}
        aria-pressed={current === 'en'}
      >
        EN
      </button>
      <button
        type="button"
        onClick={() => i18n.changeLanguage('es')}
        className={current === 'es' ? activeClass : inactiveClass}
        aria-pressed={current === 'es'}
      >
        ES
      </button>
    </div>
  )
}

function TopBar({ currentUser }) {
  const { t } = useTranslation()
  const [theme, toggleTheme] = useTheme()
  return (
    <header
      className="flex items-center justify-between gap-6 px-6 py-2.5 bg-gradient-to-b from-bg-2 to-bg-1 border-b border-border sticky top-0 z-30"
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
          <span className="text-[11px] text-fg-dim uppercase tracking-wider">{t('topbar.brandTagline')}</span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div
          className="flex items-center gap-2 px-2.5 py-1.5 bg-bg-2 border border-border rounded-full text-xs text-fg-muted"
          title={t('topbar.statusTitle')}
        >
          <span
            className="w-2 h-2 rounded-full bg-green animate-pulse-status motion-reduce:animate-none"
            aria-hidden="true"
          />
          <span>{t('topbar.status')}</span>
        </div>
        <LanguageToggle />
        <button
          type="button"
          onClick={toggleTheme}
          className="w-[34px] h-[34px] grid place-items-center bg-bg-2 border border-border rounded-[10px] text-fg-muted cursor-pointer hover:text-fg hover:border-border-strong transition-colors"
          aria-label={theme === 'dark' ? t('topbar.themeToLight') : t('topbar.themeToDark')}
          title={theme === 'dark' ? t('topbar.themeTitleLight') : t('topbar.themeTitleDark')}
        >
          <Icon name={theme === 'dark' ? 'sun' : 'moon'} />
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

export default function AppShell({ children, currentUser }) {
  return (
    <div
      className="min-h-screen flex flex-col text-sm leading-[1.45] text-fg font-sans bg-bg-0 bg-[radial-gradient(1200px_600px_at_20%_-10%,rgb(96_165_250/0.06),transparent_60%),radial-gradient(900px_500px_at_110%_10%,rgb(167_139_250/0.05),transparent_60%),var(--color-bg-0)] [&_*]:box-border [&_*::before]:box-border [&_*::after]:box-border [&_*:focus-visible]:outline-2 [&_*:focus-visible]:outline-blue [&_*:focus-visible]:outline-offset-2 [&_*:focus-visible]:rounded"
    >
      <TopBar currentUser={currentUser} />
      <main className="flex-1 px-6 pt-5 pb-8 overflow-x-hidden flex flex-col gap-4" id="main">
        {children}
      </main>
    </div>
  )
}
