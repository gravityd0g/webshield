import { useState } from 'react'
import { useTranslation } from 'react-i18next'

function ScoreCell({ score }) {
  const safe = Number.isFinite(score) ? score : 0
  const pct = Math.round(safe * 100)
  return (
    <div className="flex items-center gap-2 min-w-[120px]">
      <div className="flex-1 h-[5px] bg-bg-3 rounded-sm overflow-hidden">
        <div
          className={
            safe >= 0.7
              ? 'h-full rounded-sm bg-rose'
              : safe >= 0.4
                ? 'h-full rounded-sm bg-amber'
                : 'h-full rounded-sm bg-cyan'
          }
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="font-mono text-xs">{safe.toFixed(2)}</span>
    </div>
  )
}

function truncate(str = '', max = 56) {
  const s = String(str ?? '')
  return s.length <= max ? s : s.slice(0, max - 1) + '…'
}

const formatTs = (s) => {
  const d = new Date(s)
  if (Number.isNaN(d.getTime())) return String(s ?? '—')
  return d.toLocaleTimeString(undefined, { hour12: false })
}

export default function LiveEvents({ events, onSelectEvent, paused, onTogglePause }) {
  const { t } = useTranslation()
  const [filter, setFilter] = useState('all')

  const filtered = (events ?? []).filter((e) => {
    if (filter === 'all') return true
    if (filter === 'anomalous') return e.verdict === 'anomalous'
    return true
  })

  const filters = [
    { id: 'all', label: t('live.filterAll') },
    { id: 'anomalous', label: t('live.filterAnomalous') },
  ]

  return (
    <section
      className="bg-gradient-to-b from-bg-2 to-bg-1 border border-border rounded-[14px] px-[18px] pt-[18px] pb-4 shadow-panel flex flex-col gap-3.5 min-w-0 w-full"
      aria-labelledby="live-events-title"
    >
      <header className="flex items-start justify-between gap-4">
        <div>
          <h2 id="live-events-title" className="m-0 text-sm font-semibold tracking-wide text-fg flex items-center gap-2.5">
            {t('live.title')}
            <span
              className={
                paused
                  ? 'w-2 h-2 rounded-full bg-amber shadow-[0_0_0_3px_var(--color-amber-soft)] motion-reduce:animate-none'
                  : 'w-2 h-2 rounded-full bg-rose animate-pulse-rose motion-reduce:animate-none'
              }
              aria-label={paused ? t('live.paused') : t('live.live')}
            />
          </h2>
          <p className="mt-0.5 mb-0 text-[11px] text-fg-dim">
            {t('live.subtitle')}
          </p>
        </div>
        <div className="flex gap-2 items-center">
          <div className="flex bg-bg-3 border border-border rounded-[7px] p-0.5" role="group" aria-label={t('live.filtersAriaLabel')}>
            {filters.map((f) => (
              <button
                key={f.id}
                type="button"
                className={
                  filter === f.id
                    ? 'border-0 px-2.5 py-1 text-[11px] font-medium rounded-[5px] cursor-pointer bg-bg-1 text-fg'
                    : 'border-0 px-2.5 py-1 text-[11px] font-medium rounded-[5px] cursor-pointer bg-transparent text-fg-muted'
                }
                onClick={() => setFilter(f.id)}
              >
                {f.label}
              </button>
            ))}
          </div>
          <button
            type="button"
            className={
              paused
                ? 'bg-amber-soft text-amber border border-amber rounded-md px-2.5 py-[5px] text-[11px] cursor-pointer hover:text-amber'
                : 'bg-bg-3 text-fg-muted border border-border rounded-md px-2.5 py-[5px] text-[11px] cursor-pointer hover:text-fg'
            }
            onClick={onTogglePause}
          >
            {paused ? t('live.resume') : t('live.pause')}
          </button>
        </div>
      </header>

      <div className="relative overflow-x-auto">
        <table className="w-full border-collapse text-xs">
          <thead>
            <tr>
              <th scope="col" className="text-left px-2.5 py-[9px] font-semibold text-[10px] uppercase tracking-wider text-fg-dim border-b border-border bg-bg-2 sticky top-0 z-[1]">
                {t('live.col.time')}
              </th>
              <th scope="col" className="text-left px-2.5 py-[9px] font-semibold text-[10px] uppercase tracking-wider text-fg-dim border-b border-border bg-bg-2 sticky top-0 z-[1]">
                {t('live.col.ip')}
              </th>
              <th scope="col" className="text-left px-2.5 py-[9px] font-semibold text-[10px] uppercase tracking-wider text-fg-dim border-b border-border bg-bg-2 sticky top-0 z-[1]">
                {t('live.col.method')}
              </th>
              <th scope="col" className="text-left px-2.5 py-[9px] font-semibold text-[10px] uppercase tracking-wider text-fg-dim border-b border-border bg-bg-2 sticky top-0 z-[1]">
                {t('live.col.uri')}
              </th>
              <th scope="col" className="text-left px-2.5 py-[9px] font-semibold text-[10px] uppercase tracking-wider text-fg-dim border-b border-border bg-bg-2 sticky top-0 z-[1]">
                {t('live.col.verdict')}
              </th>
              <th scope="col" className="text-left px-2.5 py-[9px] font-semibold text-[10px] uppercase tracking-wider text-fg-dim border-b border-border bg-bg-2 sticky top-0 z-[1]">
                {t('live.col.score')}
              </th>
              <th scope="col" className="text-left px-2.5 py-[9px] font-semibold text-[10px] uppercase tracking-wider text-fg-dim border-b border-border bg-bg-2 sticky top-0 z-[1]">
                {t('live.col.action')}
              </th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((evt) => (
              <tr
                key={evt.id}
                className={
                  evt.verdict === 'anomalous'
                    ? 'cursor-pointer transition-colors duration-80 outline-0 focus:[&>td]:bg-surface-hover focus:[&>td]:shadow-[inset_2px_0_0_var(--color-blue)] hover:[&>td]:bg-surface-hover [&>td:first-child]:shadow-[inset_3px_0_0_var(--color-rose)]'
                    : 'cursor-pointer transition-colors duration-80 outline-0 focus:[&>td]:bg-surface-hover focus:[&>td]:shadow-[inset_2px_0_0_var(--color-blue)] hover:[&>td]:bg-surface-hover [&>td:first-child]:shadow-[inset_3px_0_0_var(--color-cyan)]'
                }
                onClick={() => onSelectEvent(evt)}
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    onSelectEvent(evt)
                  }
                }}
              >
                <td className="font-mono text-xs text-fg-dim px-2.5 py-[9px] border-b border-border align-middle">
                  {formatTs(evt.ts)}
                </td>
                <td className="font-mono text-xs px-2.5 py-[9px] border-b border-border align-middle">{evt.ip}</td>
                <td className="px-2.5 py-[9px] border-b border-border align-middle">
                  <span
                    className={
                      (evt.method ?? '').toLowerCase() === 'get'
                        ? 'inline-block font-mono text-[10px] font-bold px-1.5 py-0.5 rounded-sm tracking-wide bg-blue-soft text-blue'
                        : (evt.method ?? '').toLowerCase() === 'post'
                          ? 'inline-block font-mono text-[10px] font-bold px-1.5 py-0.5 rounded-sm tracking-wide bg-violet-soft text-violet'
                          : (evt.method ?? '').toLowerCase() === 'put'
                            ? 'inline-block font-mono text-[10px] font-bold px-1.5 py-0.5 rounded-sm tracking-wide bg-amber-soft text-amber'
                            : 'inline-block font-mono text-[10px] font-bold px-1.5 py-0.5 rounded-sm tracking-wide bg-rose-soft text-rose'
                    }
                  >
                    {evt.method}
                  </span>
                </td>
                <td className="px-2.5 py-[9px] border-b border-border align-middle">
                  <code className="font-mono text-[11px] bg-bg-3 text-fg px-1.5 py-0.5 rounded inline-block max-w-[360px] truncate align-middle">
                    {truncate(evt.uri)}
                  </code>
                </td>
                <td className="px-2.5 py-[9px] border-b border-border align-middle">
                  <span
                    className={
                      evt.verdict === 'valid'
                        ? 'inline-block text-[10px] font-bold px-[7px] py-[3px] rounded font-mono tracking-wide bg-cyan-soft text-cyan'
                        : 'inline-block text-[10px] font-bold px-[7px] py-[3px] rounded font-mono tracking-wide bg-rose-soft text-rose'
                    }
                  >
                    {evt.verdict === 'valid' ? t('live.verdict.valid') : t('live.verdict.anomalous')}
                  </span>
                </td>
                <td className="px-2.5 py-[9px] border-b border-border align-middle">
                  <ScoreCell score={evt.score} />
                </td>
                <td className="px-2.5 py-[9px] border-b border-border align-middle">
                  <span
                    className={
                      evt.action === 'blocked'
                        ? 'inline-block text-[10px] font-semibold px-1.5 py-0.5 rounded-sm tracking-wide font-mono border border-current text-rose'
                        : 'inline-block text-[10px] font-semibold px-1.5 py-0.5 rounded-sm tracking-wide font-mono border border-current text-cyan'
                    }
                  >
                    {evt.action === 'blocked' ? t('live.action.blocked') : t('live.action.allowed')}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {paused && (
          <div className="absolute top-10 left-1/2 -translate-x-1/2 px-3.5 py-1.5 bg-amber-soft text-amber border border-amber rounded-full text-[11px] font-semibold tracking-wide uppercase pointer-events-none">
            {t('live.pausedOverlay')}
          </div>
        )}
      </div>
    </section>
  )
}
