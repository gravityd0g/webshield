import { useTranslation } from 'react-i18next'

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

function EmptyDonut() {
  const { t } = useTranslation()
  return (
    <section
      className="bg-gradient-to-b from-bg-2 to-bg-1 border border-border rounded-[14px] px-[18px] pt-[18px] pb-4 shadow-panel flex flex-col gap-3.5 min-w-0 min-h-80"
      aria-labelledby="attacks-title"
    >
      <header className="flex items-start justify-between gap-4">
        <div>
          <h2 id="attacks-title" className="m-0 text-sm font-semibold tracking-wide text-fg">
            {t('chart.attackTitle')}
          </h2>
          <p className="mt-0.5 mb-0 text-[11px] text-fg-dim">{t('chart.attackEmpty')}</p>
        </div>
      </header>
    </section>
  )
}

export default function AttackDonut({ data }) {
  const { t } = useTranslation()
  if (!data?.length) return <EmptyDonut />
  const total = data.reduce((s, d) => s + d.value, 0)
  if (total <= 0) return <EmptyDonut />

  let cursor = 0
  const segments = data.map((d) => {
    const start = (cursor / total) * 360
    cursor += d.value
    const end = (cursor / total) * 360
    return { ...d, start, end }
  })
  const top = data[0]

  return (
    <section
      className="bg-gradient-to-b from-bg-2 to-bg-1 border border-border rounded-[14px] px-[18px] pt-[18px] pb-4 shadow-panel flex flex-col gap-3.5 min-w-0 min-h-80"
      aria-labelledby="attacks-title"
    >
      <header className="flex items-start justify-between gap-4">
        <div>
          <h2 id="attacks-title" className="m-0 text-sm font-semibold tracking-wide text-fg flex items-center gap-2.5">
            {t('chart.attackTitle')}
          </h2>
          <p className="mt-0.5 mb-0 text-[11px] text-fg-dim">{t('chart.attackSubtitle')}</p>
        </div>
      </header>
      <div className="flex flex-col items-center gap-4">
        <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className="w-[180px] h-[180px] shrink-0" role="img" aria-label={t('chart.attackTitle')}>
          <circle cx={CX} cy={CY} r={RADIUS} fill="none" stroke="var(--color-border)" strokeWidth={STROKE} />
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
          <text x={CX} y={CY - 4} textAnchor="middle" className="font-mono text-[26px] font-bold fill-fg">
            {top.value}%
          </text>
          <text x={CX} y={CY + 18} textAnchor="middle" className="text-[11px] fill-fg-muted uppercase tracking-wider">
            {top.label}
          </text>
        </svg>
        <ul className="list-none m-0 p-0 w-full grid grid-cols-2 gap-x-3 gap-y-0.5 min-[1400px]:grid-cols-1">
          {data.map((d) => (
            <li
              key={d.id}
              className="grid grid-cols-[10px_1fr_auto] items-center gap-2 text-[11.5px] px-1.5 py-1 rounded min-w-0 hover:bg-surface-hover"
            >
              <span className="w-2.5 h-2.5 rounded-sm" style={{ background: d.color }} />
              <span className="text-fg truncate">{d.label}</span>
              <span className="text-fg-muted font-mono font-semibold text-[11px]">{d.value}%</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
