const W = 720
const H = 260
const PAD = { t: 16, r: 16, b: 32, l: 44 }

function buildArea(values, scaleX, scaleY, baseline) {
  const top = values.map((v, i) => `${i === 0 ? 'M' : 'L'}${scaleX(i)},${scaleY(v + (baseline?.[i] ?? 0))}`).join(' ')
  const bottomBase = baseline ?? values.map(() => 0)
  const bot = bottomBase
    .slice()
    .reverse()
    .map((v, i) => `L${scaleX(bottomBase.length - 1 - i)},${scaleY(v)}`)
    .join(' ')
  return `${top} ${bot} Z`
}

export default function TrafficTimeline({ data }) {
  const buckets = data.buckets
  const n = buckets.length
  const valid = buckets.map((b) => b.valid)
  const anom = buckets.map((b) => b.anomalous)
  const stacked = valid.map((v, i) => v + anom[i])
  const peak = stacked.length ? Math.max(...stacked) : 0
  const maxY = Math.max(peak, 1) * 1.05

  const innerW = W - PAD.l - PAD.r
  const innerH = H - PAD.t - PAD.b
  const scaleX = (i) => PAD.l + (n <= 1 ? 0 : (i / (n - 1)) * innerW)
  const scaleY = (v) => PAD.t + innerH - (v / maxY) * innerH

  const validPath = buildArea(valid, scaleX, scaleY, null)
  const anomPath = buildArea(anom, scaleX, scaleY, valid)
  const validLine = valid.map((v, i) => `${i === 0 ? 'M' : 'L'}${scaleX(i)},${scaleY(v)}`).join(' ')
  const totalLine = stacked.map((v, i) => `${i === 0 ? 'M' : 'L'}${scaleX(i)},${scaleY(v)}`).join(' ')

  const yTicks = 4
  const tickValues = Array.from({ length: yTicks + 1 }, (_, i) => Math.round((maxY / yTicks) * i))
  const xTickEvery = Math.ceil(n / 8)

  return (
    <section
      className="bg-gradient-to-b from-bg-2 to-bg-1 border border-border rounded-[14px] px-[18px] pt-[18px] pb-4 shadow-panel flex flex-col gap-3.5 min-w-0 min-h-80"
      aria-labelledby="timeline-title"
    >
      <header className="flex items-start justify-between gap-4">
        <div>
          <h2 id="timeline-title" className="m-0 text-sm font-semibold tracking-wide text-fg flex items-center gap-2.5">
            Tráfico en 24h
          </h2>
          <p className="mt-0.5 mb-0 text-[11px] text-fg-dim">
            Requests por hora, válidos vs anómalos (clasificación del WAF).
          </p>
        </div>
        <div className="flex gap-3.5 text-[11px] text-fg-muted">
          <span className="flex items-center gap-1.5">
            <i className="inline-block w-2.5 h-2.5 rounded-sm bg-cyan" />
            Válido
          </span>
          <span className="flex items-center gap-1.5">
            <i className="inline-block w-2.5 h-2.5 rounded-sm bg-rose" />
            Anómalo
          </span>
        </div>
      </header>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Gráfica de tráfico apilada">
        {tickValues.map((tv, i) => {
          const y = scaleY(tv)
          return (
            <g key={`y-${i}`}>
              <line x1={PAD.l} x2={W - PAD.r} y1={y} y2={y} className="stroke-border [stroke-dasharray:2_4]" />
              <text x={PAD.l - 8} y={y + 4} textAnchor="end" className="text-[10px] fill-fg-dim font-mono">
                {tv}
              </text>
            </g>
          )
        })}
        <path d={validPath} className="fill-cyan opacity-10 stroke-none" />
        <path d={anomPath} className="fill-rose opacity-[0.18] stroke-none" />
        <path d={validLine} className="fill-none stroke-cyan stroke-[1.6]" />
        <path d={totalLine} className="fill-none stroke-rose stroke-[1.6]" />
        {buckets.map((b, i) => {
          if (i % xTickEvery !== 0 && i !== n - 1) return null
          return (
            <text key={`x-${i}`} x={scaleX(i)} y={H - PAD.b + 18} textAnchor="middle" className="text-[10px] fill-fg-dim font-mono">
              {b.label}
            </text>
          )
        })}
      </svg>
    </section>
  )
}
