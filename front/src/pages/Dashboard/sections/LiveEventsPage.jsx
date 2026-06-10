import AppShell from '../components/AppShell'
import PagePlaceholder from '../components/PagePlaceholder'

export default function LiveEventsPage({ currentUser }) {
  return (
    <AppShell currentUser={currentUser}>
      <PagePlaceholder tKey="placeholder.live" />
    </AppShell>
  )
}
