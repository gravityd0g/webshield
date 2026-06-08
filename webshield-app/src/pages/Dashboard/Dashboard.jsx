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
import {
  kpis,
  timeline,
  attackTypes,
  topIPs,
  topEndpoints,
  modelHealth,
  recentEvents,
} from './mockData'

export default function Dashboard() {
  const [selectedEvent, setSelectedEvent] = useState(null)
  const [timeRange, setTimeRange] = useState('24h')

  return (
    <AppShell timeRange={timeRange} onTimeRangeChange={setTimeRange}>
      <div className="flex items-center gap-2 text-xs text-fg-muted mb-1">
        <span>SOC</span>
        <span aria-hidden="true">/</span>
        <span>Overview</span>
        <span className="ml-auto bg-amber-soft text-amber font-mono text-[10px] px-2 py-1 rounded-full tracking-wide uppercase">
          BOCETO — datos simulados
        </span>
      </div>

      <section className="grid gap-4 grid-cols-6 max-[1400px]:grid-cols-3" aria-label="Indicadores clave">
        {kpis.map((k) => <KpiCard key={k.id} {...k} />)}
      </section>

      <section className="grid gap-4 grid-cols-12">
        <div className="col-span-8 max-[1100px]:col-span-12">
          <TrafficTimeline data={timeline} />
        </div>
        <div className="col-span-4 max-[1100px]:col-span-12">
          <AttackDonut data={attackTypes} />
        </div>
      </section>

      <section className="grid gap-4 grid-cols-12">
        <div className="col-span-5 max-[1100px]:col-span-12">
          <TopAttackerIPs data={topIPs} />
        </div>
        <div className="col-span-4 max-[1100px]:col-span-12">
          <TopEndpoints data={topEndpoints} />
        </div>
        <div className="col-span-3 max-[1100px]:col-span-12">
          <ModelHealth data={modelHealth} />
        </div>
      </section>

      <section className="grid gap-4 grid-cols-12">
        <LiveEvents events={recentEvents} onSelectEvent={setSelectedEvent} />
      </section>

      <EventDrawer event={selectedEvent} onClose={() => setSelectedEvent(null)} />
    </AppShell>
  )
}
