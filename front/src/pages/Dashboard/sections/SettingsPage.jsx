import AppShell from '../components/AppShell'
import PagePlaceholder from '../components/PagePlaceholder'

export default function SettingsPage({ currentUser }) {
  return (
    <AppShell currentUser={currentUser}>
      <PagePlaceholder
        title="Settings"
        description="Configuración general de WebShield: notificaciones por email/Slack, integraciones, branding, retención de datos y backups."
      />
    </AppShell>
  )
}
