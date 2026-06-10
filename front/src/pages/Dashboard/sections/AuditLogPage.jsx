import AppShell from '../components/AppShell'
import PagePlaceholder from '../components/PagePlaceholder'

export default function AuditLogPage({ currentUser }) {
  return (
    <AppShell currentUser={currentUser}>
      <PagePlaceholder
        title="Audit log"
        description="Registro inmutable de acciones de usuarios y cambios de configuración. Búsqueda por actor, recurso, fecha y exportación para compliance."
      />
    </AppShell>
  )
}
