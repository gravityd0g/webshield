import AppShell from '../components/AppShell'
import PagePlaceholder from '../components/PagePlaceholder'

export default function SettingsPage({ currentUser }) {
  return (
    <AppShell currentUser={currentUser}>
      <PagePlaceholder tKey="placeholder.settings" />
    </AppShell>
  )
}
