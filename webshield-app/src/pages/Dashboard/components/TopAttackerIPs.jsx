const STATUS_BADGE = {
  blocked: { label: 'BLOCKED', cls: 'badge badge--danger' },
  watch: { label: 'WATCHLIST', cls: 'badge badge--warn' },
  allowed: { label: 'ALLOWED', cls: 'badge badge--ok' },
}

export default function TopAttackerIPs({ data }) {
  return (
    <section className="panel" aria-labelledby="top-ips-title">
      <header className="panel__header">
        <div>
          <h2 id="top-ips-title" className="panel__title">Top attacker IPs</h2>
          <p className="panel__sub">IPs con mayor volumen anómalo · 24h</p>
        </div>
        <button type="button" className="panel__action">Ver todas</button>
      </header>
      <table className="data-table">
        <thead>
          <tr>
            <th scope="col">IP</th>
            <th scope="col">País</th>
            <th scope="col" className="data-table__num">Total</th>
            <th scope="col" className="data-table__num">% anom</th>
            <th scope="col">Última</th>
            <th scope="col">Estado</th>
          </tr>
        </thead>
        <tbody>
          {data.map((row) => {
            const status = STATUS_BADGE[row.status]
            return (
              <tr key={row.ip}>
                <td className="mono">{row.ip}</td>
                <td className="data-table__country">{row.country}</td>
                <td className="data-table__num">{row.total}</td>
                <td className="data-table__num">
                  <div className="bar">
                    <div className="bar__fill" style={{ width: `${row.anomalousPct}%` }}></div>
                    <span className="bar__label">{row.anomalousPct}%</span>
                  </div>
                </td>
                <td className="mono mono--dim">{row.lastSeen}</td>
                <td><span className={status.cls}>{status.label}</span></td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </section>
  )
}
