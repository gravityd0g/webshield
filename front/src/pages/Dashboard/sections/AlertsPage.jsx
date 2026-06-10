import AppShell from '../components/AppShell'
import PagePlaceholder from '../components/PagePlaceholder'

export default function AlertsPage({ currentUser }) {
  return (
    <AppShell currentUser={currentUser}>
      <PagePlaceholder tKey="placeholder.alerts" />
    </AppShell>
  )
}
