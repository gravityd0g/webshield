import { useTranslation } from 'react-i18next'

export default function TopEndpoints({ data }) {
  const { t } = useTranslation()
  if (!data?.length) {
    return (
      <section
        className="bg-gradient-to-b from-bg-2 to-bg-1 border border-border rounded-[14px] px-[18px] pt-[18px] pb-4 shadow-panel flex flex-col gap-3.5 min-w-0"
        aria-labelledby="top-endpoints-title"
      >
        <header className="flex items-start justify-between gap-4">
          <div>
            <h2 id="top-endpoints-title" className="m-0 text-sm font-semibold tracking-wide text-fg">
              {t('table.topEndpoints.title')}
            </h2>
            <p className="mt-0.5 mb-0 text-[11px] text-fg-dim">{t('table.topEndpoints.empty')}</p>
          </div>
        </header>
      </section>
    )
  }

  const maxAttacks = Math.max(...data.map((d) => d.attacks), 1)
  return (
    <section
      className="bg-gradient-to-b from-bg-2 to-bg-1 border border-border rounded-[14px] px-[18px] pt-[18px] pb-4 shadow-panel flex flex-col gap-3.5 min-w-0"
      aria-labelledby="top-endpoints-title"
    >
      <header className="flex items-start justify-between gap-4">
        <div>
          <h2 id="top-endpoints-title" className="m-0 text-sm font-semibold tracking-wide text-fg flex items-center gap-2.5">
            {t('table.topEndpoints.title')}
          </h2>
          <p className="mt-0.5 mb-0 text-[11px] text-fg-dim">{t('table.topEndpoints.subtitle')}</p>
        </div>
      </header>
      <ul className="list-none m-0 p-0 flex flex-col gap-2.5">
        {data.map((row) => {
          const pct = (row.attacks / maxAttacks) * 100
          const ratio = ((row.attacks / row.total) * 100).toFixed(1)
          return (
            <li key={row.uri}>
              <div className="flex justify-between items-center gap-2 text-xs">
                <code className="font-mono text-xs text-fg bg-bg-3 px-1.5 py-0.5 rounded truncate max-w-[60%]">
                  {row.uri}
                </code>
                <span>
                  <strong className="text-rose font-mono">{row.attacks}</strong>
                  <span className="text-fg-dim text-[11px] font-mono">
                    {' '}/ {row.total} ({ratio}%)
                  </span>
                </span>
              </div>
              <div className="h-1.5 bg-bg-3 rounded-sm overflow-hidden mt-0">
                <div
                  className="h-full bg-gradient-to-r from-amber to-rose rounded-sm"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
