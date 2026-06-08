// Stacked area: válido (cyan) abajo, anómalo (rose) arriba.
// SVG puro, sin librería. Sustituible por recharts/visx cuando haya tiempo.

const W = 720
const H = 260
const PAD = { t: 16, r: 16, b: 32, l: 44 }

function buildArea(values, scaleX, scaleY, baseline) {
  const top = values.map((v, i) => `${i === 0 ? 'M' : 'L'}${scaleX(i)},${scaleY(v + (baseline?.[i] ?? 0))}`).join(' ')
  const bottomBase = (baseline ?? values.map(() => 0))
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
  const maxY = Math.max(...stacked) * 1.05

  const innerW = W - PAD.l - PAD.r
  const innerH = H - PAD.t - PAD.b
  const scaleX = (i) => PAD.l + (i / (n - 1)) * innerW
  const scaleY = (v) => PAD.t + innerH - (v / maxY) * innerH

  const validPath = buildArea(valid, scaleX, scaleY, null)
  const anomPath = buildArea(anom, scaleX, scaleY, valid)
  const validLine = valid.map((v, i) => `${i === 0 ? 'M' : 'L'}${scaleX(i)},${scaleY(v)}`).join(' ')
  const totalLine = stacked.map((v, i) => `${i === 0 ? 'M' : 'L'}${scaleX(i)},${scaleY(v)}`).join(' ')

  const yTicks = 4
  const tickValues = Array.from({ length: yTicks + 1 }, (_, i) => Math.round((maxY / yTicks) * i))
  const xTickEvery = Math.ceil(n / 8)

  return (
    <section className="panel panel--chart" aria-labelledby="timeline-title">
      <header className="panel__header">
        <div>
          <h2 id="timeline-title" className="panel__title">Tráfico en 24h</h2>
          <p className="panel__sub">Requests por hora, válidos vs anómalos (clasificación del WAF).</p>
        </div>
        <div className="legend">
          <span className="legend__item"><i className="legend__swatch legend__swatch--valid"></i>Válido</span>
          <span className="legend__item"><i className="legend__swatch legend__swatch--anom"></i>Anómalo</span>
        </div>
      </header>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Gráfica de tráfico apilada">
        {tickValues.map((tv, i) => {
          const y = scaleY(tv)
          return (
            <g key={`y-${i}`}>
              <line x1={PAD.l} x2={W - PAD.r} y1={y} y2={y} className="chart__grid" />
              <text x={PAD.l - 8} y={y + 4} textAnchor="end" className="chart__tick">{tv}</text>
            </g>
          )
        })}
        <path d={validPath} className="chart__area chart__area--valid" />
        <path d={anomPath} className="chart__area chart__area--anom" />
        <path d={validLine} className="chart__line chart__line--valid" />
        <path d={totalLine} className="chart__line chart__line--anom" />
        {buckets.map((b, i) => {
          if (i % xTickEvery !== 0 && i !== n - 1) return null
          return (
            <text key={`x-${i}`} x={scaleX(i)} y={H - PAD.b + 18} textAnchor="middle" className="chart__tick">
              {b.label}
            </text>
          )
        })}
      </svg>
    </section>
  )
}
