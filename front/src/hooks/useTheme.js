import { useEffect, useState } from 'react'

const STORAGE_KEY = 'webshield.theme'

function getInitialTheme() {
  if (typeof window === 'undefined') return 'dark'
  // El script inline en index.html ya puso data-theme, así que ese es la fuente de verdad.
  const fromDom = document.documentElement.dataset.theme
  if (fromDom === 'light' || fromDom === 'dark') return fromDom
  const stored = localStorage.getItem(STORAGE_KEY)
  if (stored === 'light' || stored === 'dark') return stored
  return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark'
}

export function useTheme() {
  const [theme, setTheme] = useState(getInitialTheme)

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    try {
      localStorage.setItem(STORAGE_KEY, theme)
    } catch (_) {
      // localStorage podría estar deshabilitado (modo privado, etc.) — ignorar.
    }
  }, [theme])

  const toggleTheme = () => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))

  return [theme, toggleTheme]
}
