import AppShell from '../components/AppShell'
import PagePlaceholder from '../components/PagePlaceholder'

export default function TriagePage({ currentUser }) {
  return (
    <AppShell currentUser={currentUser}>
      <PagePlaceholder
        title="Triage queue"
        description="Cola de eventos pendientes de revisión: el analista marca True Positive / False Positive / Escalado, asigna severidad y deja notas que retroalimentan el modelo."
      />
    </AppShell>
  )
}
