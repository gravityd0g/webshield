function Sparkline({ points, accent }) {
  if (!points || points.length === 0) return null
  const w = 110
  const h = 36
  const min = Math.min(...points)
  const max = Math.max(...points)
  const range = max - min || 1
  const step = w / (points.length - 1)
  const coords = points.map((p, i) => [i * step, h - ((p - min) / range) * h])
  const path = coords.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`).join(' ')
  const area = `${path} L${w},${h} L0,${h} Z`
  return (
    <svg className="kpi__spark" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" aria-hidden="true">
      <path d={area} className={`kpi__spark-fill kpi__spark-fill--${accent}`} />
      <path d={path} className={`kpi__spark-line kpi__spark-line--${accent}`} />
    </svg>
  )
}

const DELTA_ICON = { up: '▲', down: '▼', flat: '·' }

export default function KpiCard({ label, value, delta, deltaDirection, period, sparkline, accent }) {
  return (
    <article className={`kpi kpi--${accent}`} tabIndex={0}>
      <header className="kpi__header">
        <span className="kpi__label">{label}</span>
        <span className={`kpi__delta kpi__delta--${deltaDirection}`}>
          <span aria-hidden="true">{DELTA_ICON[deltaDirection]}</span> {delta}
        </span>
      </header>
      <div className="kpi__value">{value}</div>
      <footer className="kpi__footer">
        <Sparkline points={sparkline} accent={accent} />
        <span className="kpi__period">{period}</span>
      </footer>
    </article>
  )
}
