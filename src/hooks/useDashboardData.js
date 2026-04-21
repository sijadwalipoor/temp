import { useEffect, useState } from 'react'
import { dashboardAPI } from '../services/api'
import {
  EMPTY_KPIS,
  getErrorMessage,
  normalizeKpis,
  normalizePackage,
  normalizeTrendPoint,
} from '../pages/dashboard.utils'

const EMPTY_META = { page: 1, pageSize: 25, totalItems: 0, totalPages: 0 }

export const useDashboardData = ({ interval, pageNumber, pageSize, sortBy, refreshCounter }) => {
  const [chartData, setChartData] = useState([])
  const [packages, setPackages] = useState([])
  const [kpis, setKpis] = useState(EMPTY_KPIS)
  const [meta, setMeta] = useState(EMPTY_META)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      setLoading(true)
      setError('')

      const [kpisResult, trendResult, worstResult] = await Promise.allSettled([
        dashboardAPI.getKpis(interval),
        dashboardAPI.getMetricsTrend(interval),
        dashboardAPI.getWorstPackages({ ...interval, pageNumber, pageSize, sortBy }),
      ])

      if (cancelled) return

      const failures = []

      if (kpisResult.status === 'fulfilled') {
        setKpis(normalizeKpis(kpisResult.value))
      } else {
        setKpis(EMPTY_KPIS)
        failures.push(getErrorMessage(kpisResult.reason, 'KPIs failed to load'))
      }

      if (trendResult.status === 'fulfilled') {
        const points = Array.isArray(trendResult.value) ? trendResult.value : []
        setChartData(points.map(normalizeTrendPoint))
      } else {
        setChartData([])
        failures.push(getErrorMessage(trendResult.reason, 'Trend failed to load'))
      }

      if (worstResult.status === 'fulfilled') {
        const items = Array.isArray(worstResult.value.data) ? worstResult.value.data : []
        setPackages(items.map(normalizePackage))
        setMeta({ ...EMPTY_META, ...(worstResult.value.meta ?? {}) })
      } else {
        setPackages([])
        setMeta(EMPTY_META)
        failures.push(getErrorMessage(worstResult.reason, 'Packages failed to load'))
      }

      if (failures.length > 0) {
        setError(failures.join(' | '))
      }
      setLoading(false)
    }

    load()
    return () => {
      cancelled = true
    }
  }, [interval, pageNumber, pageSize, sortBy, refreshCounter])

  return { chartData, packages, kpis, meta, loading, error }
}
