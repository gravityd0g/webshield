import { useCallback, useEffect, useState } from 'react'
import { fetchDashboard } from '../../api/dashboard'

export function useDashboardData(pollIntervalMs = 30000) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const reload = useCallback(async () => {
    try {
      const next = await fetchDashboard()
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
  }, [reload])

  useEffect(() => {
    if (pollIntervalMs <= 0) return undefined
    const id = setInterval(reload, pollIntervalMs)
    return () => clearInterval(id)
  }, [reload, pollIntervalMs])

  return { data, loading, error, reload }
}
