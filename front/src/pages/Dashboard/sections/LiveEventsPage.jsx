import AppShell from '../components/AppShell'
import PagePlaceholder from '../components/PagePlaceholder'

export default function LiveEventsPage({ currentUser }) {
  return (
    <AppShell currentUser={currentUser}>
      <PagePlaceholder
        title="Live events"
        description="Stream completo de requests clasificados por el WAF en tiempo real. Filtrado por verdict, acción, IP y tipo de ataque, con drawer de detalle por evento."
      />
    </AppShell>
  )
}
