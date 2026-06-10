import AppShell from '../components/AppShell'
import PagePlaceholder from '../components/PagePlaceholder'

export default function AlertsPage({ currentUser }) {
  return (
    <AppShell currentUser={currentUser}>
      <PagePlaceholder
        title="Alerts"
        description="Alertas accionables derivadas de eventos críticos: SQLi confirmado, IP atacante recurrente, picos de tráfico anómalo. Notificaciones, acknowledgments y agrupación por incidente."
      />
    </AppShell>
  )
}
