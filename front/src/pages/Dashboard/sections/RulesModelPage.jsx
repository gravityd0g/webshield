import AppShell from '../components/AppShell'
import PagePlaceholder from '../components/PagePlaceholder'

export default function RulesModelPage({ currentUser }) {
  return (
    <AppShell currentUser={currentUser}>
      <PagePlaceholder
        title="Rules & model"
        description="Configuración de reglas OWASP CRS y gestión del modelo ML: versiones, métricas, retraining, deployment y rollback."
      />
    </AppShell>
  )
}
