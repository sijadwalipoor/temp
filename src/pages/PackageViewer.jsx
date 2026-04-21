import { useState, useEffect, useMemo } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Search as SearchIcon } from 'lucide-react'
import {
  Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ComposedChart, Bar,
} from 'recharts'
import FilterBar from '../components/FilterBar'
import Paginator from '../components/Paginator'
import StatusBanner from '../components/StatusBanner'
import TimeRangePicker from '../components/TimeRangePicker'
import { packageAPI } from '../services/api'
import { CheckIcon } from '../utils/icons'
import { getIntervalFromNow } from '../utils/timeInterval'
import {
  METRIC_OPTIONS,
  formatAxisValue,
  formatChartTick,
  formatChartTooltipLabel,
  getErrorMessage,
  normalizeBind,
  normalizePackage,
  normalizeStatement,
  normalizeTrendPoint,
} from './dashboard.utils'

const STATEMENT_SORT_OPTIONS = [
  { value: 'getPages', label: 'Sort by Get Pages' },
  { value: 'cpu', label: 'Sort by CPU' },
  { value: 'elapsed', label: 'Sort by Elapsed' },
]

const PAGE_SIZE = 50
const SEARCH_LIMIT = 50

export default function PackageViewer() {
  const navigate = useNavigate()
  const location = useLocation()

  const [searchInput, setSearchInput] = useState(location.state?.packageName ?? '')
  const [searchResults, setSearchResults] = useState([])
  const [searchState, setSearchState] = useState('idle') // 'idle' | 'loading' | 'done' | 'error'
  const [searchInfo, setSearchInfo] = useState('')

  const [selectedPackageName, setSelectedPackageName] = useState(location.state?.packageName ?? null)
  const [packageDetails, setPackageDetails] = useState(null)
  const [binds, setBinds] = useState([])
  const [selectedConToken, setSelectedConToken] = useState(null)
  const [statements, setStatements] = useState([])
  const [statementFilter, setStatementFilter] = useState({ search: '', sort: 'getPages' })
  const [currentPage, setCurrentPage] = useState(1)

  const [detailsLoading, setDetailsLoading] = useState(false)
  const [detailsError, setDetailsError] = useState('')

  const [trendInterval, setTrendInterval] = useState(getIntervalFromNow({ hours: 24 }))
  const [trendData, setTrendData] = useState([])
  const [trendLoading, setTrendLoading] = useState(false)
  const [trendError, setTrendError] = useState('')

  const runSearch = async (term) => {
    const q = term.trim()
    if (!q) {
      setSearchResults([])
      setSearchState('idle')
      setSearchInfo('')
      return
    }

    setSearchState('loading')
    setSearchInfo('')
    try {
      const data = await packageAPI.searchPackages({ q, limit: SEARCH_LIMIT })
      const normalized = Array.isArray(data) ? data.map(normalizePackage) : []
      setSearchResults(normalized)
      setSearchState('done')
      setSearchInfo(
        normalized.length >= SEARCH_LIMIT
          ? `Showing first ${SEARCH_LIMIT} matches — refine your query for more precise results.`
          : `${normalized.length} match${normalized.length === 1 ? '' : 'es'}`,
      )
    } catch (err) {
      setSearchResults([])
      setSearchState('error')
      setSearchInfo(getErrorMessage(err, 'Search failed'))
    }
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    runSearch(searchInput)
  }

  useEffect(() => {
    if (!selectedPackageName) return

    let cancelled = false
    const load = async () => {
      setDetailsLoading(true)
      setDetailsError('')
      try {
        const [detailsRaw, bindsRaw] = await Promise.all([
          packageAPI.getPackageDetails(selectedPackageName, { showBinds: false, showSqlStatements: false }),
          packageAPI.getBindsByPackage(selectedPackageName),
        ])
        if (cancelled) return

        const details = detailsRaw ? normalizePackage(detailsRaw) : null
        const normalizedBinds = Array.isArray(bindsRaw) ? bindsRaw.map(normalizeBind) : []

        setPackageDetails(details)
        setBinds(normalizedBinds)
        setSelectedConToken(normalizedBinds[0]?.conToken ?? null)
        setStatements([])
        setCurrentPage(1)
      } catch (err) {
        if (!cancelled) {
          setDetailsError(getErrorMessage(err, 'Failed to load package details'))
          setPackageDetails(null)
          setBinds([])
          setStatements([])
        }
      } finally {
        if (!cancelled) setDetailsLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [selectedPackageName])

  useEffect(() => {
    if (!selectedPackageName || !selectedConToken) {
      setStatements([])
      return undefined
    }

    let cancelled = false
    const load = async () => {
      try {
        const raw = await packageAPI.getStatementsByBind(selectedPackageName, selectedConToken)
        if (cancelled) return
        const normalized = Array.isArray(raw) ? raw.map(normalizeStatement) : []
        setStatements(normalized)
        setCurrentPage(1)
      } catch (err) {
        if (!cancelled) {
          setStatements([])
          setDetailsError(getErrorMessage(err, 'Failed to load statements'))
        }
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [selectedPackageName, selectedConToken])

  useEffect(() => {
    if (!selectedPackageName) {
      setTrendData([])
      setTrendError('')
      return undefined
    }

    let cancelled = false
    const load = async () => {
      setTrendLoading(true)
      setTrendError('')
      try {
        const raw = await packageAPI.getMetricsTrend(selectedPackageName, trendInterval)
        if (cancelled) return
        const points = Array.isArray(raw) ? raw.map(normalizeTrendPoint) : []
        setTrendData(points)
      } catch (err) {
        if (!cancelled) {
          setTrendData([])
          setTrendError(getErrorMessage(err, 'Failed to load performance trend'))
        }
      } finally {
        if (!cancelled) setTrendLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [selectedPackageName, trendInterval])

  const trendSpanMs = useMemo(() => {
    if (trendData.length < 2) return 0
    const first = trendData[0].timestamp
    const last = trendData[trendData.length - 1].timestamp
    return Math.max(0, last - first)
  }, [trendData])

  const filteredStatements = useMemo(() => {
    const term = statementFilter.search.trim().toLowerCase()
    const filtered = term
      ? statements.filter((stmt) => stmt.sqlText.toLowerCase().includes(term))
      : [...statements]

    if (statementFilter.sort === 'cpu') {
      filtered.sort((a, b) => b.totalCpu - a.totalCpu)
    } else if (statementFilter.sort === 'elapsed') {
      filtered.sort((a, b) => b.totalElapsed - a.totalElapsed)
    } else {
      filtered.sort((a, b) => b.totalGetPages - a.totalGetPages)
    }
    return filtered
  }, [statements, statementFilter])

  const paginatedStatements = filteredStatements.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  )

  const handlePackageSelect = (pkg) => {
    setSelectedPackageName(pkg.program)
    setSearchInput(pkg.program)
  }

  const handleStatementFilter = ({ search, sort }) => {
    setStatementFilter({ search: search ?? '', sort: sort ?? 'getPages' })
    setCurrentPage(1)
  }

  return (
    <div className="p-6 space-y-6">
      {detailsLoading && <StatusBanner type="info" message="Loading package details..." />}
      <StatusBanner type="error" message={detailsError} />

      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-1">Search Packages</h3>
        <p className="text-xs text-gray-500 mb-4">
          Matches the program name by prefix against the DB2 catalog. Type at least one character, then press Search.
        </p>

        <form onSubmit={handleSubmit} className="flex items-center gap-3 max-w-2xl">
          <div className="relative flex-1">
            <SearchIcon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="e.g. ORD, CUST, BATCH42..."
              className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
              autoFocus
            />
          </div>
          <button
            type="submit"
            disabled={searchState === 'loading' || !searchInput.trim()}
            className="px-5 py-2 bg-primary text-white rounded-md hover:bg-primaryDark disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
          >
            {searchState === 'loading' ? 'Searching…' : 'Search'}
          </button>
          {searchInput && (
            <button
              type="button"
              onClick={() => {
                setSearchInput('')
                setSearchResults([])
                setSearchState('idle')
                setSearchInfo('')
              }}
              className="px-3 py-2 text-sm text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Clear
            </button>
          )}
        </form>

        {searchInfo && (
          <p className={`text-xs mt-3 ${searchState === 'error' ? 'text-red-600' : 'text-gray-600'}`}>
            {searchInfo}
          </p>
        )}

        {searchState === 'done' && searchResults.length > 0 && (
          <div className="mt-4 border border-gray-200 rounded-md bg-white max-h-80 overflow-y-auto">
            {searchResults.map((pkg) => {
              const isSelected = pkg.program === selectedPackageName
              return (
                <button
                  key={pkg.packageKey}
                  type="button"
                  onClick={() => handlePackageSelect(pkg)}
                  className={`w-full text-left px-4 py-3 border-b last:border-b-0 transition-colors ${isSelected ? 'bg-blue-50' : 'hover:bg-gray-50'}`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-gray-900">{pkg.program}</span>
                    <span className="text-xs text-gray-500 font-mono">{pkg.conToken || '—'}</span>
                  </div>
                  <p className="text-xs text-gray-600 mt-1">Collection: {pkg.collection || '—'}</p>
                </button>
              )
            })}
          </div>
        )}

        {searchState === 'done' && searchResults.length === 0 && (
          <p className="text-sm text-gray-500 mt-4">No packages match that prefix.</p>
        )}
      </div>

      {packageDetails && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <SummaryCard label="Program" value={packageDetails.program || '—'} />
            <SummaryCard label="Collection" value={packageDetails.collection || '—'} />
            <SummaryCard label="Total CPU (ms)" value={packageDetails.totalCpu.toLocaleString()} />
            <SummaryCard label="Total Get Pages" value={packageDetails.totalGetPages.toLocaleString()} />
          </div>

          <TimeRangePicker onRangeChange={({ from, to }) => setTrendInterval({ from, to })} defaultInterval={trendInterval} />

          <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-1">Performance Trend</h3>
              <p className="text-xs text-gray-500">CPU, elapsed, get pages and SQL calls for this package over time</p>
            </div>

            {trendLoading && <StatusBanner type="info" message="Loading performance trend..." />}
            <StatusBanner type="error" message={trendError} />

            <ResponsiveContainer width="100%" height={360}>
              <ComposedChart data={trendData} margin={{ top: 20, right: 20, bottom: 0, left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis
                  dataKey="timestamp"
                  type="number"
                  scale="time"
                  domain={['dataMin', 'dataMax']}
                  padding={{ left: 20, right: 20 }}
                  tickFormatter={(value) => formatChartTick(value, trendSpanMs)}
                  stroke="#9ca3af"
                />
                <YAxis yAxisId="left" width={70} tickFormatter={formatAxisValue} domain={[0, 'auto']} stroke="#9ca3af" />
                <YAxis yAxisId="right" orientation="right" width={70} tickFormatter={formatAxisValue} domain={[0, 'auto']} stroke="#9ca3af" />
                <Tooltip
                  labelFormatter={(value) => formatChartTooltipLabel(value)}
                  formatter={(value, name) => [`${value?.toLocaleString?.() ?? value}`, name]}
                  contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                />
                <Legend />
                {METRIC_OPTIONS.map((metric) => {
                  const yAxisId = metric.unit === 'ms' ? 'left' : 'right'
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
                      strokeWidth={2}
                      name={`${metric.label} (${metric.unit})`}
                      dot={false}
                    />
                  )
                })}
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Binds</h3>
            {binds.length === 0 && <div className="text-sm text-gray-500">No binds found for this package.</div>}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {binds.map((bind, idx) => {
                const isSelected = bind.conToken === selectedConToken
                return (
                  <button
                    type="button"
                    key={bind.id}
                    onClick={() => setSelectedConToken(bind.conToken)}
                    className={`text-left border rounded-lg p-4 transition-colors ${isSelected ? 'border-primary bg-primary/5' : 'border-gray-200 bg-gray-50 hover:bg-gray-100'}`}
                  >
                    <div className="flex justify-between items-start mb-3">
                      <span className="text-sm font-medium text-gray-600">Bind #{idx + 1}</span>
                      {bind.isCurrent && (
                        <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded flex items-center space-x-1">
                          <CheckIcon size={14} />
                          <span>Current</span>
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-600 mb-1">
                      <span className="font-medium">CONTOKEN:</span> {bind.conToken || '—'}
                    </p>
                    <p className="text-xs text-gray-600 mb-1">
                      <span className="font-medium">Bind Time:</span>{' '}
                      {bind.bindTime ? new Date(bind.bindTime).toLocaleString() : '—'}
                    </p>
                    {bind.version && (
                      <p className="text-xs text-gray-600">
                        <span className="font-medium">Version:</span> {bind.version}
                      </p>
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        </>
      )}

      {selectedPackageName && (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Statements {selectedConToken ? `· ${selectedConToken}` : ''}
            </h3>
            <FilterBar onFilterChange={handleStatementFilter} sortOptions={STATEMENT_SORT_OPTIONS} />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left font-semibold text-gray-700">SQL Text</th>
                  <th className="px-6 py-3 text-right font-semibold text-gray-700">Exec Count</th>
                  <th className="px-6 py-3 text-right font-semibold text-gray-700">CPU (ms)</th>
                  <th className="px-6 py-3 text-right font-semibold text-gray-700">Elapsed (ms)</th>
                  <th className="px-6 py-3 text-right font-semibold text-gray-700">Get Pages</th>
                  <th className="px-6 py-3 text-center font-semibold text-gray-700">Action</th>
                </tr>
              </thead>
              <tbody>
                {paginatedStatements.map((stmt, idx) => (
                  <tr key={stmt.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-6 py-3 text-gray-600 max-w-md truncate" title={stmt.sqlText}>{stmt.sqlText || '—'}</td>
                    <td className="px-6 py-3 text-right text-gray-900 font-medium">{stmt.executionCount.toLocaleString()}</td>
                    <td className="px-6 py-3 text-right text-gray-900 font-medium">{stmt.totalCpu.toLocaleString()}</td>
                    <td className="px-6 py-3 text-right text-gray-900 font-medium">{stmt.totalElapsed.toLocaleString()}</td>
                    <td className="px-6 py-3 text-right text-red-600 font-medium">{stmt.totalGetPages.toLocaleString()}</td>
                    <td className="px-6 py-3 text-center">
                      <button
                        onClick={() => navigate(`/statement/${encodeURIComponent(stmt.id)}`, { state: { statement: stmt } })}
                        className="px-3 py-1 bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100 text-xs font-medium"
                      >
                        Analyze
                      </button>
                    </td>
                  </tr>
                ))}

                {paginatedStatements.length === 0 && !detailsLoading && (
                  <tr>
                    <td colSpan={6} className="px-6 py-10 text-center text-sm text-gray-500">
                      No statements found for the selected bind.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <Paginator
            currentPage={currentPage}
            totalItems={filteredStatements.length}
            itemsPerPage={PAGE_SIZE}
            onPageChange={setCurrentPage}
          />
        </div>
      )}
    </div>
  )
}

function SummaryCard({ label, value }) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h3 className="text-sm font-medium text-gray-600 mb-2">{label}</h3>
      <p className="text-2xl font-bold text-gray-900 break-words">{value}</p>
    </div>
  )
}
