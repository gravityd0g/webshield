import AppShell from '../components/AppShell'
import PagePlaceholder from '../components/PagePlaceholder'

export default function UsersPage({ currentUser }) {
  return (
    <AppShell currentUser={currentUser}>
      <PagePlaceholder
        title="Users"
        description="Administración de usuarios del SOC: roles (analyst, admin), permisos por sección, invitaciones, MFA y políticas de contraseñas."
      />
    </AppShell>
  )
}
