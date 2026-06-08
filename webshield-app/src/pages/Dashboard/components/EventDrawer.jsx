import { useEffect, useState } from 'react'

const TABS = [
  { id: 'request', label: 'Request' },
  { id: 'model', label: 'Modelo' },
  { id: 'triage', label: 'Triage' },
]

const ATTACK_LABEL = {
  sqli: 'SQL Injection',
  xss: 'Cross-Site Scripting',
  traversal: 'Path Traversal',
  encoded: 'Encoded Payload',
  admin: 'Admin Probing',
  other: 'Other',
}

function RequestTab({ event }) {
  return (
    <>
      <div className="drawer__section">
        <h3>Resumen</h3>
        <dl className="kv">
          <div className="kv__row"><dt>Evento</dt><dd className="mono">{event.id}</dd></div>
          <div className="kv__row"><dt>Timestamp</dt><dd className="mono">{event.ts}</dd></div>
          <div className="kv__row"><dt>IP origen</dt><dd className="mono">{event.ip}</dd></div>
          <div className="kv__row"><dt>Método</dt><dd><span className={`method method--${event.method.toLowerCase()}`}>{event.method}</span></dd></div>
          <div className="kv__row"><dt>URI</dt><dd><code>{event.uri}</code></dd></div>
        </dl>
      </div>
      <div className="drawer__section">
        <h3>Headers</h3>
        <pre className="codeblock">{Object.entries(event.headers).map(([k, v]) => `${k}: ${v}`).join('\n')}</pre>
      </div>
      {event.body && (
        <div className="drawer__section">
          <h3>Body</h3>
          <pre className="codeblock codeblock--danger">{event.body}</pre>
        </div>
      )}
    </>
  )
}

function ModelTab({ event }) {
  if (event.verdict === 'valid') {
    return (
      <div className="drawer__empty">
        <p>Request clasificado como <strong>válido</strong> (score {event.score.toFixed(2)}).</p>
        <p className="drawer__empty-sub">No se activó ninguna regla del CRS ni del modelo ML.</p>
      </div>
    )
  }
  const maxC = Math.max(...event.features.map((f) => Math.abs(f.contribution)), 0.01)
  return (
    <>
      <div className="drawer__section">
        <h3>Decisión</h3>
        <div className="decision-flow">
          <div className="decision-flow__step decision-flow__step--matched">
            <span className="decision-flow__badge">1</span>
            <div>
              <strong>Reglas determinísticas</strong>
              <p>Regla disparada: <code>{event.rule}</code></p>
            </div>
          </div>
          <div className="decision-flow__arrow" aria-hidden="true">→</div>
          <div className="decision-flow__step decision-flow__step--matched">
            <span className="decision-flow__badge">2</span>
            <div>
              <strong>Modelo ML</strong>
              <p>Score: <span className="mono">{event.score.toFixed(2)}</span> · clase: <strong>anomalous</strong></p>
            </div>
          </div>
          <div className="decision-flow__arrow" aria-hidden="true">→</div>
          <div className="decision-flow__step decision-flow__step--final">
            <span className="decision-flow__badge">3</span>
            <div>
              <strong>Acción</strong>
              <p>{event.action.toUpperCase()}</p>
            </div>
          </div>
        </div>
      </div>
      <div className="drawer__section">
        <h3>Tipo de ataque inferido</h3>
        <p className="drawer__attack-type">{ATTACK_LABEL[event.attackType] ?? '—'}</p>
      </div>
      <div className="drawer__section">
        <h3>Contribución de features (top 5)</h3>
        <p className="panel__sub">Aporte de cada feature al score final. Ayuda al analista a entender por qué el modelo clasificó como anómalo.</p>
        <ul className="features">
          {event.features.map((f) => (
            <li key={f.name}>
              <div className="features__head">
                <code>{f.name}</code>
                <span className="mono">val: {f.value} · +{f.contribution.toFixed(2)}</span>
              </div>
              <div className="features__bar">
                <div className="features__fill" style={{ width: `${(f.contribution / maxC) * 100}%` }}></div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </>
  )
}

function TriageTab({ event }) {
  const [verdict, setVerdict] = useState(null)
  const [severity, setSeverity] = useState(3)
  const [comment, setComment] = useState('')
  return (
    <form className="drawer__section drawer__triage" onSubmit={(e) => e.preventDefault()}>
      <h3>Marcar evento</h3>
      <div className="triage-grid">
        <button type="button" className={`triage-btn triage-btn--tp ${verdict === 'tp' ? 'is-active' : ''}`} onClick={() => setVerdict('tp')}>
          <strong>True Positive</strong>
          <span>Confirmar ataque real</span>
        </button>
        <button type="button" className={`triage-btn triage-btn--fp ${verdict === 'fp' ? 'is-active' : ''}`} onClick={() => setVerdict('fp')}>
          <strong>False Positive</strong>
          <span>Era tráfico legítimo</span>
        </button>
        <button type="button" className={`triage-btn triage-btn--esc ${verdict === 'esc' ? 'is-active' : ''}`} onClick={() => setVerdict('esc')}>
          <strong>Escalar</strong>
          <span>Requiere revisión admin</span>
        </button>
      </div>

      <label className="field">
        <span>Severidad ({severity}/5)</span>
        <input type="range" min="1" max="5" value={severity} onChange={(e) => setSeverity(Number(e.target.value))} />
      </label>

      <label className="field">
        <span>Comentario</span>
        <textarea
          rows={3}
          placeholder="Notas para el equipo (queda en el audit log)…"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
        />
      </label>

      <div className="drawer__actions">
        <button type="button" className="btn btn--ghost">Ver eventos de {event.ip}</button>
        <button type="submit" className="btn btn--primary" disabled={!verdict}>Guardar triage</button>
      </div>
    </form>
  )
}

export default function EventDrawer({ event, onClose }) {
  const [tab, setTab] = useState('request')

  useEffect(() => {
    if (event) setTab('request')
  }, [event])

  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape') onClose()
    }
    if (event) window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [event, onClose])

  if (!event) return null

  return (
    <>
      <div className="drawer__scrim" onClick={onClose} aria-hidden="true"></div>
      <aside className="drawer" role="dialog" aria-modal="true" aria-labelledby="drawer-title">
        <header className="drawer__header">
          <div>
            <p className="drawer__eyebrow">Evento {event.id}</p>
            <h2 id="drawer-title" className="drawer__title">
              <span className={`method method--${event.method.toLowerCase()}`}>{event.method}</span>
              <code>{event.uri}</code>
            </h2>
            <p className="drawer__meta">
              <span className="mono">{event.ip}</span> · <span>{event.ts}</span> · <span>score {event.score.toFixed(2)}</span>
            </p>
          </div>
          <button type="button" className="drawer__close" onClick={onClose} aria-label="Cerrar">×</button>
        </header>

        <nav className="drawer__tabs" role="tablist">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={tab === t.id}
              className={`drawer__tab ${tab === t.id ? 'is-active' : ''}`}
              onClick={() => setTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </nav>

        <div className="drawer__body" role="tabpanel">
          {tab === 'request' && <RequestTab event={event} />}
          {tab === 'model' && <ModelTab event={event} />}
          {tab === 'triage' && <TriageTab event={event} />}
        </div>
      </aside>
    </>
  )
}
