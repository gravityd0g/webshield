import { useCallback, useEffect, useState } from 'react'
import { fetchDashboard } from '../../api/dashboard'
import { kpis, timeline, attackTypes, topIPs, topEndpoints, modelHealth, recentEvents } from './mockData'

// Backend aún no conectado a la DB nueva (issue #34). Cuando esté listo,
// poner USE_MOCK = false para que el front llame al API real.
const USE_MOCK = false
const MOCK_DATA = { kpis, timeline, attackTypes, topIPs, topEndpoints, modelHealth, recentEvents }

export function useDashboardData(pollIntervalMs = 30000) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const reload = useCallback(async () => {
    try {
      const next = USE_MOCK ? MOCK_DATA : await fetchDashboard()
      setData(next)
      setError(null)
    } catch (err) {
      setError(err.message ?? 'Error al cargar el dashboard')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    reload()
    if (pollIntervalMs <= 0) return undefined
    const id = setInterval(reload, pollIntervalMs)
    return () => clearInterval(id)
  }, [reload, pollIntervalMs])

  return { data, loading, error, reload }
}
