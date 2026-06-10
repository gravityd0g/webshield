import { useEffect, useMemo, useState } from 'react'

const TABS = [
  { id: 'request', label: 'Request' },
  { id: 'model', label: 'Modelo' },
  { id: 'triage', label: 'Triage' },
]

function buildAttackInfo(attackTypes) {
  return Object.fromEntries((attackTypes ?? []).map((t) => [t.id, { label: t.label, severity: t.severity }]))
}

function formatEventCode(event) {
  if (event.code) return event.code
  if (!event.id) return '—'
  return event.id.length > 12 ? `${event.id.slice(0, 8)}…` : event.id
}

const SEVERITY_CLASS = {
  1: 'bg-cyan-soft text-cyan',
  2: 'bg-cyan-soft text-cyan',
  3: 'bg-amber-soft text-amber',
  4: 'bg-rose-soft text-rose',
  5: 'bg-rose-soft text-rose',
}

function RequestTab({ event }) {
  return (
    <>
      <div className="mb-[22px]">
        <h3 className="m-0 mb-2.5 text-[11px] tracking-wider uppercase text-fg-dim font-semibold">Resumen</h3>
        <dl className="m-0 flex flex-col gap-1">
          <div className="flex justify-between items-baseline py-1.5 border-b border-dashed border-border text-xs last:border-b-0">
            <dt className="text-fg-muted">Evento</dt>
            <dd className="font-mono text-xs m-0 text-fg" title={event.id}>{formatEventCode(event)}</dd>
          </div>
          <div className="flex justify-between items-baseline py-1.5 border-b border-dashed border-border text-xs last:border-b-0">
            <dt className="text-fg-muted">Timestamp</dt>
            <dd className="font-mono text-xs m-0 text-fg">{event.ts}</dd>
          </div>
          <div className="flex justify-between items-baseline py-1.5 border-b border-dashed border-border text-xs last:border-b-0">
            <dt className="text-fg-muted">IP origen</dt>
            <dd className="font-mono text-xs m-0 text-fg">{event.ip}</dd>
          </div>
          <div className="flex justify-between items-baseline py-1.5 border-b border-dashed border-border text-xs last:border-b-0">
            <dt className="text-fg-muted">Método</dt>
            <dd className="m-0">
              <span
                className={
                  event.method.toLowerCase() === 'get'
                    ? 'inline-block font-mono text-[10px] font-bold px-1.5 py-0.5 rounded-sm tracking-wide bg-blue-soft text-blue'
                    : event.method.toLowerCase() === 'post'
                      ? 'inline-block font-mono text-[10px] font-bold px-1.5 py-0.5 rounded-sm tracking-wide bg-violet-soft text-violet'
                      : event.method.toLowerCase() === 'put'
                        ? 'inline-block font-mono text-[10px] font-bold px-1.5 py-0.5 rounded-sm tracking-wide bg-amber-soft text-amber'
                        : 'inline-block font-mono text-[10px] font-bold px-1.5 py-0.5 rounded-sm tracking-wide bg-rose-soft text-rose'
                }
              >
                {event.method}
              </span>
            </dd>
          </div>
          <div className="flex justify-between items-baseline py-1.5 border-b border-dashed border-border text-xs last:border-b-0">
            <dt className="text-fg-muted">URI</dt>
            <dd className="m-0 text-fg">
              <code>{event.uri}</code>
            </dd>
          </div>
        </dl>
      </div>
      <div className="mb-[22px]">
        <h3 className="m-0 mb-2.5 text-[11px] tracking-wider uppercase text-fg-dim font-semibold">Headers</h3>
        <pre className="bg-bg-3 border border-border rounded-md px-3 py-2.5 font-mono text-[11px] text-fg whitespace-pre-wrap break-all m-0 leading-normal max-h-[180px] overflow-y-auto">
          {Object.entries(event.headers).map(([k, v]) => `${k}: ${v}`).join('\n')}
        </pre>
      </div>
      {event.body && (
        <div className="mb-[22px]">
          <h3 className="m-0 mb-2.5 text-[11px] tracking-wider uppercase text-fg-dim font-semibold">Body</h3>
          <pre className="bg-rose-soft border border-rose rounded-md px-3 py-2.5 font-mono text-[11px] text-rose whitespace-pre-wrap break-all m-0 leading-normal max-h-[180px] overflow-y-auto">
            {event.body}
          </pre>
        </div>
      )}
    </>
  )
}

function ModelTab({ event, attackInfo }) {
  if (event.verdict === 'valid') {
    return (
      <div className="py-9 px-4 text-center text-fg-muted">
        <p>
          Request clasificado como <strong>válido</strong> (score {event.score.toFixed(2)}).
        </p>
        <p className="text-[11px] text-fg-dim mt-1.5">
          No se activó ninguna regla del CRS ni del modelo ML.
        </p>
      </div>
    )
  }
  const sortedFeatures = [...event.features].sort((a, b) => Math.abs(b.contribution) - Math.abs(a.contribution))
  const maxC = Math.max(...sortedFeatures.map((f) => Math.abs(f.contribution)), 0.01)
  const info = attackInfo[event.attackType]
  return (
    <>
      <div className="mb-[22px]">
        <h3 className="m-0 mb-2.5 text-[11px] tracking-wider uppercase text-fg-dim font-semibold">Decisión</h3>
        <div className="flex items-stretch gap-2">
          <div className="flex-1 p-2.5 px-3 bg-bg-3 rounded-lg border border-amber flex gap-2 text-[11px]">
            <span className="bg-bg-1 w-[18px] h-[18px] grid place-items-center rounded-full text-[10px] font-bold text-fg-dim shrink-0">
              1
            </span>
            <div>
              <strong className="block text-fg text-xs">Reglas determinísticas</strong>
              <p className="mt-1 mb-0 text-fg-muted font-mono text-[10px]">
                Regla disparada: <code className="bg-bg-1 px-[5px] py-px rounded-sm">{event.rule}</code>
              </p>
            </div>
          </div>
          <div className="self-center text-fg-dim text-sm" aria-hidden="true">→</div>
          <div className="flex-1 p-2.5 px-3 bg-bg-3 rounded-lg border border-amber flex gap-2 text-[11px]">
            <span className="bg-bg-1 w-[18px] h-[18px] grid place-items-center rounded-full text-[10px] font-bold text-fg-dim shrink-0">
              2
            </span>
            <div>
              <strong className="block text-fg text-xs">Modelo ML</strong>
              <p className="mt-1 mb-0 text-fg-muted font-mono text-[10px]">
                Score: <span className="font-mono text-xs">{event.score.toFixed(2)}</span> · clase: <strong>anomalous</strong>
              </p>
            </div>
          </div>
          <div className="self-center text-fg-dim text-sm" aria-hidden="true">→</div>
          <div className="flex-1 p-2.5 px-3 bg-rose-soft rounded-lg border border-rose flex gap-2 text-[11px]">
            <span className="bg-bg-1 w-[18px] h-[18px] grid place-items-center rounded-full text-[10px] font-bold text-fg-dim shrink-0">
              3
            </span>
            <div>
              <strong className="block text-fg text-xs">Acción</strong>
              <p className="mt-1 mb-0 text-rose font-mono text-[10px]">{event.action.toUpperCase()}</p>
            </div>
          </div>
        </div>
      </div>
      <div className="mb-[22px]">
        <h3 className="m-0 mb-2.5 text-[11px] tracking-wider uppercase text-fg-dim font-semibold">
          Tipo de ataque inferido
        </h3>
        <div className="flex items-center gap-2.5">
          <p className="m-0 text-sm font-semibold text-rose">{info?.label ?? event.attackType ?? '—'}</p>
          {info?.severity != null && (
            <span
              className={`inline-block text-[10px] font-bold px-[7px] py-[3px] rounded font-mono tracking-wide ${SEVERITY_CLASS[info.severity] ?? 'bg-bg-3 text-fg-muted'}`}
              title="Severidad del tipo de ataque (1-5)"
            >
              SEV {info.severity}/5
            </span>
          )}
        </div>
      </div>
      <div className="mb-[22px]">
        <h3 className="m-0 mb-2.5 text-[11px] tracking-wider uppercase text-fg-dim font-semibold">
          Contribución de features (top 5)
        </h3>
        <p className="mt-0.5 mb-0 text-[11px] text-fg-dim">
          Aporte de cada feature al score final. Ayuda al analista a entender por qué el modelo clasificó como anómalo.
        </p>
        <ul className="list-none m-0 p-0 flex flex-col gap-2">
          {sortedFeatures.map((f) => (
            <li key={f.name}>
              <div className="flex justify-between text-[11px] text-fg-muted">
                <code className="text-fg bg-bg-3 px-[5px] py-px rounded-sm">{f.name}</code>
                <span className="font-mono text-xs">val: {f.value} · +{f.contribution.toFixed(2)}</span>
              </div>
              <div className="h-[5px] bg-bg-3 rounded-sm overflow-hidden mt-1">
                <div
                  className="h-full bg-gradient-to-r from-amber to-rose"
                  style={{ width: `${(f.contribution / maxC) * 100}%` }}
                />
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
    <form className="mb-[22px] flex flex-col gap-3" onSubmit={(e) => e.preventDefault()}>
      <h3 className="m-0 mb-2.5 text-[11px] tracking-wider uppercase text-fg-dim font-semibold">Marcar evento</h3>
      <div className="grid grid-cols-3 gap-2">
        <button
          type="button"
          className={
            verdict === 'tp'
              ? 'flex flex-col items-start gap-1 p-2.5 px-3 bg-rose-soft border border-rose rounded-lg text-fg cursor-pointer text-left text-xs transition-[border-color,background] duration-100 hover:border-border-strong'
              : 'flex flex-col items-start gap-1 p-2.5 px-3 bg-bg-3 border border-border rounded-lg text-fg cursor-pointer text-left text-xs transition-[border-color,background] duration-100 hover:border-border-strong'
          }
          onClick={() => setVerdict('tp')}
        >
          <strong>True Positive</strong>
          <span className="text-fg-muted text-[10px] font-normal">Confirmar ataque real</span>
        </button>
        <button
          type="button"
          className={
            verdict === 'fp'
              ? 'flex flex-col items-start gap-1 p-2.5 px-3 bg-cyan-soft border border-cyan rounded-lg text-fg cursor-pointer text-left text-xs transition-[border-color,background] duration-100 hover:border-border-strong'
              : 'flex flex-col items-start gap-1 p-2.5 px-3 bg-bg-3 border border-border rounded-lg text-fg cursor-pointer text-left text-xs transition-[border-color,background] duration-100 hover:border-border-strong'
          }
          onClick={() => setVerdict('fp')}
        >
          <strong>False Positive</strong>
          <span className="text-fg-muted text-[10px] font-normal">Era tráfico legítimo</span>
        </button>
        <button
          type="button"
          className={
            verdict === 'esc'
              ? 'flex flex-col items-start gap-1 p-2.5 px-3 bg-amber-soft border border-amber rounded-lg text-fg cursor-pointer text-left text-xs transition-[border-color,background] duration-100 hover:border-border-strong'
              : 'flex flex-col items-start gap-1 p-2.5 px-3 bg-bg-3 border border-border rounded-lg text-fg cursor-pointer text-left text-xs transition-[border-color,background] duration-100 hover:border-border-strong'
          }
          onClick={() => setVerdict('esc')}
        >
          <strong>Escalar</strong>
          <span className="text-fg-muted text-[10px] font-normal">Requiere revisión admin</span>
        </button>
      </div>

      <label className="flex flex-col gap-1.5 text-[11px] text-fg-muted">
        <span>Severidad ({severity}/5)</span>
        <input
          type="range"
          min="1"
          max="5"
          value={severity}
          onChange={(e) => setSeverity(Number(e.target.value))}
          className="accent-blue"
        />
      </label>

      <label className="flex flex-col gap-1.5 text-[11px] text-fg-muted">
        <span>Comentario</span>
        <textarea
          rows={3}
          placeholder="Notas para el equipo (queda en el audit log)…"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          className="bg-bg-3 border border-border rounded-md px-2.5 py-2 text-fg font-[inherit] text-xs resize-y outline-0 focus:border-blue"
        />
      </label>

      <div className="flex justify-between gap-2 pt-2 border-t border-border">
        <button
          type="button"
          className="bg-transparent border border-border text-fg-muted px-3.5 py-2 rounded-[7px] text-xs font-semibold cursor-pointer hover:text-fg"
        >
          Ver eventos de {event.ip}
        </button>
        <button
          type="submit"
          className="bg-blue text-bg-0 border border-blue px-3.5 py-2 rounded-[7px] text-xs font-semibold cursor-pointer hover:brightness-110 disabled:bg-bg-3 disabled:text-fg-dim disabled:border-border disabled:cursor-not-allowed"
          disabled={!verdict}
        >
          Guardar triage
        </button>
      </div>
    </form>
  )
}

export default function EventDrawer({ event, attackTypes, onClose }) {
  const [tab, setTab] = useState('request')
  const attackInfo = useMemo(() => buildAttackInfo(attackTypes), [attackTypes])

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
              Evento {formatEventCode(event)}
            </p>
            <h2 id="drawer-title" className="m-0 text-sm font-semibold flex items-center gap-2.5 flex-wrap">
              <span
                className={
                  event.method.toLowerCase() === 'get'
                    ? 'inline-block font-mono text-[10px] font-bold px-1.5 py-0.5 rounded-sm tracking-wide bg-blue-soft text-blue'
                    : event.method.toLowerCase() === 'post'
                      ? 'inline-block font-mono text-[10px] font-bold px-1.5 py-0.5 rounded-sm tracking-wide bg-violet-soft text-violet'
                      : event.method.toLowerCase() === 'put'
                        ? 'inline-block font-mono text-[10px] font-bold px-1.5 py-0.5 rounded-sm tracking-wide bg-amber-soft text-amber'
                        : 'inline-block font-mono text-[10px] font-bold px-1.5 py-0.5 rounded-sm tracking-wide bg-rose-soft text-rose'
                }
              >
                {event.method}
              </span>
              <code className="font-mono bg-bg-3 px-1.5 py-[3px] rounded text-xs break-all">{event.uri}</code>
            </h2>
            <p className="mt-2 mb-0 text-[11px] text-fg-muted">
              <span className="font-mono text-xs">{event.ip}</span> · <span>{event.ts}</span> ·{' '}
              <span>score {event.score.toFixed(2)}</span>
            </p>
          </div>
          <button
            type="button"
            className="bg-transparent border border-border text-fg-muted w-8 h-8 rounded-lg text-lg cursor-pointer shrink-0 hover:text-fg hover:bg-bg-3"
            onClick={onClose}
            aria-label="Cerrar"
          >
            ×
          </button>
        </header>

        <nav className="flex px-5 gap-1 border-b border-border bg-bg-1" role="tablist">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={tab === t.id}
              className={
                tab === t.id
                  ? 'relative bg-transparent border-0 px-3.5 py-3 text-xs font-semibold cursor-pointer tracking-wide text-fg after:content-[""] after:absolute after:-bottom-px after:left-3.5 after:right-3.5 after:h-0.5 after:bg-blue after:rounded-sm'
                  : 'relative bg-transparent border-0 px-3.5 py-3 text-xs font-semibold cursor-pointer tracking-wide text-fg-muted hover:text-fg'
              }
              onClick={() => setTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </nav>

        <div className="flex-1 overflow-y-auto p-5" role="tabpanel">
          {tab === 'request' && <RequestTab event={event} />}
          {tab === 'model' && <ModelTab event={event} attackInfo={attackInfo} />}
          {tab === 'triage' && <TriageTab event={event} />}
        </div>
      </aside>
    </>
  )
}
