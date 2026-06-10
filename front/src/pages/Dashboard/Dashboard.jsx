import { useState } from 'react'
import AppShell from './components/AppShell'
import KpiCard from './components/KpiCard'
import TrafficTimeline from './components/TrafficTimeline'
import AttackDonut from './components/AttackDonut'
import TopAttackerIPs from './components/TopAttackerIPs'
import TopEndpoints from './components/TopEndpoints'
import ModelHealth from './components/ModelHealth'
import LiveEvents from './components/LiveEvents'
import EventDrawer from './components/EventDrawer'
import { useDashboardData } from './useDashboardData'

export default function Dashboard() {
  const [selectedEvent, setSelectedEvent] = useState(null)
  const [timeRange, setTimeRange] = useState('24h')
  const { data, loading, error, reload } = useDashboardData()

  return (
    <AppShell timeRange={timeRange} onTimeRangeChange={setTimeRange}>
      <div className="flex items-center gap-2 text-xs text-fg-muted mb-1">
        <span>SOC</span>
        <span aria-hidden="true">/</span>
        <span>Overview</span>
        {loading && !data && <span className="dash__breadcrumb-tag">Cargando…</span>}
        {error && <span className="dash__breadcrumb-tag dash__breadcrumb-tag--error">{error}</span>}
        {data && !error && <span className="dash__breadcrumb-tag dash__breadcrumb-tag--live">Datos en vivo · MySQL</span>}
      </div>

      {error && !data && (
        <section className="dash__error">
          <p>No se pudo conectar con la base de datos.</p>
          <p className="dash__error-detail">Asegúrate de que MySQL esté corriendo y el API en el puerto 3001.</p>
          <button type="button" className="btn btn--primary" onClick={reload}>Reintentar</button>
        </section>
      )}

      {data && (
        <>
          <section className="grid grid--kpis" aria-label="Indicadores clave">
            {data.kpis.map((k) => <KpiCard key={k.id} {...k} />)}
          </section>

          <section className="grid grid--charts">
            <div className="grid__span-8"><TrafficTimeline data={data.timeline} /></div>
            <div className="grid__span-4"><AttackDonut data={data.attackTypes} /></div>
          </section>

          <section className="grid grid--widgets">
            <div className="grid__span-5"><TopAttackerIPs data={data.topIPs} /></div>
            <div className="grid__span-4"><TopEndpoints data={data.topEndpoints} /></div>
            <div className="grid__span-3"><ModelHealth data={data.modelHealth} /></div>
          </section>

          <section className="grid grid--live">
            <LiveEvents events={data.recentEvents} onSelectEvent={setSelectedEvent} />
          </section>
        </>
      )}

      <EventDrawer event={selectedEvent} onClose={() => setSelectedEvent(null)} />
    </AppShell>
  )
}
