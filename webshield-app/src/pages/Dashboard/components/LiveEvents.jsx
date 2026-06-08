import { useState } from 'react'

const VERDICT_BADGE = {
  valid: { label: 'Valid', cls: 'badge badge--ok' },
  anomalous: { label: 'Anomalous', cls: 'badge badge--danger' },
}

const ACTION_ICON = {
  blocked: { label: 'BLOCKED', cls: 'tag tag--danger' },
  allowed: { label: 'ALLOWED', cls: 'tag tag--ok' },
  flagged: { label: 'FLAGGED', cls: 'tag tag--warn' },
}

const ATTACK_LABEL = {
  sqli: 'SQL Injection',
  xss: 'Cross-Site Scripting',
  traversal: 'Path Traversal',
  encoded: 'Encoded Payload',
  admin: 'Admin Probing',
  other: 'Other',
}

function ScoreCell({ score }) {
  const pct = Math.round(score * 100)
  const tone = score >= 0.7 ? 'danger' : score >= 0.4 ? 'warn' : 'ok'
  return (
    <div className={`score score--${tone}`}>
      <div className="score__bar"><div className="score__fill" style={{ width: `${pct}%` }}></div></div>
      <span className="mono">{score.toFixed(2)}</span>
    </div>
  )
}

function truncate(str, max = 56) {
  return str.length <= max ? str : str.slice(0, max - 1) + '…'
}

export default function LiveEvents({ events, onSelectEvent }) {
  const [paused, setPaused] = useState(false)
  const [filter, setFilter] = useState('all')

  const filtered = events.filter((e) => {
    if (filter === 'all') return true
    if (filter === 'anomalous') return e.verdict === 'anomalous'
    if (filter === 'blocked') return e.action === 'blocked'
    return true
  })

  return (
    <section className="panel panel--wide" aria-labelledby="live-events-title">
      <header className="panel__header">
        <div>
          <h2 id="live-events-title" className="panel__title">
            Live events
            <span className={`live-dot ${paused ? 'is-paused' : ''}`} aria-label={paused ? 'pausado' : 'en vivo'}></span>
          </h2>
          <p className="panel__sub">Stream de requests clasificados por el WAF — click para inspeccionar</p>
        </div>
        <div className="panel__controls">
          <div className="seg" role="group" aria-label="Filtros del stream">
            {[
              { id: 'all', label: 'Todos' },
              { id: 'anomalous', label: 'Anómalos' },
              { id: 'blocked', label: 'Bloqueados' },
            ].map((f) => (
              <button
                key={f.id}
                type="button"
                className={`seg__btn ${filter === f.id ? 'is-active' : ''}`}
                onClick={() => setFilter(f.id)}
              >
                {f.label}
              </button>
            ))}
          </div>
          <button
            type="button"
            className={`panel__action ${paused ? 'is-paused' : ''}`}
            onClick={() => setPaused((p) => !p)}
          >
            {paused ? '▶ Reanudar' : '⏸ Pausar'}
          </button>
        </div>
      </header>

      <div className="events">
        <table className="events__table">
          <thead>
            <tr>
              <th scope="col">Tiempo</th>
              <th scope="col">IP</th>
              <th scope="col">Método</th>
              <th scope="col">URI</th>
              <th scope="col">Verdict</th>
              <th scope="col">Score</th>
              <th scope="col">Acción</th>
              <th scope="col">Tipo</th>
              <th scope="col" className="events__rule">Regla</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((evt) => (
              <tr
                key={evt.id}
                className={`events__row events__row--${evt.verdict}`}
                onClick={() => onSelectEvent(evt)}
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    onSelectEvent(evt)
                  }
                }}
              >
                <td className="mono mono--dim">{evt.ts}</td>
                <td className="mono">{evt.ip}</td>
                <td><span className={`method method--${evt.method.toLowerCase()}`}>{evt.method}</span></td>
                <td><code className="events__uri">{truncate(evt.uri)}</code></td>
                <td><span className={VERDICT_BADGE[evt.verdict].cls}>{VERDICT_BADGE[evt.verdict].label}</span></td>
                <td><ScoreCell score={evt.score} /></td>
                <td><span className={ACTION_ICON[evt.action].cls}>{ACTION_ICON[evt.action].label}</span></td>
                <td>{evt.attackType ? ATTACK_LABEL[evt.attackType] : <span className="mono--dim">—</span>}</td>
                <td className="mono mono--dim events__rule">{evt.rule ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {paused && <div className="events__paused-overlay">Stream pausado · nuevos eventos en cola</div>}
      </div>
    </section>
  )
}
