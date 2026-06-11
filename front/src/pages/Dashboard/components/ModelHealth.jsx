import { useTranslation } from 'react-i18next'

export default function ModelHealth({ data }) {
  const { t } = useTranslation()
  const histogram = data.confidenceHistogram ?? []
  const maxBin = histogram.length ? Math.max(...histogram.map((b) => b.count)) : 1

  const statusLabel =
    data.status === 'healthy'
      ? t('modelHealth.statusHealthy')
      : data.status === 'degraded'
        ? t('modelHealth.statusDegraded')
        : t('modelHealth.statusCritical')

  return (
    <section
      className="bg-gradient-to-b from-bg-2 to-bg-1 border border-border rounded-[14px] px-[18px] pt-[18px] pb-4 shadow-panel flex flex-col gap-3.5 min-w-0"
      aria-labelledby="model-health-title"
    >
      <header className="flex items-start justify-between gap-4">
        <div>
          <h2 id="model-health-title" className="m-0 text-sm font-semibold tracking-wide text-fg flex items-center gap-2.5">
            {t('modelHealth.title')}
          </h2>
          <p className="mt-0.5 mb-0 text-[11px] text-fg-dim">{t('modelHealth.subtitle')}</p>
        </div>
        <span
          className={
            data.status === 'healthy'
              ? 'inline-block text-[10px] font-bold px-[7px] py-[3px] rounded font-mono tracking-wide bg-cyan-soft text-cyan'
              : data.status === 'degraded'
                ? 'inline-block text-[10px] font-bold px-[7px] py-[3px] rounded font-mono tracking-wide bg-amber-soft text-amber'
                : 'inline-block text-[10px] font-bold px-[7px] py-[3px] rounded font-mono tracking-wide bg-rose-soft text-rose'
          }
        >
          {statusLabel}
        </span>
      </header>

      <dl className="m-0 flex flex-col gap-1">
        <div className="flex justify-between items-baseline py-1.5 border-b border-dashed border-border text-xs last:border-b-0">
          <dt className="text-fg-muted">{t('modelHealth.predictionsPerSecond')}</dt>
          <dd className="font-mono text-xs m-0 text-fg">{data.predictionsPerSecond}</dd>
        </div>
        <div className="flex justify-between items-baseline py-1.5 border-b border-dashed border-border text-xs last:border-b-0">
          <dt className="text-fg-muted">{t('modelHealth.rollingAccuracy')}</dt>
          <dd className="font-mono text-xs m-0 text-fg">{(data.rollingAccuracy * 100).toFixed(1)}%</dd>
        </div>
        <div className="flex justify-between items-baseline py-1.5 border-b border-dashed border-border text-xs last:border-b-0">
          <dt className="text-fg-muted">{t('modelHealth.drift')}</dt>
          <dd className="font-mono text-xs m-0 text-fg">
            {data.drift.toFixed(2)}{' '}
            <span className="text-fg-dim text-[10px] ml-1">{t('modelHealth.lowerIsBetter')}</span>
          </dd>
        </div>
      </dl>

      <div className="flex flex-col gap-1.5 mt-1" aria-label={t('modelHealth.histogramTitle')}>
        <p className="m-0 text-[11px] text-fg-dim uppercase tracking-wider">{t('modelHealth.histogramTitle')}</p>
        <div className="flex items-end gap-[3px] h-[60px]">
          {histogram.map((b, i) => (
            <div
              key={b.bin}
              className={
                i < 3
                  ? 'flex-1 rounded-t-sm min-h-1 opacity-85 bg-cyan'
                  : i > 6
                    ? 'flex-1 rounded-t-sm min-h-1 opacity-85 bg-rose'
                    : 'flex-1 rounded-t-sm min-h-1 opacity-85 bg-amber'
              }
              style={{ height: `${(b.count / maxBin) * 100}%` }}
              title={`${b.bin}: ${b.count}`}
            />
          ))}
        </div>
        <div className="flex justify-between text-[10px] text-fg-dim mt-0.5">
          <span>{t('modelHealth.histogramValid')}</span>
          <span>{t('modelHealth.histogramUncertain')}</span>
          <span>{t('modelHealth.histogramAnomalous')}</span>
        </div>
      </div>
    </section>
  )
}
