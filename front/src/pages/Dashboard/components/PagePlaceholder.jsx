import { useTranslation } from 'react-i18next'

export default function PagePlaceholder({ tKey }) {
  const { t } = useTranslation()
  const title = t(`${tKey}.title`)
  const description = t(`${tKey}.description`)

  return (
    <>
      <div className="flex items-center gap-2 text-xs text-fg-muted mb-1">
        <span>{title}</span>
        <span className="ml-auto font-mono text-[10px] px-2 py-1 rounded-full tracking-wider uppercase bg-amber-soft text-amber">
          {t('placeholder.comingSoon')}
        </span>
      </div>

      <section
        className="bg-gradient-to-b from-bg-2 to-bg-1 border border-border rounded-[14px] px-6 py-7 shadow-panel flex flex-col gap-6 min-h-[320px]"
        aria-labelledby="page-placeholder-title"
      >
        <div className="flex items-start gap-4">
          <div
            className="w-12 h-12 grid place-items-center bg-bg-3 border border-border-strong rounded-xl text-cyan shrink-0"
            aria-hidden="true"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 8v4l3 2" />
            </svg>
          </div>
          <div className="flex-1">
            <h1 id="page-placeholder-title" className="m-0 text-lg font-semibold text-fg">
              {title}
            </h1>
            <p className="mt-1.5 mb-0 text-sm text-fg-muted leading-relaxed">{description}</p>
          </div>
        </div>

        <div className="flex flex-col gap-2 mt-2" aria-hidden="true">
          <div className="h-3 bg-bg-3 rounded animate-pulse w-3/4" />
          <div className="h-3 bg-bg-3 rounded animate-pulse w-1/2" />
          <div className="h-3 bg-bg-3 rounded animate-pulse w-2/3" />
          <div className="h-3 bg-bg-3 rounded animate-pulse w-5/12" />
        </div>
      </section>
    </>
  )
}
