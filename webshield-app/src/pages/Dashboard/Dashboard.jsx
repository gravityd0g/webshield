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
import './Dashboard.css'

export default function Dashboard() {
  const [selectedEvent, setSelectedEvent] = useState(null)
  const [timeRange, setTimeRange] = useState('24h')

  return (
    <AppShell timeRange={timeRange} onTimeRangeChange={setTimeRange}>
      <div className="dash__breadcrumb">
        <span>SOC</span>
        <span aria-hidden="true">/</span>
        <span>Overview</span>
        <span className="dash__breadcrumb-tag">BOCETO — datos simulados</span>
      </div>

      <section className="grid grid--kpis" aria-label="Indicadores clave">
        {kpis.map((k) => <KpiCard key={k.id} {...k} />)}
      </section>

      <section className="grid grid--charts">
        <div className="grid__span-8"><TrafficTimeline data={timeline} /></div>
        <div className="grid__span-4"><AttackDonut data={attackTypes} /></div>
      </section>

      <section className="grid grid--widgets">
        <div className="grid__span-5"><TopAttackerIPs data={topIPs} /></div>
        <div className="grid__span-4"><TopEndpoints data={topEndpoints} /></div>
        <div className="grid__span-3"><ModelHealth data={modelHealth} /></div>
      </section>

      <section className="grid grid--live">
        <LiveEvents events={recentEvents} onSelectEvent={setSelectedEvent} />
      </section>

      <EventDrawer event={selectedEvent} onClose={() => setSelectedEvent(null)} />
    </AppShell>
  )
}
