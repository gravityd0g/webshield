import { useTranslation } from 'react-i18next'

export default function TopAttackerIPs({ data }) {
  const { t } = useTranslation()
  if (!data?.length) {
    return (
      <section
        className="bg-gradient-to-b from-bg-2 to-bg-1 border border-border rounded-[14px] px-[18px] pt-[18px] pb-4 shadow-panel flex flex-col gap-3.5 min-w-0"
        aria-labelledby="top-ips-title"
      >
        <header className="flex items-start justify-between gap-4">
          <div>
            <h2 id="top-ips-title" className="m-0 text-sm font-semibold tracking-wide text-fg">
              {t('table.topIps.title')}
            </h2>
            <p className="mt-0.5 mb-0 text-[11px] text-fg-dim">{t('table.topIps.empty')}</p>
          </div>
        </header>
      </section>
    )
  }
  return (
    <section
      className="bg-gradient-to-b from-bg-2 to-bg-1 border border-border rounded-[14px] px-[18px] pt-[18px] pb-4 shadow-panel flex flex-col gap-3.5 min-w-0"
      aria-labelledby="top-ips-title"
    >
      <header className="flex items-start justify-between gap-4">
        <div>
          <h2 id="top-ips-title" className="m-0 text-sm font-semibold tracking-wide text-fg flex items-center gap-2.5">
            {t('table.topIps.title')}
          </h2>
          <p className="mt-0.5 mb-0 text-[11px] text-fg-dim">{t('table.topIps.subtitle')}</p>
        </div>
        <button
          type="button"
          className="bg-bg-3 text-fg-muted border border-border rounded-md px-2.5 py-[5px] text-[11px] cursor-pointer hover:text-fg"
        >
          {t('common.viewAll')}
        </button>
      </header>
      <table className="w-full border-collapse text-xs">
        <thead>
          <tr>
            <th scope="col" className="text-left px-2.5 py-2 font-semibold text-[10px] uppercase tracking-wider text-fg-dim border-b border-border">
              {t('table.topIps.ip')}
            </th>
            <th scope="col" className="text-left px-2.5 py-2 font-semibold text-[10px] uppercase tracking-wider text-fg-dim border-b border-border">
              {t('table.topIps.country')}
            </th>
            <th scope="col" className="text-right px-2.5 py-2 font-semibold text-[10px] uppercase tracking-wider text-fg-dim border-b border-border">
              {t('table.topIps.total')}
            </th>
            <th scope="col" className="text-right px-2.5 py-2 font-semibold text-[10px] uppercase tracking-wider text-fg-dim border-b border-border">
              {t('table.topIps.anomalousPct')}
            </th>
            <th scope="col" className="text-left px-2.5 py-2 font-semibold text-[10px] uppercase tracking-wider text-fg-dim border-b border-border">
              {t('table.topIps.lastSeen')}
            </th>
            <th scope="col" className="text-left px-2.5 py-2 font-semibold text-[10px] uppercase tracking-wider text-fg-dim border-b border-border">
              {t('table.topIps.status')}
            </th>
          </tr>
        </thead>
        <tbody>
          {data.map((row) => (
            <tr key={row.ip} className="group">
              <td className="font-mono text-xs px-2.5 py-2.5 border-b border-border text-fg group-hover:bg-surface-hover">
                {row.ip}
              </td>
              <td className="px-2.5 py-2.5 border-b border-border text-fg font-mono text-fg-muted tracking-wider text-[11px] group-hover:bg-surface-hover">
                {row.country}
              </td>
              <td className="font-mono text-xs text-right px-2.5 py-2.5 border-b border-border text-fg group-hover:bg-surface-hover">
                {row.total}
              </td>
              <td className="text-right px-2.5 py-2.5 border-b border-border text-fg group-hover:bg-surface-hover">
                <div className="relative w-full h-[18px] bg-bg-3 rounded overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-rose-soft to-rose"
                    style={{ width: `${row.anomalousPct}%` }}
                  />
                  <span className="absolute inset-0 flex items-center justify-end pr-1.5 font-mono text-[11px] text-fg">
                    {row.anomalousPct}%
                  </span>
                </div>
              </td>
              <td className="font-mono text-xs text-fg-dim px-2.5 py-2.5 border-b border-border group-hover:bg-surface-hover">
                {row.lastSeen}
              </td>
              <td className="px-2.5 py-2.5 border-b border-border group-hover:bg-surface-hover">
                <span
                  className={
                    row.status === 'blocked'
                      ? 'inline-block text-[10px] font-bold px-[7px] py-[3px] rounded font-mono tracking-wide bg-rose-soft text-rose'
                      : row.status === 'watch'
                        ? 'inline-block text-[10px] font-bold px-[7px] py-[3px] rounded font-mono tracking-wide bg-amber-soft text-amber'
                        : row.status === 'allowed'
                          ? 'inline-block text-[10px] font-bold px-[7px] py-[3px] rounded font-mono tracking-wide bg-cyan-soft text-cyan'
                          : 'inline-block text-[10px] font-bold px-[7px] py-[3px] rounded font-mono tracking-wide bg-bg-3 text-fg-muted'
                  }
                >
                  {row.status === 'blocked'
                    ? t('table.topIps.blocked')
                    : row.status === 'watch'
                      ? t('table.topIps.watchlist')
                      : row.status === 'allowed'
                        ? t('table.topIps.allowed')
                        : '—'}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  )
}
