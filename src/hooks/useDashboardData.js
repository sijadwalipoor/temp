import { useEffect, useState } from 'react'
import { dashboardAPI } from '../services/api'
import {
  EMPTY_KPIS,
  getApiErrorMessage,
  normalizeKpiPayload,
  normalizePackage,
  normalizeTrendPoint,
} from '../pages/dashboard.utils'

export const useDashboardData = (interval, refreshCounter) => {
  const [chartData, setChartData] = useState([])
  const [packages, setPackages] = useState([])
  const [kpis, setKpis] = useState(EMPTY_KPIS)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const loadDashboardData = async () => {
      setLoading(true)
      setError('')

      try {
        const [kpiResult, trendResult, packagesResult] = await Promise.allSettled([
          dashboardAPI.getKPIs(interval),
          dashboardAPI.getMetricsTrend(interval),
          dashboardAPI.getWorstPackages({ ...interval, pageNumber: 1, pageSize: 500, sortBy: 'DB2_CPU' }),
        ])

        const failedSections = []

        if (kpiResult.status === 'fulfilled') {
          setKpis(normalizeKpiPayload(kpiResult.value.data))
        } else {
          failedSections.push(getApiErrorMessage(kpiResult, 'KPI data failed to load'))
        }

        if (trendResult.status === 'fulfilled') {
          const trendPayload = trendResult.value.data?.data ?? trendResult.value.data ?? []
          const normalizedTrend = Array.isArray(trendPayload)
            ? trendPayload.map(normalizeTrendPoint)
            : []
          setChartData(normalizedTrend)
        } else {
          setChartData([])
          failedSections.push(getApiErrorMessage(trendResult, 'Trend data failed to load'))
        }

        if (packagesResult.status === 'fulfilled') {
          const packagePayload =
            packagesResult.value.data?.items ??
            packagesResult.value.data?.data?.items ??
            packagesResult.value.data?.data ??
            packagesResult.value.data ??
            []

          const normalizedPackages = Array.isArray(packagePayload)
            ? packagePayload.map(normalizePackage)
            : []

          setPackages(normalizedPackages)
        } else {
          setPackages([])
          failedSections.push(getApiErrorMessage(packagesResult, 'Package data failed to load'))
        }

        if (failedSections.length === 1) {
          setError(failedSections[0])
        } else if (failedSections.length > 1) {
          setError(`Some dashboard sections failed to load: ${failedSections.join(' | ')}`)
        }
      } catch (err) {
        setError(err?.response?.data?.message || 'Failed to load dashboard data')
      } finally {
        setLoading(false)
      }
    }

    loadDashboardData()
  }, [interval, refreshCounter])

  return {
    chartData,
    packages,
    kpis,
    loading,
    error,
  }
}
