import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer
} from 'recharts'
import FilterBar from '../components/FilterBar'
import Paginator from '../components/Paginator'
import TimeRangePicker from '../components/TimeRangePicker'
import StatusBanner from '../components/StatusBanner'
import { packageAPI } from '../services/api'
import { CheckIcon } from '../utils/icons'
import { getIntervalFromNow } from '../utils/timeInterval'

const EMPTY_PACKAGE_DATA = {
  id: null,
  name: 'N/A',
  program: 'N/A',
  collection: 'XDB2I',
  binds: [],
  statements: [],
  trends: [],
}

export default function PackageAnalyzer() {
  const navigate = useNavigate()
  const location = useLocation()
  const [packageData, setPackageData] = useState(EMPTY_PACKAGE_DATA)
  const [packageOptions, setPackageOptions] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedPackageId, setSelectedPackageId] = useState(null)
  const [interval, setInterval] = useState(getIntervalFromNow({ hours: 24 }))
  const [rawStatements, setRawStatements] = useState([])
  const [loading, setLoading] = useState(false)
  const [packageSearchLoading, setPackageSearchLoading] = useState(false)
  const [error, setError] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [filteredStatements, setFilteredStatements] = useState([])
  const itemsPerPage = 50

  useEffect(() => {
    const rawInitialPackageId = location.state?.packageId
    if (rawInitialPackageId === undefined || rawInitialPackageId === null || rawInitialPackageId === '') return

    const initialPackageId = String(rawInitialPackageId)

    const loadInitialPackage = async () => {
      setPackageSearchLoading(true)
      try {
        const packageRes = await packageAPI.getPackage(initialPackageId)
        const payload = packageRes.data?.data ?? packageRes.data ?? {}
        const normalized = {
          id: payload.id ?? payload.packageId ?? initialPackageId,
          name: payload.name ?? payload.packageName ?? `PACKAGE_${initialPackageId}`,
          program: payload.program ?? payload.programName ?? 'N/A',
        }
        setPackageOptions([normalized])
        setSelectedPackageId(String(normalized.id))
        setSearchQuery(normalized.name)
      } catch {
        setSelectedPackageId(initialPackageId)
      } finally {
        setPackageSearchLoading(false)
      }
    }

    loadInitialPackage()
  }, [location.state])

  useEffect(() => {
    const handler = setTimeout(async () => {
      setPackageSearchLoading(true)

      try {
        const packageListRes = await packageAPI.listPackages({
          page: 1,
          pageSize: 25,
          search: searchQuery.trim(),
        })

        const packageList =
          packageListRes.data?.items ??
          packageListRes.data?.data?.items ??
          packageListRes.data?.data ??
          packageListRes.data ??
          []

        const normalizedOptions = Array.isArray(packageList)
          ? packageList.map((pkg, idx) => ({
              id: String(pkg.id ?? pkg.packageId ?? idx + 1),
              name: pkg.name ?? pkg.packageName ?? `PACKAGE_${idx + 1}`,
              program: pkg.program ?? pkg.programName ?? 'N/A',
            }))
          : []

        setPackageOptions(normalizedOptions)
      } catch {
        setPackageOptions([])
      } finally {
        setPackageSearchLoading(false)
      }
    }, 300)

    return () => clearTimeout(handler)
  }, [searchQuery])

  useEffect(() => {
    if (!selectedPackageId) return

    const loadPackageData = async () => {
      setLoading(true)
      setError('')

      try {
        const [packageRes, bindingsRes, trendRes, statementsRes] = await Promise.all([
          packageAPI.getPackage(selectedPackageId),
          packageAPI.getBindingHistory(selectedPackageId),
          packageAPI.getPackagePerformanceTrend(selectedPackageId, interval),
          packageAPI.getPackageStatements(selectedPackageId, {
            page: 1,
            pageSize: 500,
            sortBy: 'getPages',
            ...interval,
          }),
        ])

        const packagePayload = packageRes.data?.data ?? packageRes.data ?? {}
        const bindingsPayload =
          bindingsRes.data?.data?.binds ??
          bindingsRes.data?.binds ??
          bindingsRes.data?.data ??
          bindingsRes.data ??
          []
        const trendPayload = trendRes.data?.data ?? trendRes.data ?? []
        const statementsPayload =
          statementsRes.data?.data?.sqlStatements ??
          statementsRes.data?.sqlStatements ??
          statementsRes.data?.items ??
          statementsRes.data?.data?.items ??
          statementsRes.data?.data ??
          statementsRes.data ??
          []

        const normalizedStatements = Array.isArray(statementsPayload)
          ? statementsPayload.map((stmt, idx) => ({
              ...stmt,
              id: stmt.id ?? stmt.statementId ?? idx + 1,
              sqlText: stmt.sqlText ?? stmt.text ?? 'N/A',
              executionCount: Number(stmt.executionCount ?? stmt.execCount ?? 0),
              totalCpu: Number(stmt.totalCpu ?? stmt.cpu ?? 0),
              totalElapsed: Number(stmt.totalElapsed ?? stmt.elapsed ?? 0),
              totalGetPages: Number(stmt.totalGetPages ?? stmt.getPages ?? 0),
            }))
          : []

        setRawStatements(normalizedStatements)
        setFilteredStatements(normalizedStatements)

        setPackageData({
          id: packagePayload.id ?? packagePayload.packageId ?? selectedPackageId,
          name: packagePayload.name ?? packagePayload.packageName ?? `PACKAGE_${selectedPackageId}`,
          program: packagePayload.program ?? packagePayload.programName ?? 'N/A',
          collection: packagePayload.collection ?? 'XDB2I',
          binds: Array.isArray(bindingsPayload)
            ? bindingsPayload.map((bind) => ({
                ...bind,
                contoken: bind.contoken ?? bind.conToken,
              }))
            : [],
          statements: normalizedStatements,
          trends: Array.isArray(trendPayload) ? trendPayload : [],
        })
      } catch (err) {
        setError(err?.response?.data?.message || 'Failed to load package details')
        setPackageData(EMPTY_PACKAGE_DATA)
        setRawStatements([])
        setFilteredStatements([])
      } finally {
        setLoading(false)
      }
    }

    loadPackageData()
  }, [selectedPackageId, interval])

  const handlePackageSelect = (pkg) => {
    setSelectedPackageId(String(pkg.id))
    setSearchQuery(pkg.name)
    setCurrentPage(1)
  }

  const handleIntervalChange = ({ from, to }) => {
    setInterval({ from, to })
    setCurrentPage(1)
  }

  const handleFilterChange = ({ search, sort }) => {
    if (!packageData) return

    let filtered = [...rawStatements]

    if (search) {
      filtered = filtered.filter((stmt) =>
        stmt.sqlText.toLowerCase().includes(search.toLowerCase())
      )
    }

    if (sort === 'cpu') {
      filtered.sort((a, b) => b.totalCpu - a.totalCpu)
    } else if (sort === 'elapsed') {
      filtered.sort((a, b) => b.totalElapsed - a.totalElapsed)
    } else if (sort === 'getpages') {
      filtered.sort((a, b) => b.totalGetPages - a.totalGetPages)
    }

    setFilteredStatements(filtered)
    setCurrentPage(1)
  }

  const paginatedStatements = filteredStatements.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  return (
    <div className="p-6 space-y-6">
      {loading && <StatusBanner type="info" message="Loading package analysis..." />}
      <StatusBanner type="error" message={error} />

      {/* Package Selector */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Search Package:
        </label>
        <div className="max-w-2xl">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Type package name or ID..."
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          <div className="mt-2 border border-gray-200 rounded-md bg-white max-h-64 overflow-y-auto">
            {packageSearchLoading && (
              <div className="px-4 py-3 text-sm text-gray-500">Searching packages...</div>
            )}

            {!packageSearchLoading && packageOptions.length === 0 && (
              <div className="px-4 py-3 text-sm text-gray-500">No packages found.</div>
            )}

            {!packageSearchLoading && packageOptions.map((pkg) => {
              const isSelected = String(pkg.id) === String(selectedPackageId)
              return (
                <button
                  key={pkg.id}
                  type="button"
                  onClick={() => handlePackageSelect(pkg)}
                  className={`w-full text-left px-4 py-3 border-b last:border-b-0 transition-colors ${isSelected ? 'bg-blue-50' : 'hover:bg-gray-50'}`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-gray-900">{pkg.name}</span>
                    <span className="text-xs text-gray-500">ID: {pkg.id}</span>
                  </div>
                  <p className="text-xs text-gray-600 mt-1">Program: {pkg.program}</p>
                </button>
              )
            })}
          </div>
        </div>
      </div>

      <TimeRangePicker onRangeChange={handleIntervalChange} defaultInterval={interval} />

      {/* Package Details */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-sm font-medium text-gray-600 mb-2">Package Name</h3>
          <p className="text-2xl font-bold text-gray-900">{packageData.name}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-sm font-medium text-gray-600 mb-2">Collection</h3>
          <p className="text-2xl font-bold text-gray-900">{packageData.collection}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-sm font-medium text-gray-600 mb-2">Total Statements</h3>
          <p className="text-2xl font-bold text-gray-900">{packageData.statements.length}</p>
        </div>
      </div>

      {/* Binding History */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Binding History (Last 3 Binds)</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {packageData.binds.length === 0 && (
            <div className="md:col-span-3 text-sm text-gray-500">No binding history available.</div>
          )}
          {packageData.binds.map((bind, idx) => (
            <div key={idx} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
              <div className="flex justify-between items-start mb-3">
                <span className="text-sm font-medium text-gray-600">Bind #{idx + 1}</span>
                {idx === 0 && (
                  <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded flex items-center space-x-1">
                    <CheckIcon size={14} />
                    <span>Current</span>
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-600 mb-2">
                <span className="font-medium">CONTOKEN:</span> {bind.contoken}
              </p>
              <p className="text-xs text-gray-600 mb-2">
                <span className="font-medium">Bind Time:</span> {new Date(bind.bindTime).toLocaleString()}
              </p>
              <p className="text-xs text-gray-600 mb-2">
                <span className="font-medium">Isolation Level:</span> {bind.isolationLevel}
              </p>
              <p className="text-xs text-gray-600">
                <span className="font-medium">Statements:</span> {bind.statementCount}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Performance Trend (per bind version) */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Trend</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={packageData.trends}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="time" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line
              type="monotone"
              dataKey="cpu"
              stroke="#ef4444"
              strokeWidth={2}
              name="CPU (ms)"
            />
            <Line
              type="monotone"
              dataKey="elapsed"
              stroke="#3b82f6"
              strokeWidth={2}
              name="Elapsed (ms)"
            />
            <Line
              type="monotone"
              dataKey="getPages"
              stroke="#8b5cf6"
              strokeWidth={2}
              name="Get Pages"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Statements in Package */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Statements</h3>
          <FilterBar
            onFilterChange={handleFilterChange}
            sortOptions={[
              { value: 'getpages', label: 'Sort by Get Pages' },
              { value: 'cpu', label: 'Sort by CPU' },
              { value: 'elapsed', label: 'Sort by Elapsed' },
            ]}
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left font-semibold text-gray-700">SQL Text</th>
                <th className="px-6 py-3 text-left font-semibold text-gray-700">Exec Count</th>
                <th className="px-6 py-3 text-right font-semibold text-gray-700">CPU (ms)</th>
                <th className="px-6 py-3 text-right font-semibold text-gray-700">Elapsed (ms)</th>
                <th className="px-6 py-3 text-right font-semibold text-gray-700">Get Pages</th>
                <th className="px-6 py-3 text-center font-semibold text-gray-700">Action</th>
              </tr>
            </thead>
            <tbody>
              {paginatedStatements.map((stmt, idx) => (
                <tr key={stmt.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="px-6 py-3 text-gray-600 max-w-md truncate">{stmt.sqlText}</td>
                  <td className="px-6 py-3 text-gray-600">{stmt.executionCount.toLocaleString()}</td>
                  <td className="px-6 py-3 text-right text-gray-900 font-medium">{stmt.totalCpu.toLocaleString()}</td>
                  <td className="px-6 py-3 text-right text-gray-900 font-medium">{stmt.totalElapsed.toLocaleString()}</td>
                  <td className="px-6 py-3 text-right text-gray-900 font-medium text-red-600">{stmt.totalGetPages.toLocaleString()}</td>
                  <td className="px-6 py-3 text-center">
                    <button
                      onClick={() => navigate(`/statement/${stmt.id}`, { state: { statement: stmt } })}
                      className="px-3 py-1 bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100 text-xs font-medium"
                    >
                      Analyze
                    </button>
                  </td>
                </tr>
              ))}

              {paginatedStatements.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-sm text-gray-500">
                    No statements available for the selected package and interval.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <Paginator
          currentPage={currentPage}
          totalItems={filteredStatements.length}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
        />
      </div>
    </div>
  )
}
