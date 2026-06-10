import AppShell from '../components/AppShell'
import PagePlaceholder from '../components/PagePlaceholder'

export default function UsersPage({ currentUser }) {
  return (
    <AppShell currentUser={currentUser}>
      <PagePlaceholder tKey="placeholder.users" />
    </AppShell>
  )
}
