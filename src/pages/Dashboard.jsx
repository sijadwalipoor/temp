import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, ComposedChart, Bar
} from 'recharts'
import TimeRangePicker from '../components/TimeRangePicker'
import MetricsCard from '../components/MetricsCard'
import FilterBar from '../components/FilterBar'
import Paginator from '../components/Paginator'
import { generateMockDashboardData, generateMockStatements, generateKPIs } from '../services/mockDataService'
import { CpuIcon, TimerIcon, GetPagesIcon, RefreshIcon } from '../utils/icons'

export default function Dashboard() {
  const navigate = useNavigate()
  const [timeRange, setTimeRange] = useState('24h')
  const [chartData, setChartData] = useState([])
  const [statements, setStatements] = useState([])
  const [kpis, setKpis] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [filteredStatements, setFilteredStatements] = useState([])
  const itemsPerPage = 50

  useEffect(() => {
    // Generate mock data
    const data = generateMockDashboardData()
    setChartData(data)
    
    const statementsData = generateMockStatements(500)
    setStatements(statementsData)
    setFilteredStatements(statementsData)
    
    setKpis(generateKPIs())
  }, [timeRange])

  const handleTimeRangeChange = (range) => {
    setTimeRange(range)
    setCurrentPage(1)
  }

  const handleFilterChange = ({ search, sort }) => {
    let filtered = statements

    // Search filter
    if (search) {
      filtered = filtered.filter(stmt =>
        stmt.sqlText.toLowerCase().includes(search.toLowerCase()) ||
        stmt.program.toLowerCase().includes(search.toLowerCase())
      )
    }

    // Sort options
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

  if (!kpis) return <div className="p-6">Loading...</div>

  return (
    <div className="p-8 space-y-8 bg-light min-h-screen">
      {/* Header Section */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">System Overview</h2>
          <p className="text-gray-600 text-sm mt-1">Real-time performance metrics and analysis</p>
        </div>
        <button className="flex items-center space-x-2 px-4 py-2 bg-primary text-white rounded hover:bg-primaryDark transition-colors font-medium text-sm">
          <RefreshIcon size={18} />
          <span>Refresh</span>
        </button>
      </div>

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

      {/* Time Range Picker */}
      <TimeRangePicker onRangeChange={handleTimeRangeChange} defaultRange={timeRange} />

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* CPU & Elapsed Trend */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow">
          <h3 className="text-lg font-semibold text-gray-900 mb-1">CPU & Elapsed Time Trend</h3>
          <p className="text-xs text-gray-500 mb-4">Performance metrics over time</p>
          <ResponsiveContainer width="100%" height={300}>
            <ComposedChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="time" stroke="#9ca3af" />
              <YAxis yAxisId="left" stroke="#9ca3af" />
              <YAxis yAxisId="right" orientation="right" stroke="#9ca3af" />
              <Tooltip 
                contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
              />
              <Legend />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="cpu"
                stroke="#da1e28"
                strokeWidth={2}
                name="CPU (ms)"
                dot={false}
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="elapsed"
                stroke="#0043ce"
                strokeWidth={2}
                name="Elapsed (ms)"
                dot={false}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* Get Pages & SQL Calls */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow">
          <h3 className="text-lg font-semibold text-gray-900 mb-1">Get Pages & SQL Calls</h3>
          <p className="text-xs text-gray-500 mb-4">Database access patterns</p>
          <ResponsiveContainer width="100%" height={300}>
            <ComposedChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="time" stroke="#9ca3af" />
              <YAxis yAxisId="left" stroke="#9ca3af" />
              <YAxis yAxisId="right" orientation="right" stroke="#9ca3af" />
              <Tooltip 
                contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
              />
              <Legend />
              <Bar
                yAxisId="left"
                dataKey="getPages"
                fill="#8b5cf6"
                name="Get Pages"
                radius={[4, 4, 0, 0]}
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="sqlCalls"
                stroke="#f59e0b"
                strokeWidth={2}
                name="SQL Calls"
                dot={false}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Filter & Statements Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
        <div className="p-6 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Worst Performing Statements</h3>
              <p className="text-xs text-gray-500 mt-1">Click to analyze individual statements</p>
            </div>
            <span className="text-sm font-medium text-gray-600 bg-white px-3 py-1 rounded border border-gray-300">
              {filteredStatements.length} statements
            </span>
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
                <th className="px-6 py-4 text-left font-semibold text-gray-700 uppercase text-xs tracking-wide">Program</th>
                <th className="px-6 py-4 text-left font-semibold text-gray-700 uppercase text-xs tracking-wide">SQL Text</th>
                <th className="px-6 py-4 text-left font-semibold text-gray-700 uppercase text-xs tracking-wide">Exec Count</th>
                <th className="px-6 py-4 text-right font-semibold text-gray-700 uppercase text-xs tracking-wide">CPU (ms)</th>
                <th className="px-6 py-4 text-right font-semibold text-gray-700 uppercase text-xs tracking-wide">Elapsed (ms)</th>
                <th className="px-6 py-4 text-right font-semibold text-gray-700 uppercase text-xs tracking-wide">Get Pages</th>
                <th className="px-6 py-4 text-center font-semibold text-gray-700 uppercase text-xs tracking-wide">Action</th>
              </tr>
            </thead>
            <tbody>
              {paginatedStatements.map((stmt, idx) => (
                <tr key={stmt.id} className={`border-b border-gray-100 hover:bg-blue-50 transition-colors ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                  <td className="px-6 py-4 font-medium text-gray-900">{stmt.program}</td>
                  <td className="px-6 py-4 text-gray-600 max-w-xs truncate" title={stmt.sqlText}>{stmt.sqlText}</td>
                  <td className="px-6 py-4 text-gray-600">{stmt.executionCount.toLocaleString()}</td>
                  <td className="px-6 py-4 text-right text-gray-900 font-medium">{stmt.totalCpu.toLocaleString()}</td>
                  <td className="px-6 py-4 text-right text-gray-900 font-medium">{stmt.totalElapsed.toLocaleString()}</td>
                  <td className="px-6 py-4 text-right">
                    <span className="font-semibold text-danger">{stmt.totalGetPages.toLocaleString()}</span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <button
                      onClick={() => navigate(`/statement/${stmt.id}`, { state: { statement: stmt } })}
                      className="px-3 py-2 bg-primary text-white rounded font-medium text-xs hover:bg-primaryDark transition-colors"
                    >
                      Analyze
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
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
