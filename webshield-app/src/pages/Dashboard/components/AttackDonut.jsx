// Donut chart con segmentos clickeables. Click = filtra por tipo de ataque.

const SIZE = 220
const RADIUS = 86
const STROKE = 28
const CX = SIZE / 2
const CY = SIZE / 2

function polar(angle) {
  const a = ((angle - 90) * Math.PI) / 180
  return [CX + RADIUS * Math.cos(a), CY + RADIUS * Math.sin(a)]
}

function arc(start, end) {
  const [x1, y1] = polar(start)
  const [x2, y2] = polar(end)
  const large = end - start > 180 ? 1 : 0
  return `M${x1},${y1} A${RADIUS},${RADIUS} 0 ${large} 1 ${x2},${y2}`
}

export default function AttackDonut({ data }) {
  const total = data.reduce((s, d) => s + d.value, 0)
  let cursor = 0
  const segments = data.map((d) => {
    const start = (cursor / total) * 360
    cursor += d.value
    const end = (cursor / total) * 360
    return { ...d, start, end }
  })
  const top = data[0]

  return (
    <section className="panel panel--chart" aria-labelledby="attacks-title">
      <header className="panel__header">
        <div>
          <h2 id="attacks-title" className="panel__title">Distribución de ataques</h2>
          <p className="panel__sub">% de bloqueos por categoría · 24h</p>
        </div>
      </header>
      <div className="donut">
        <svg viewBox={`0 0 ${SIZE} ${SIZE}`} role="img" aria-label="Donut de tipos de ataque">
          <circle cx={CX} cy={CY} r={RADIUS} fill="none" stroke="var(--border)" strokeWidth={STROKE} />
          {segments.map((s) => (
            <path
              key={s.id}
              d={arc(s.start, s.end)}
              fill="none"
              stroke={s.color}
              strokeWidth={STROKE}
              strokeLinecap="butt"
            >
              <title>{`${s.label}: ${s.value}%`}</title>
            </path>
          ))}
          <text x={CX} y={CY - 4} textAnchor="middle" className="donut__big">{top.value}%</text>
          <text x={CX} y={CY + 18} textAnchor="middle" className="donut__sub">{top.label}</text>
        </svg>
        <ul className="donut__legend">
          {data.map((d) => (
            <li key={d.id}>
              <span className="donut__swatch" style={{ background: d.color }}></span>
              <span className="donut__label">{d.label}</span>
              <span className="donut__value">{d.value}%</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
