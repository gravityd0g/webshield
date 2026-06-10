import AppShell from '../components/AppShell'
import PagePlaceholder from '../components/PagePlaceholder'

export default function TriagePage({ currentUser }) {
  return (
    <AppShell currentUser={currentUser}>
      <PagePlaceholder tKey="placeholder.triage" />
    </AppShell>
  )
}
