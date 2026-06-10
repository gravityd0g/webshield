import AppShell from '../components/AppShell'
import PagePlaceholder from '../components/PagePlaceholder'

export default function RulesModelPage({ currentUser }) {
  return (
    <AppShell currentUser={currentUser}>
      <PagePlaceholder tKey="placeholder.rules" />
    </AppShell>
  )
}
