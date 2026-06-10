import AppShell from '../components/AppShell'
import PagePlaceholder from '../components/PagePlaceholder'

export default function InvestigationsPage({ currentUser }) {
  return (
    <AppShell currentUser={currentUser}>
      <PagePlaceholder
        title="Investigations"
        description="Casos forenses: agrupación de eventos relacionados, timeline reconstruido, artefactos (IPs, payloads, user-agents) y exportación de evidencia."
      />
    </AppShell>
  )
}
