import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'

function formatEventCode(event) {
  if (!event.id) return '—'
  return event.id.length > 12 ? `${event.id.slice(0, 8)}…` : event.id
}

function formatTs(s) {
  try {
    return new Date(s).toLocaleString(undefined, { hour12: false })
  } catch {
    return String(s ?? '')
  }
}

function methodBadgeClass(method) {
  const m = (method ?? '').toLowerCase()
  if (m === 'get') return 'inline-block font-mono text-[10px] font-bold px-1.5 py-0.5 rounded-sm tracking-wide bg-blue-soft text-blue'
  if (m === 'post') return 'inline-block font-mono text-[10px] font-bold px-1.5 py-0.5 rounded-sm tracking-wide bg-violet-soft text-violet'
  if (m === 'put') return 'inline-block font-mono text-[10px] font-bold px-1.5 py-0.5 rounded-sm tracking-wide bg-amber-soft text-amber'
  return 'inline-block font-mono text-[10px] font-bold px-1.5 py-0.5 rounded-sm tracking-wide bg-rose-soft text-rose'
}

export default function EventDrawer({ event, onClose }) {
  const { t } = useTranslation()

  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape') onClose()
    }
    if (event) window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [event, onClose])

  if (!event) return null

  const headers = event.headers && typeof event.headers === 'object' ? event.headers : {}
  const headerEntries = Object.entries(headers)

  return (
    <>
      <div
        className="fixed inset-0 bg-[rgb(2_6_16/0.55)] backdrop-blur-[2px] z-40 animate-fade-in motion-reduce:animate-none"
        onClick={onClose}
        aria-hidden="true"
      />
      <aside
        className="fixed top-0 right-0 bottom-0 w-[min(560px,95vw)] bg-gradient-to-b from-bg-2 to-bg-1 border-l border-border shadow-[-16px_0_40px_rgb(0_0_0/0.45)] z-50 flex flex-col animate-slide-in motion-reduce:animate-none"
        role="dialog"
        aria-modal="true"
        aria-labelledby="drawer-title"
      >
        <header className="p-5 border-b border-border flex justify-between gap-4">
          <div>
            <p className="m-0 mb-1 text-[10px] tracking-wider uppercase text-fg-dim font-mono" title={event.id}>
              {t('drawer.event')} {formatEventCode(event)}
            </p>
            <h2 id="drawer-title" className="m-0 text-sm font-semibold flex items-center gap-2.5 flex-wrap">
              <span className={methodBadgeClass(event.method)}>{event.method}</span>
              <code className="font-mono bg-bg-3 px-1.5 py-[3px] rounded text-xs break-all">{event.uri}</code>
            </h2>
            <p className="mt-2 mb-0 text-[11px] text-fg-muted">
              <span className="font-mono text-xs">{event.ip}</span> · <span>{formatTs(event.ts)}</span> ·{' '}
              <span>{t('drawer.score')} {Number(event.score).toFixed(2)}</span>
            </p>
          </div>
          <button
            type="button"
            className="bg-transparent border border-border text-fg-muted w-8 h-8 rounded-lg text-lg cursor-pointer shrink-0 hover:text-fg hover:bg-bg-3"
            onClick={onClose}
            aria-label={t('drawer.close')}
          >
            ×
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-5">
          <div className="mb-[22px]">
            <h3 className="m-0 mb-2.5 text-[11px] tracking-wider uppercase text-fg-dim font-semibold">{t('drawer.summary')}</h3>
            <dl className="m-0 flex flex-col gap-1">
              <div className="flex justify-between items-baseline py-1.5 border-b border-dashed border-border text-xs last:border-b-0">
                <dt className="text-fg-muted">{t('drawer.event')}</dt>
                <dd className="font-mono text-xs m-0 text-fg" title={event.id}>{formatEventCode(event)}</dd>
              </div>
              <div className="flex justify-between items-baseline py-1.5 border-b border-dashed border-border text-xs last:border-b-0">
                <dt className="text-fg-muted">{t('drawer.timestamp')}</dt>
                <dd className="font-mono text-xs m-0 text-fg">{formatTs(event.ts)}</dd>
              </div>
              <div className="flex justify-between items-baseline py-1.5 border-b border-dashed border-border text-xs last:border-b-0">
                <dt className="text-fg-muted">{t('drawer.sourceIp')}</dt>
                <dd className="font-mono text-xs m-0 text-fg">{event.ip}</dd>
              </div>
              <div className="flex justify-between items-baseline py-1.5 border-b border-dashed border-border text-xs last:border-b-0">
                <dt className="text-fg-muted">{t('drawer.method')}</dt>
                <dd className="m-0">
                  <span className={methodBadgeClass(event.method)}>{event.method}</span>
                </dd>
              </div>
              <div className="flex justify-between items-baseline py-1.5 border-b border-dashed border-border text-xs last:border-b-0">
                <dt className="text-fg-muted">{t('drawer.uri')}</dt>
                <dd className="m-0 text-fg">
                  <code>{event.uri}</code>
                </dd>
              </div>
              <div className="flex justify-between items-baseline py-1.5 border-b border-dashed border-border text-xs last:border-b-0">
                <dt className="text-fg-muted">{t('drawer.verdict')}</dt>
                <dd className="m-0">
                  <span
                    className={
                      event.verdict === 'valid'
                        ? 'inline-block text-[10px] font-bold px-[7px] py-[3px] rounded font-mono tracking-wide bg-cyan-soft text-cyan'
                        : 'inline-block text-[10px] font-bold px-[7px] py-[3px] rounded font-mono tracking-wide bg-rose-soft text-rose'
                    }
                  >
                    {event.verdict === 'valid' ? t('live.verdict.valid') : t('live.verdict.anomalous')}
                  </span>
                </dd>
              </div>
              <div className="flex justify-between items-baseline py-1.5 border-b border-dashed border-border text-xs last:border-b-0">
                <dt className="text-fg-muted">{t('drawer.action')}</dt>
                <dd className="m-0">
                  <span
                    className={
                      event.action === 'blocked'
                        ? 'inline-block text-[10px] font-semibold px-1.5 py-0.5 rounded-sm tracking-wide font-mono border border-current text-rose'
                        : 'inline-block text-[10px] font-semibold px-1.5 py-0.5 rounded-sm tracking-wide font-mono border border-current text-cyan'
                    }
                  >
                    {event.action === 'blocked' ? t('live.action.blocked') : t('live.action.allowed')}
                  </span>
                </dd>
              </div>
              <div className="flex justify-between items-baseline py-1.5 border-b border-dashed border-border text-xs last:border-b-0">
                <dt className="text-fg-muted">{t('drawer.score')}</dt>
                <dd className="font-mono text-xs m-0 text-fg">{Number(event.score).toFixed(2)}</dd>
              </div>
            </dl>
          </div>

          <div className="mb-[22px]">
            <h3 className="m-0 mb-2.5 text-[11px] tracking-wider uppercase text-fg-dim font-semibold">{t('drawer.headers')}</h3>
            {headerEntries.length === 0 ? (
              <p className="m-0 text-[11px] text-fg-dim">{t('drawer.noHeaders')}</p>
            ) : (
              <table className="w-full border-collapse text-xs">
                <tbody>
                  {headerEntries.map(([k, v]) => (
                    <tr key={k}>
                      <td className="font-mono text-[11px] text-fg-muted px-2 py-1.5 border-b border-border align-top whitespace-nowrap">
                        {k}
                      </td>
                      <td className="font-mono text-[11px] text-fg px-2 py-1.5 border-b border-border align-top break-all">
                        {String(v)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {event.body && (
            <div className="mb-[22px]">
              <h3 className="m-0 mb-2.5 text-[11px] tracking-wider uppercase text-fg-dim font-semibold">{t('drawer.body')}</h3>
              <pre className="bg-rose-soft border border-rose rounded-md px-3 py-2.5 font-mono text-[11px] text-rose whitespace-pre-wrap break-all m-0 leading-normal max-h-[260px] overflow-y-auto">
                <code>{event.body}</code>
              </pre>
            </div>
          )}
        </div>
      </aside>
    </>
  )
}
