import { useTranslation } from 'react-i18next'
import { useTheme } from '../hooks/useTheme'

function SunIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
    </svg>
  )
}

function MoonIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  )
}

export default function AccessibilityToggles({ className = '' }) {
  const { t, i18n } = useTranslation()
  const [theme, toggleTheme] = useTheme()
  const current = i18n.language.startsWith('es') ? 'es' : 'en'
  const langBase = 'border-0 px-2 py-1 text-[11px] font-semibold rounded-[5px] cursor-pointer font-mono tracking-wider'
  const langActive = `${langBase} bg-bg-3 text-fg shadow-[0_0_0_1px_var(--color-border-strong)]`
  const langInactive = `${langBase} bg-transparent text-fg-muted`

  return (
    <div className={`flex items-center justify-center gap-2 ${className}`}>
      <div className="flex bg-bg-2 border border-border rounded-[10px] p-0.5" role="group" aria-label={t('topbar.languageAriaLabel')}>
        <button
          type="button"
          onClick={() => i18n.changeLanguage('en')}
          className={current === 'en' ? langActive : langInactive}
          aria-pressed={current === 'en'}
        >
          EN
        </button>
        <button
          type="button"
          onClick={() => i18n.changeLanguage('es')}
          className={current === 'es' ? langActive : langInactive}
          aria-pressed={current === 'es'}
        >
          ES
        </button>
      </div>
      <button
        type="button"
        onClick={toggleTheme}
        className="w-[30px] h-[30px] grid place-items-center bg-bg-2 border border-border rounded-[8px] text-fg-muted cursor-pointer hover:text-fg hover:border-border-strong transition-colors"
        aria-label={theme === 'dark' ? t('topbar.themeToLight') : t('topbar.themeToDark')}
        title={theme === 'dark' ? t('topbar.themeTitleLight') : t('topbar.themeTitleDark')}
      >
        {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
      </button>
    </div>
  )
}
