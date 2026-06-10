import AppShell from '../components/AppShell'
import PagePlaceholder from '../components/PagePlaceholder'

export default function AuditLogPage({ currentUser }) {
  return (
    <AppShell currentUser={currentUser}>
      <PagePlaceholder tKey="placeholder.audit" />
    </AppShell>
  )
}
