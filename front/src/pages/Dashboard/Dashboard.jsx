import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import AppShell from './components/AppShell'
import LiveEvents from './components/LiveEvents'
import EventDrawer from './components/EventDrawer'
import { useDashboardData } from './useDashboardData'

const BREADCRUMB_TAG = 'ml-auto font-mono text-[10px] px-2 py-1 rounded-full tracking-wider uppercase'

export default function Dashboard({ currentUser, onLogout }) {
  const { t } = useTranslation()
  const [selectedEvent, setSelectedEvent] = useState(null)
  const { data, loading, error, reload } = useDashboardData(3000)

  return (
    <AppShell currentUser={currentUser} onLogout={onLogout}>
      <div className="flex items-center gap-2 text-xs text-fg-muted mb-1">
        <span>{t('breadcrumb.overview')}</span>
        {loading && !data && <span className={`${BREADCRUMB_TAG} bg-amber-soft text-amber`}>{t('breadcrumb.loading')}</span>}
        {error && <span className={`${BREADCRUMB_TAG} bg-rose-soft text-rose`}>{error}</span>}
        {data && !error && <span className={`${BREADCRUMB_TAG} bg-cyan-soft text-cyan`}>{t('breadcrumb.liveData')}</span>}
      </div>

      {error && !data && (
        <section className="p-6 border border-rose bg-rose-soft rounded-xl text-fg flex flex-col gap-2 items-start">
          <p className="m-0">{t('dashboard.errorTitle')}</p>
          <p className="m-0 text-xs text-fg-muted">{t('dashboard.errorDetail')}</p>
          <button
            type="button"
            className="bg-blue text-bg-0 border border-blue rounded-[7px] px-3.5 py-2 text-xs font-semibold cursor-pointer hover:brightness-110"
            onClick={reload}
          >
            {t('common.retry')}
          </button>
        </section>
      )}

      {data && (
        <section className="flex flex-col min-w-0 w-full">
          <LiveEvents events={data.recentEvents} onSelectEvent={setSelectedEvent} />
        </section>
      )}

      <EventDrawer event={selectedEvent} onClose={() => setSelectedEvent(null)} />
    </AppShell>
  )
}
