import { useState } from 'react'

function ShieldIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 3l8 3v6c0 5-3.5 8.5-8 9-4.5-.5-8-4-8-9V6l8-3z" />
    </svg>
  )
}

function LockIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  )
}

function MailIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="M2 7l10 7 10-7" />
    </svg>
  )
}

function EyeIcon({ off }) {
  if (off) {
    return (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
        <line x1="1" y1="1" x2="23" y2="23" />
      </svg>
    )
  }
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  )
}

export default function Login({ onLogin }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (!email.trim() || !password.trim()) {
      setError('Por favor completa todos los campos.')
      return
    }

    setLoading(true)
    setTimeout(() => {
      setLoading(false)
      if (onLogin) onLogin({ email })
    }, 800)
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center text-sm leading-[1.45] text-fg font-sans bg-bg-0 bg-[radial-gradient(1200px_600px_at_20%_-10%,rgb(96_165_250/0.06),transparent_60%),radial-gradient(900px_500px_at_110%_10%,rgb(167_139_250/0.05),transparent_60%),var(--color-bg-0)] [&_*]:box-border [&_*:focus-visible]:outline-2 [&_*:focus-visible]:outline-blue [&_*:focus-visible]:outline-offset-2 [&_*:focus-visible]:rounded"
    >
      <div className="w-full max-w-[400px] px-4 flex flex-col gap-6">

        {/* Brand */}
        <div className="flex flex-col items-center gap-3">
          <div
            className="w-14 h-14 grid place-items-center bg-gradient-to-br from-slate-800 to-[#0b1220] border border-border-strong rounded-2xl text-cyan shadow-[0_0_0_1px_rgb(94_234_212/0.08),inset_0_1px_0_rgb(255_255_255/0.04),0_8px_32px_rgb(0_0_0/0.5)]"
            aria-hidden="true"
          >
            <ShieldIcon />
          </div>
          <div className="flex flex-col items-center leading-tight gap-1">
            <strong className="text-[22px] tracking-wide text-fg">WebShield</strong>
            <span className="text-[11px] text-fg-dim uppercase tracking-widest">Security Operations Center</span>
          </div>
        </div>

        {/* Card */}
        <div
          className="flex flex-col gap-5 p-7 bg-gradient-to-b from-bg-2 to-bg-1 border border-border rounded-2xl shadow-[0_1px_0_rgb(255_255_255/0.03)_inset,0_8px_32px_rgb(0_0_0/0.4)]"
          role="main"
        >
          <div className="flex flex-col gap-1">
            <h1 className="m-0 text-[17px] font-semibold text-fg">Iniciar sesión</h1>
            <p className="m-0 text-[13px] text-fg-muted">Ingresa tus credenciales para continuar</p>
          </div>

          <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">

            {/* Email field */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="email" className="text-[12px] font-medium text-fg-muted uppercase tracking-wide">
                Correo electrónico
              </label>
              <div
                className="flex items-center gap-2.5 px-3 py-2.5 bg-bg-3 border border-border rounded-[10px] text-fg-muted transition-[border-color,background] duration-120 focus-within:border-blue focus-within:bg-bg-2"
              >
                <MailIcon />
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="admin@webshield.io"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="flex-1 bg-transparent border-0 text-fg text-[13px] outline-0 placeholder:text-fg-dim"
                />
              </div>
            </div>

            {/* Password field */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="text-[12px] font-medium text-fg-muted uppercase tracking-wide">
                  Contraseña
                </label>
                <button
                  type="button"
                  className="text-[11px] text-blue border-0 bg-transparent cursor-pointer p-0 hover:text-fg transition-colors duration-100"
                >
                  ¿Olvidaste tu contraseña?
                </button>
              </div>
              <div
                className="flex items-center gap-2.5 px-3 py-2.5 bg-bg-3 border border-border rounded-[10px] text-fg-muted transition-[border-color,background] duration-120 focus-within:border-blue focus-within:bg-bg-2"
              >
                <LockIcon />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="flex-1 bg-transparent border-0 text-fg text-[13px] outline-0 placeholder:text-fg-dim"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="border-0 bg-transparent cursor-pointer p-0 text-fg-dim hover:text-fg-muted transition-colors duration-100"
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  <EyeIcon off={showPassword} />
                </button>
              </div>
            </div>

            {/* Error message */}
            {error && (
              <div
                role="alert"
                className="flex items-center gap-2 px-3 py-2.5 bg-rose-soft border border-rose/30 rounded-[10px] text-[12px] text-rose animate-[fade-in_120ms_ease-out]"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="mt-1 w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue to-violet border border-blue/30 rounded-[10px] text-[13px] font-semibold text-white cursor-pointer shadow-[0_4px_16px_rgb(96_165_250/0.2)] hover:shadow-[0_4px_20px_rgb(96_165_250/0.35)] hover:brightness-110 transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
                    <path d="M21 12a9 9 0 1 1-6-8.5" />
                  </svg>
                  Verificando…
                </>
              ) : (
                'Iniciar sesión'
              )}
            </button>
          </form>
        </div>

        {/* Footer */}
        <p className="text-center text-[11px] text-fg-dim font-mono">
          webshield v0.1.0 · uso interno
        </p>
      </div>
    </div>
  )
}
