function Sparkline({ points, accent }) {
  if (!points || points.length < 2) return null
  if (points.every((p) => p === 0)) return null
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
    <svg className="w-[110px] h-8" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" aria-hidden="true">
      <path
        d={area}
        className={
          accent === 'cyan'
            ? 'opacity-[0.18] stroke-none stroke-cyan fill-cyan'
            : accent === 'rose'
              ? 'opacity-[0.18] stroke-none stroke-rose fill-rose'
              : accent === 'amber'
                ? 'opacity-[0.18] stroke-none stroke-amber fill-amber'
                : accent === 'blue'
                  ? 'opacity-[0.18] stroke-none stroke-blue fill-blue'
                  : 'opacity-[0.18] stroke-none stroke-violet fill-violet'
        }
      />
      <path
        d={path}
        className={
          accent === 'cyan'
            ? 'fill-none stroke-[1.5] stroke-cyan'
            : accent === 'rose'
              ? 'fill-none stroke-[1.5] stroke-rose'
              : accent === 'amber'
                ? 'fill-none stroke-[1.5] stroke-amber'
                : accent === 'blue'
                  ? 'fill-none stroke-[1.5] stroke-blue'
                  : 'fill-none stroke-[1.5] stroke-violet'
        }
      />
    </svg>
  )
}

export default function KpiCard({ label, value, delta, deltaDirection, period, sparkline, accent }) {
  return (
    <article
      className={
        accent === 'cyan'
          ? "relative overflow-hidden bg-gradient-to-b from-bg-2 to-bg-1 border border-border rounded-[10px] px-4 py-3.5 flex flex-col gap-2 shadow-panel before:content-[''] before:absolute before:top-0 before:left-0 before:right-0 before:h-0.5 before:bg-current before:opacity-55 text-cyan"
          : accent === 'rose'
            ? "relative overflow-hidden bg-gradient-to-b from-bg-2 to-bg-1 border border-border rounded-[10px] px-4 py-3.5 flex flex-col gap-2 shadow-panel before:content-[''] before:absolute before:top-0 before:left-0 before:right-0 before:h-0.5 before:bg-current before:opacity-55 text-rose"
            : accent === 'amber'
              ? "relative overflow-hidden bg-gradient-to-b from-bg-2 to-bg-1 border border-border rounded-[10px] px-4 py-3.5 flex flex-col gap-2 shadow-panel before:content-[''] before:absolute before:top-0 before:left-0 before:right-0 before:h-0.5 before:bg-current before:opacity-55 text-amber"
              : accent === 'blue'
                ? "relative overflow-hidden bg-gradient-to-b from-bg-2 to-bg-1 border border-border rounded-[10px] px-4 py-3.5 flex flex-col gap-2 shadow-panel before:content-[''] before:absolute before:top-0 before:left-0 before:right-0 before:h-0.5 before:bg-current before:opacity-55 text-blue"
                : "relative overflow-hidden bg-gradient-to-b from-bg-2 to-bg-1 border border-border rounded-[10px] px-4 py-3.5 flex flex-col gap-2 shadow-panel before:content-[''] before:absolute before:top-0 before:left-0 before:right-0 before:h-0.5 before:bg-current before:opacity-55 text-violet"
      }
      tabIndex={0}
    >
      <header className="flex justify-between items-center">
        <span className="text-[11px] uppercase tracking-wider text-fg-dim font-semibold">{label}</span>
        {delta == null ? (
          <span className="text-[11px] font-semibold font-mono text-fg-muted">—</span>
        ) : (
          <span
            className={
              deltaDirection === 'up'
                ? 'text-[11px] font-semibold font-mono text-rose'
                : deltaDirection === 'down'
                  ? 'text-[11px] font-semibold font-mono text-green'
                  : 'text-[11px] font-semibold font-mono text-fg-muted'
            }
          >
            <span aria-hidden="true">
              {deltaDirection === 'up' ? '▲' : deltaDirection === 'down' ? '▼' : '·'}
            </span>{' '}
            {delta}
          </span>
        )}
      </header>
      <div className="text-[28px] font-bold text-fg tracking-tight font-mono leading-tight">{value}</div>
      <footer className="flex justify-between items-center mt-auto">
        <Sparkline points={sparkline} accent={accent} />
        <span className="text-[10px] text-fg-dim uppercase tracking-wide">{period}</span>
      </footer>
    </article>
  )
}
