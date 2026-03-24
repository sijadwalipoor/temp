import { useState, useEffect, useRef, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, ComposedChart, Bar
} from 'recharts'
import { ChevronDown } from 'lucide-react'
import TimeRangePicker from '../components/TimeRangePicker'
import MetricsCard from '../components/MetricsCard'
import FilterBar from '../components/FilterBar'
import Paginator from '../components/Paginator'
import StatusBanner from '../components/StatusBanner'
import { dashboardAPI } from '../services/api'
import { CpuIcon, TimerIcon, GetPagesIcon, RefreshIcon } from '../utils/icons'
import { formatIntervalLabel, getIntervalFromNow } from '../utils/timeInterval'
import {
  FAVORITE_PACKAGES_STORAGE_KEY,
  REVIEWED_PACKAGES_STORAGE_KEY,
  readPackageIdSet,
  writePackageIdSet,
} from '../utils/packageState'

const EMPTY_KPIS = {
  totalCpu: 0,
  totalElapsed: 0,
  totalGetPages: 0,
  totalSqlCalls: 0,
}

export default function Dashboard() {
  const navigate = useNavigate()
  const metricsDropdownRef = useRef(null)
  const [interval, setInterval] = useState(getIntervalFromNow({ hours: 24 }))
  const [selectedMetricKeys, setSelectedMetricKeys] = useState(['cpu', 'elapsed'])
  const [isMetricsMenuOpen, setIsMetricsMenuOpen] = useState(false)
  const [chartData, setChartData] = useState([])
  const [packages, setPackages] = useState([])
  const [kpis, setKpis] = useState(EMPTY_KPIS)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [refreshCounter, setRefreshCounter] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [filterCriteria, setFilterCriteria] = useState({
    search: '',
    sort: 'getpages',
  })
  const [reviewedPackageIds, setReviewedPackageIds] = useState(() => readPackageIdSet(REVIEWED_PACKAGES_STORAGE_KEY))
  const [favoritePackageIds, setFavoritePackageIds] = useState(() => readPackageIdSet(FAVORITE_PACKAGES_STORAGE_KEY))
  const [itemsPerPage, setItemsPerPage] = useState(25)

  const metricOptions = [
    { key: 'getPages', label: 'Get Pages', unit: 'pages', color: '#8b5cf6', chartType: 'bar' },
    { key: 'cpu', label: 'CPU', unit: 'ms', color: '#da1e28', chartType: 'line' },
    { key: 'elapsed', label: 'Elapsed Time', unit: 'ms', color: '#0043ce', chartType: 'line' },
    { key: 'sqlCalls', label: 'SQL Calls', unit: 'calls', color: '#f59e0b', chartType: 'line' },
  ]

  const selectedMetrics = metricOptions.filter((metric) => selectedMetricKeys.includes(metric.key))
  const selectedMetricsLabel =
    selectedMetrics.length > 2
      ? `${selectedMetrics.slice(0, 2).map((metric) => metric.label).join(', ')}, ...`
      : selectedMetrics.map((metric) => metric.label).join(', ')
  const areAllMetricsSelected = selectedMetricKeys.length === metricOptions.length
  const primaryUnit = selectedMetrics[0]?.unit
  const showSecondaryAxis = selectedMetrics.some((metric) => metric.unit !== primaryUnit)
  const intervalLabel = formatIntervalLabel(interval)

  const normalizeTrendPoint = (point, idx) => {
    const fallbackTime = new Date(Date.now() - (23 - idx) * 60 * 60 * 1000)
    const timestamp = point.timestamp || point.time || point.bucketTime || fallbackTime.toISOString()
    const time = point.time || new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

    return {
      ...point,
      time,
      timestamp,
      cpu: Number(point.cpu ?? point.totalCpu ?? 0),
      elapsed: Number(point.elapsed ?? point.totalElapsed ?? 0),
      getPages: Number(point.getPages ?? point.totalGetPages ?? 0),
      sqlCalls: Number(point.sqlCalls ?? point.totalSqlCalls ?? 0),
    }
  }

  const normalizePackage = (pkg, idx) => {
    const totalCpu = Number(pkg.totalCpu ?? pkg.cpu ?? 0)
    const totalSqlCalls = Number(pkg.totalSqlCalls ?? pkg.sqlCalls ?? 0)

    return {
      ...pkg,
      id: pkg.id ?? pkg.packageId ?? idx + 1,
      name: pkg.name ?? pkg.packageName ?? `PACKAGE_${idx + 1}`,
      program: pkg.program ?? pkg.programName ?? 'N/A',
      totalCpu,
      totalSqlCalls,
      totalElapsed: Number(pkg.totalElapsed ?? pkg.elapsed ?? 0),
      totalGetPages: Number(pkg.totalGetPages ?? pkg.getPages ?? 0),
      sqlCallsToCpuRatio: pkg.sqlCallsToCpuRatio ?? (totalCpu > 0 ? (totalSqlCalls / totalCpu).toFixed(2) : '0.00'),
    }
  }

  useEffect(() => {
    const loadDashboardData = async () => {
      setLoading(true)
      setError('')

      try {
        const [kpiRes, trendRes, packagesRes] = await Promise.all([
          dashboardAPI.getKPIs(interval),
          dashboardAPI.getMetricsTrend(interval),
          dashboardAPI.getWorstPackages({ ...interval, page: 1, pageSize: 500, sortBy: 'cpu' }),
        ])

        const kpiPayload = kpiRes.data?.data ?? kpiRes.data ?? {}
        const trendPayload = trendRes.data?.data ?? trendRes.data ?? []
        const packagePayload =
          packagesRes.data?.items ??
          packagesRes.data?.data?.items ??
          packagesRes.data?.data ??
          packagesRes.data ??
          []

        const normalizedTrend = Array.isArray(trendPayload)
          ? trendPayload.map(normalizeTrendPoint)
          : []

        const normalizedPackages = Array.isArray(packagePayload)
          ? packagePayload.map(normalizePackage)
          : []

        setKpis({
          totalCpu: Number(kpiPayload.totalCpu ?? 0),
          totalElapsed: Number(kpiPayload.totalElapsed ?? 0),
          totalGetPages: Number(kpiPayload.totalGetPages ?? 0),
          totalSqlCalls: Number(kpiPayload.totalSqlCalls ?? 0),
        })
        setChartData(normalizedTrend)
        setPackages(normalizedPackages)
      } catch (err) {
        setError(err?.response?.data?.message || 'Failed to load dashboard data')
        setKpis(EMPTY_KPIS)
        setChartData([])
        setPackages([])
      } finally {
        setLoading(false)
      }
    }

    loadDashboardData()
  }, [interval, refreshCounter])

  useEffect(() => {
    if (!isMetricsMenuOpen) return undefined

    const handleDocumentMouseDown = (event) => {
      if (metricsDropdownRef.current && !metricsDropdownRef.current.contains(event.target)) {
        setIsMetricsMenuOpen(false)
      }
    }

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setIsMetricsMenuOpen(false)
      }
    }

    document.addEventListener('mousedown', handleDocumentMouseDown)
    document.addEventListener('keydown', handleEscape)

    return () => {
      document.removeEventListener('mousedown', handleDocumentMouseDown)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [isMetricsMenuOpen])

  useEffect(() => {
    writePackageIdSet(REVIEWED_PACKAGES_STORAGE_KEY, reviewedPackageIds)
  }, [reviewedPackageIds])

  useEffect(() => {
    writePackageIdSet(FAVORITE_PACKAGES_STORAGE_KEY, favoritePackageIds)
  }, [favoritePackageIds])

  const handleTimeRangeChange = ({ from, to }) => {
    setInterval({ from, to })
    setCurrentPage(1)
  }

  const toggleMetricSelection = (metricKey) => {
    setSelectedMetricKeys((prev) => {
      if (prev.includes(metricKey)) {
        if (prev.length === 1) return prev
        return prev.filter((key) => key !== metricKey)
      }
      return [...prev, metricKey]
    })
  }

  const selectAllMetrics = () => {
    setSelectedMetricKeys(metricOptions.map((metric) => metric.key))
  }

  const clearToDefaultMetrics = () => {
    setSelectedMetricKeys(['cpu'])
  }

  const toggleAllMetrics = () => {
    if (areAllMetricsSelected) {
      clearToDefaultMetrics()
      return
    }
    selectAllMetrics()
  }

  const renderMetricSeries = (metric) => {
    if (!metric) return null
    const yAxisId = metric.unit === primaryUnit ? 'left' : 'right'

    if (metric.chartType === 'bar') {
      return (
        <Bar
          key={metric.key}
          yAxisId={yAxisId}
          dataKey={metric.key}
          fill={metric.color}
          name={`${metric.label} (${metric.unit})`}
          radius={[4, 4, 0, 0]}
        />
      )
    }

    return (
      <Line
        key={metric.key}
        yAxisId={yAxisId}
        type="monotone"
        dataKey={metric.key}
        stroke={metric.color}
        strokeWidth={3}
        name={`${metric.label} (${metric.unit})`}
        dot={false}
      />
    )
  }

  const handleFilterChange = ({ search, sort }) => {
    setFilterCriteria({
      search: search ?? '',
      sort: sort ?? 'getpages',
    })
    setCurrentPage(1)
  }

  const toggleReviewed = (packageId) => {
    const id = String(packageId)
    setReviewedPackageIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const toggleFavorite = (packageId) => {
    const id = String(packageId)
    setFavoritePackageIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const filteredPackages = useMemo(() => {
    const visiblePackages = packages.filter((pkg) => !reviewedPackageIds.has(String(pkg.id)))
    let filtered = [...visiblePackages]

    const searchValue = filterCriteria.search.trim().toLowerCase()
    if (searchValue) {
      filtered = filtered.filter((pkg) =>
        pkg.name.toLowerCase().includes(searchValue) ||
        pkg.program.toLowerCase().includes(searchValue)
      )
    }

    if (filterCriteria.sort === 'cpu') {
      filtered.sort((a, b) => b.totalCpu - a.totalCpu)
    } else if (filterCriteria.sort === 'elapsed') {
      filtered.sort((a, b) => b.totalElapsed - a.totalElapsed)
    } else if (filterCriteria.sort === 'getpages') {
      filtered.sort((a, b) => b.totalGetPages - a.totalGetPages)
    }

    return filtered
  }, [packages, reviewedPackageIds, filterCriteria])

  const watchListPackages = useMemo(() => {
    const favorites = packages.filter((pkg) => favoritePackageIds.has(String(pkg.id)))
    return favorites.sort((a, b) => b.totalCpu - a.totalCpu)
  }, [packages, favoritePackageIds])

  const paginatedPackages = filteredPackages.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  return (
    <div className="p-8 space-y-8 bg-light min-h-screen">
      {/* Header Section */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">System Overview</h2>
          <p className="text-gray-600 text-sm mt-1">Real-time performance metrics and analysis</p>
        </div>
        <button
          onClick={() => setRefreshCounter((prev) => prev + 1)}
          className="flex items-center space-x-2 px-4 py-2 bg-primary text-white rounded hover:bg-primaryDark transition-colors font-medium text-sm"
        >
          <RefreshIcon size={18} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Time Range Picker */}
      <TimeRangePicker onRangeChange={handleTimeRangeChange} defaultInterval={interval} />

      {loading && <StatusBanner type="info" message="Loading dashboard data..." />}

      <StatusBanner type="error" message={error} />


      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricsCard
          title="Total DB2 CPU"
          value={kpis.totalCpu}
          unit="ms"
          trend={5}
          icon={CpuIcon}
          status="warning"
        />
        <MetricsCard
          title="Total Elapsed Time"
          value={kpis.totalElapsed}
          unit="ms"
          trend={-3}
          icon={TimerIcon}
          status="normal"
        />
        <MetricsCard
          title="Total Get Pages"
          value={kpis.totalGetPages}
          unit="pages"
          trend={12}
          icon={GetPagesIcon}
          status="critical"
        />
        <MetricsCard
          title="Total SQL Calls"
          value={kpis.totalSqlCalls}
          unit="calls"
          trend={-2}
          icon={RefreshIcon}
          status="healthy"
        />
      </div>


      {/* Charts Section */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">Performance Trend</h3>
            <p className="text-xs text-gray-500">Select one or more metrics to compare over time</p>
          </div>
          <div className="flex flex-col items-start gap-2">
            <span className="text-sm font-medium text-gray-700">Metrics</span>
            <div className="relative" ref={metricsDropdownRef}>
              <button
                type="button"
                onClick={() => setIsMetricsMenuOpen((prev) => !prev)}
                className="cursor-pointer select-none px-3 py-2 text-sm rounded border border-gray-300 bg-white text-gray-800 min-w-64 hover:border-gray-400 text-left flex items-center justify-between gap-3"
              >
                <span className="truncate">{selectedMetricsLabel}</span>
                <ChevronDown size={18} className="text-gray-500 shrink-0" />
              </button>

              {isMetricsMenuOpen && (
                <div className="absolute right-0 mt-2 z-20 w-80 rounded-lg border border-gray-300 bg-white shadow-xl p-2">
                  <div className="max-h-72 overflow-y-auto">
                    <label className="flex items-center gap-2 px-2 py-2 text-base text-gray-800 cursor-pointer hover:bg-gray-50 rounded">
                      <input
                        type="checkbox"
                        checked={areAllMetricsSelected}
                        onChange={toggleAllMetrics}
                        className="rounded border-gray-300 text-primary focus:ring-primary"
                      />
                      <span>All</span>
                    </label>

                    <div className="border-t border-gray-300 my-1" />

                    {metricOptions.map((metric) => (
                      <label key={metric.key} className="flex items-center gap-2 px-2 py-2 text-base text-gray-800 cursor-pointer hover:bg-gray-50 rounded">
                        <input
                          type="checkbox"
                          checked={selectedMetricKeys.includes(metric.key)}
                          onChange={() => toggleMetricSelection(metric.key)}
                          className="rounded border-gray-300 text-primary focus:ring-primary"
                        />
                        <span>{metric.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <ResponsiveContainer width="100%" height={420}>
          <ComposedChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="time" stroke="#9ca3af" />
            <YAxis yAxisId="left" stroke="#9ca3af" />
            {showSecondaryAxis && <YAxis yAxisId="right" orientation="right" stroke="#9ca3af" />}
            <Tooltip
              formatter={(value, name) => [`${value?.toLocaleString?.() ?? value}`, name]}
              contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
            />
            <Legend />

            {selectedMetrics.map((metric) => renderMetricSeries(metric))}
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Filter & Packages Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
        <div className="p-6 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Worst Performing Packages</h3>
              <p className="text-xs text-gray-500 mt-1">Top packages between {intervalLabel} by CPU, elapsed time, and get pages</p>
            </div>
            <span className="text-sm font-medium text-gray-600 bg-white px-3 py-1 rounded border border-gray-300">
              {filteredPackages.length} packages
            </span>
          </div>

          <div className="mb-4 p-4 rounded-lg border border-gray-200 bg-white">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">Watch List</h4>
              <span className="text-xs font-medium text-gray-600">{watchListPackages.length} favorited</span>
            </div>

            {watchListPackages.length === 0 ? (
              <p className="text-sm text-gray-500">No favorited packages yet. Click Watch on a package to add it here.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {watchListPackages.slice(0, 10).map((pkg) => {
                  const isReviewed = reviewedPackageIds.has(String(pkg.id))
                  return (
                    <div key={pkg.id} className="px-3 py-2 rounded border border-gray-300 bg-gray-50 text-sm flex items-center gap-2">
                      <span className="font-semibold text-gray-900">{pkg.name}</span>
                      <span className="text-gray-600">CPU: {pkg.totalCpu.toLocaleString()}</span>
                      {isReviewed && <span className="text-xs text-amber-700 font-medium">Reviewed</span>}
                      <button
                        onClick={() => navigate('/package-analyzer', { state: { packageId: pkg.id } })}
                        className="px-2 py-1 text-xs bg-primary text-white rounded hover:bg-primaryDark transition-colors"
                      >
                        Open
                      </button>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          <FilterBar
            onFilterChange={handleFilterChange}
            sortOptions={[
              { value: 'getpages', label: 'Sort by Get Pages' },
              { value: 'cpu', label: 'Sort by CPU' },
              { value: 'elapsed', label: 'Sort by Elapsed' },
            ]}
          />
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-4 text-center font-semibold text-gray-700 uppercase text-xs tracking-wide w-12">#</th>
                <th className="px-6 py-4 text-left font-semibold text-gray-700 uppercase text-xs tracking-wide">Package</th>
                <th className="px-6 py-4 text-right font-semibold text-gray-700 uppercase text-xs tracking-wide">CPU (ms)</th>
                <th className="px-6 py-4 text-right font-semibold text-gray-700 uppercase text-xs tracking-wide">SQL Calls</th>
                <th className="px-6 py-4 text-right font-semibold text-gray-700 uppercase text-xs tracking-wide">Ratio</th>
                <th className="px-6 py-4 text-right font-semibold text-gray-700 uppercase text-xs tracking-wide">Elapsed (ms)</th>
                <th className="px-6 py-4 text-right font-semibold text-gray-700 uppercase text-xs tracking-wide">Get Pages</th>
                <th className="px-6 py-4 text-center font-semibold text-gray-700 uppercase text-xs tracking-wide">Action</th>
              </tr>
            </thead>
            <tbody>
              {paginatedPackages.map((pkg, idx) => {
                const rowNumber = (currentPage - 1) * itemsPerPage + idx + 1
                return (
                  <tr key={pkg.id} className={`border-b border-gray-100 hover:bg-blue-50 transition-colors ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                    <td className="px-4 py-4 text-center text-gray-600 font-medium">{rowNumber}</td>
                    <td className="px-6 py-4 font-medium text-gray-900">{pkg.name}</td>
                    <td className="px-6 py-4 text-right text-gray-900 font-medium">{pkg.totalCpu.toLocaleString()}</td>
                    <td className="px-6 py-4 text-right text-gray-900 font-medium">{pkg.totalSqlCalls.toLocaleString()}</td>
                    <td className="px-6 py-4 text-right">
                      <span className="font-semibold text-blue-600">{pkg.sqlCallsToCpuRatio}</span>
                    </td>
                    <td className="px-6 py-4 text-right text-gray-900 font-medium">{pkg.totalElapsed.toLocaleString()}</td>
                    <td className="px-6 py-4 text-right">
                      <span className="font-semibold text-danger">{pkg.totalGetPages.toLocaleString()}</span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => toggleFavorite(pkg.id)}
                          className={`px-2 py-1 rounded font-medium text-xs transition-colors border ${favoritePackageIds.has(String(pkg.id)) ? 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`}
                        >
                          {favoritePackageIds.has(String(pkg.id)) ? 'Watching' : 'Watch'}
                        </button>

                        <button
                          onClick={() => toggleReviewed(pkg.id)}
                          className="px-2 py-1 rounded font-medium text-xs transition-colors border bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100"
                        >
                          Reviewed
                        </button>

                        <button
                          onClick={() => navigate('/package-analyzer', { state: { packageId: pkg.id } })}
                          className="px-3 py-2 bg-primary text-white rounded font-medium text-xs hover:bg-primaryDark transition-colors"
                        >
                          Analyze
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}

              {paginatedPackages.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-6 py-10 text-center text-sm text-gray-500">
                    No package data available for the selected interval.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer */}
          <div className="border-t border-gray-200 pt-4 py-4 px-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-3 self-start">
              <label htmlFor="itemsPerPageSelect" className="text-xs font-semibold text-gray-700 uppercase tracking-wide whitespace-nowrap">
                Rows per page
              </label>
              <select
                id="itemsPerPageSelect"
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value))
                  setCurrentPage(1)
                }}
                className="h-9 px-3 border border-gray-300 rounded-md text-sm bg-white text-gray-900 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary cursor-pointer"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>

            <Paginator
              currentPage={currentPage}
              totalItems={filteredPackages.length}
              itemsPerPage={itemsPerPage}
              onPageChange={setCurrentPage}
              embedded
            />
        </div>
      </div>
    </div>
  )
}
