export default function TopEndpoints({ data }) {
  const maxAttacks = Math.max(...data.map((d) => d.attacks))
  return (
    <section className="panel" aria-labelledby="top-endpoints-title">
      <header className="panel__header">
        <div>
          <h2 id="top-endpoints-title" className="panel__title">Endpoints más atacados</h2>
          <p className="panel__sub">URIs por número de requests anómalos · 24h</p>
        </div>
      </header>
      <ul className="hbar">
        {data.map((row) => {
          const pct = (row.attacks / maxAttacks) * 100
          const ratio = ((row.attacks / row.total) * 100).toFixed(1)
          return (
            <li key={row.uri}>
              <div className="hbar__head">
                <code className="hbar__uri">{row.uri}</code>
                <span className="hbar__count">
                  <strong>{row.attacks}</strong>
                  <span className="hbar__total"> / {row.total} ({ratio}%)</span>
                </span>
              </div>
              <div className="hbar__track">
                <div className="hbar__fill" style={{ width: `${pct}%` }}></div>
              </div>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
