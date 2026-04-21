import { useState, useEffect, useRef, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, ComposedChart, Bar,
} from 'recharts'
import { ChevronDown, Star } from 'lucide-react'
import TimeRangePicker from '../components/TimeRangePicker'
import MetricsCard from '../components/MetricsCard'
import FilterBar from '../components/FilterBar'
import Paginator from '../components/Paginator'
import StatusBanner from '../components/StatusBanner'
import { CpuIcon, TimerIcon, GetPagesIcon, RefreshIcon } from '../utils/icons'
import { formatIntervalLabel, getIntervalFromNow } from '../utils/timeInterval'
import { METRIC_OPTIONS, SORT_OPTIONS, formatAxisValue, formatChartTick, formatChartTooltipLabel } from './dashboard.utils'
import { useDashboardData } from '../hooks/useDashboardData'
import {
  FAVORITE_PACKAGES_STORAGE_KEY,
  readPackageMap,
  writePackageMap,
} from '../utils/packageState'

const SORT_SELECT_OPTIONS = SORT_OPTIONS.map((opt) => ({ value: opt.value, label: `Sort by ${opt.label}` }))

export default function Dashboard() {
  const navigate = useNavigate()
  const metricsDropdownRef = useRef(null)
  const [interval, setInterval] = useState(getIntervalFromNow({ hours: 24 }))
  const [selectedMetricKeys, setSelectedMetricKeys] = useState(['cpu', 'elapsed'])
  const [isMetricsMenuOpen, setIsMetricsMenuOpen] = useState(false)
  const [refreshCounter, setRefreshCounter] = useState(0)
  const [pageNumber, setPageNumber] = useState(1)
  const [pageSize, setPageSize] = useState(25)
  const [sortBy, setSortBy] = useState('DB2_CPU')
  const [search, setSearch] = useState('')
  const [favorites, setFavorites] = useState(() => readPackageMap(FAVORITE_PACKAGES_STORAGE_KEY))

  const { chartData, packages, kpis, meta, loading, error } = useDashboardData({
    interval, pageNumber, pageSize, sortBy, refreshCounter,
  })

  const selectedMetrics = METRIC_OPTIONS.filter((metric) => selectedMetricKeys.includes(metric.key))
  const selectedMetricsLabel =
    selectedMetrics.length > 2
      ? `${selectedMetrics.slice(0, 2).map((m) => m.label).join(', ')}, ...`
      : selectedMetrics.map((m) => m.label).join(', ')
  const areAllMetricsSelected = selectedMetricKeys.length === METRIC_OPTIONS.length
  const primaryUnit = selectedMetrics[0]?.unit
  const showSecondaryAxis = selectedMetrics.some((metric) => metric.unit !== primaryUnit)
  const intervalLabel = formatIntervalLabel(interval)

  const chartSpanMs = useMemo(() => {
    if (chartData.length < 2) return 0
    const first = chartData[0].timestamp
    const last = chartData[chartData.length - 1].timestamp
    return Math.max(0, last - first)
  }, [chartData])

  useEffect(() => {
    writePackageMap(FAVORITE_PACKAGES_STORAGE_KEY, favorites)
  }, [favorites])

  useEffect(() => {
    if (!isMetricsMenuOpen) return undefined

    const handleMouseDown = (event) => {
      if (metricsDropdownRef.current && !metricsDropdownRef.current.contains(event.target)) {
        setIsMetricsMenuOpen(false)
      }
    }
    const handleEscape = (event) => {
      if (event.key === 'Escape') setIsMetricsMenuOpen(false)
    }

    document.addEventListener('mousedown', handleMouseDown)
    document.addEventListener('keydown', handleEscape)
    return () => {
      document.removeEventListener('mousedown', handleMouseDown)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [isMetricsMenuOpen])

  const handleTimeRangeChange = ({ from, to }) => {
    setInterval({ from, to })
    setPageNumber(1)
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

  const toggleAllMetrics = () => {
    if (areAllMetricsSelected) setSelectedMetricKeys(['cpu'])
    else setSelectedMetricKeys(METRIC_OPTIONS.map((metric) => metric.key))
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

  const handleFilterChange = ({ search: nextSearch, sort }) => {
    setSearch(nextSearch ?? '')
    if (sort) setSortBy(sort)
    setPageNumber(1)
  }

  const visiblePackages = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) return packages
    return packages.filter((pkg) =>
      pkg.displayName.toLowerCase().includes(term) ||
      pkg.program.toLowerCase().includes(term)
    )
  }, [packages, search])

  const toggleFavorite = (pkg) => {
    setFavorites((prev) => {
      const next = { ...prev }
      if (next[pkg.packageKey]) delete next[pkg.packageKey]
      else next[pkg.packageKey] = packageSummary(pkg)
      return next
    })
  }

  const openAnalyzer = (pkg) => {
    navigate('/package-viewer', { state: { packageName: pkg.program, packageKey: pkg.packageKey } })
  }

  return (
    <div className="p-8 space-y-8 bg-light min-h-screen">
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

      <TimeRangePicker onRangeChange={handleTimeRangeChange} defaultInterval={interval} />

      {loading && <StatusBanner type="info" message="Loading dashboard data..." />}
      <StatusBanner type="error" message={error} />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricsCard title="Total DB2 CPU" value={kpis.totalCpu} unit="ms" icon={CpuIcon} />
        <MetricsCard title="Total Elapsed Time" value={kpis.totalElapsed} unit="ms" icon={TimerIcon} />
        <MetricsCard title="Total Get Pages" value={kpis.totalGetPages} unit="pages" icon={GetPagesIcon} />
        <MetricsCard title="Total SQL Calls" value={kpis.totalSqlCalls} unit="calls" icon={RefreshIcon} />
      </div>

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

                    {METRIC_OPTIONS.map((metric) => (
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
          <ComposedChart data={chartData} margin={{ top: 20, right: 20, bottom: 0, left: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey="timestamp"
              type="number"
              scale="time"
              domain={['dataMin', 'dataMax']}
              padding={{ left: 20, right: 20 }}
              tickFormatter={(value) => formatChartTick(value, chartSpanMs)}
              stroke="#9ca3af"
            />
            <YAxis yAxisId="left" width={70} tickFormatter={formatAxisValue} domain={[0, 'auto']} stroke="#9ca3af" />
            {showSecondaryAxis && <YAxis yAxisId="right" orientation="right" width={70} tickFormatter={formatAxisValue} domain={[0, 'auto']} stroke="#9ca3af" />}
            <Tooltip
              labelFormatter={(value) => formatChartTooltipLabel(value)}
              formatter={(value, name) => [`${value?.toLocaleString?.() ?? value}`, name]}
              contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
            />
            <Legend />
            {selectedMetrics.map((metric) => renderMetricSeries(metric))}
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
        <div className="p-6 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Worst Performing Packages</h3>
              <p className="text-xs text-gray-500 mt-1">Top packages between {intervalLabel}</p>
            </div>
            <span className="text-sm font-medium text-gray-600 bg-white px-3 py-1 rounded border border-gray-300">
              {meta.totalItems.toLocaleString()} packages
            </span>
          </div>

          <FilterBar onFilterChange={handleFilterChange} sortOptions={SORT_SELECT_OPTIONS} />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-2 py-4 text-center font-semibold text-gray-700 uppercase text-xs tracking-wide w-10"><span className="sr-only">Watch</span></th>
                <th className="px-4 py-4 text-center font-semibold text-gray-700 uppercase text-xs tracking-wide w-12">#</th>
                <th className="px-6 py-4 text-left font-semibold text-gray-700 uppercase text-xs tracking-wide">Package</th>
                <th className="px-6 py-4 text-right font-semibold text-gray-700 uppercase text-xs tracking-wide">CPU (ms)</th>
                <th className="px-6 py-4 text-right font-semibold text-gray-700 uppercase text-xs tracking-wide">SQL Calls</th>
                <th className="px-6 py-4 text-right font-semibold text-gray-700 uppercase text-xs tracking-wide">Calls / CPU ms</th>
                <th className="px-6 py-4 text-right font-semibold text-gray-700 uppercase text-xs tracking-wide">Elapsed (ms)</th>
                <th className="px-6 py-4 text-right font-semibold text-gray-700 uppercase text-xs tracking-wide">Get Pages</th>
                <th className="px-6 py-4 text-center font-semibold text-gray-700 uppercase text-xs tracking-wide">Action</th>
              </tr>
            </thead>
            <tbody>
              {visiblePackages.map((pkg, idx) => {
                const rowNumber = (pageNumber - 1) * pageSize + idx + 1
                const isFav = Boolean(favorites[pkg.packageKey])
                return (
                  <tr key={pkg.packageKey} className={`border-b border-gray-100 hover:bg-blue-50 transition-colors ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                    <td className="px-2 py-4 text-center">
                      <button
                        onClick={() => toggleFavorite(pkg)}
                        title={isFav ? 'Unwatch' : 'Watch'}
                        aria-label={isFav ? 'Unwatch package' : 'Watch package'}
                        className="p-1 rounded hover:bg-gray-100 transition-colors"
                      >
                        <Star
                          size={18}
                          className={isFav ? 'text-amber-500' : 'text-gray-300 hover:text-gray-400'}
                          fill={isFav ? '#f59e0b' : 'none'}
                        />
                      </button>
                    </td>
                    <td className="px-4 py-4 text-center text-gray-600 font-medium">{rowNumber}</td>
                    <td className="px-6 py-4 font-medium">
                      <button
                        onClick={() => openAnalyzer(pkg)}
                        className="text-primary hover:text-primaryDark hover:underline font-medium text-left"
                      >
                        {pkg.displayName}
                      </button>
                    </td>
                    <td className="px-6 py-4 text-right text-gray-900 font-medium">{pkg.totalCpu.toLocaleString()}</td>
                    <td className="px-6 py-4 text-right text-gray-900 font-medium">{pkg.totalSqlCalls.toLocaleString()}</td>
                    <td className="px-6 py-4 text-right">
                      <span className="font-semibold text-blue-600">{pkg.callsPerCpuMs}</span>
                    </td>
                    <td className="px-6 py-4 text-right text-gray-900 font-medium">{pkg.totalElapsed.toLocaleString()}</td>
                    <td className="px-6 py-4 text-right">
                      <span className="font-semibold text-danger">{pkg.totalGetPages.toLocaleString()}</span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => openAnalyzer(pkg)}
                        className="px-3 py-2 bg-primary text-white rounded font-medium text-xs hover:bg-primaryDark transition-colors"
                      >
                        Analyze
                      </button>
                    </td>
                  </tr>
                )
              })}

              {visiblePackages.length === 0 && !loading && (
                <tr>
                  <td colSpan={9} className="px-6 py-10 text-center text-sm text-gray-500">
                    No package data available for the selected interval.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="border-t border-gray-200 pt-4 py-4 px-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3 self-start">
            <label htmlFor="pageSizeSelect" className="text-xs font-semibold text-gray-700 uppercase tracking-wide whitespace-nowrap">
              Rows per page
            </label>
            <select
              id="pageSizeSelect"
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value))
                setPageNumber(1)
              }}
              className="h-9 px-3 border border-gray-300 rounded-md text-sm bg-white text-gray-900 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary cursor-pointer"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>

          <Paginator
            currentPage={pageNumber}
            totalItems={meta.totalItems}
            itemsPerPage={pageSize}
            onPageChange={setPageNumber}
            embedded
          />
        </div>
      </div>
    </div>
  )
}

const packageSummary = (pkg) => ({
  packageKey: pkg.packageKey,
  collection: pkg.collection,
  program: pkg.program,
  conToken: pkg.conToken,
  displayName: pkg.displayName,
  totalCpu: pkg.totalCpu,
  totalElapsed: pkg.totalElapsed,
  totalGetPages: pkg.totalGetPages,
  totalSqlCalls: pkg.totalSqlCalls,
})
