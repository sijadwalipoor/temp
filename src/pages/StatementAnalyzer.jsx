import { useState, useEffect } from 'react'
import { useParams, useLocation, useNavigate } from 'react-router-dom'
import {
  Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, ComposedChart, Bar
} from 'recharts'
import { generateMockDashboardData, generateMockTableStatistics } from '../services/mockDataService'
import { WarningIcon, ChevronDownIcon, ChevronRightIcon, ArrowLeftIcon, ArrowRightIcon } from '../utils/icons'

export default function StatementAnalyzer() {
  const { statementId } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const statement = location.state?.statement
  const [trendData, setTrendData] = useState([])
  const [tableStats, setTableStats] = useState([])
  const [expandedTables, setExpandedTables] = useState({})

  useEffect(() => {
    setTrendData(generateMockDashboardData())
    setTableStats(generateMockTableStatistics())
  }, [statementId])

  if (!statement) {
    return (
      <div className="p-6 text-center">
        <p className="text-gray-600 mb-4">No statement data available</p>
        <button
          onClick={() => navigate('/')}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          ← Back to Dashboard
        </button>
      </div>
    )
  }

  const toggleTableExpand = (tableName) => {
    setExpandedTables(prev => ({
      ...prev,
      [tableName]: !prev[tableName]
    }))
  }

  const statsWarningDays = (statsTime) => {
    const days = Math.floor(
      (Date.now() - new Date(statsTime).getTime()) / (1000 * 60 * 60 * 24)
    )
    return days
  }

  return (
    <div className="p-6 space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center space-x-2 text-sm text-gray-600">
        <button
          onClick={() => navigate('/')}
          className="hover:text-blue-600"
        >
          Dashboard
        </button>
        <span>/</span>
        <span className="text-gray-900 font-medium">Statement {statementId}</span>
      </div>

      {/* SQL Text */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">SQL Statement</h3>
        <div className="bg-gray-50 p-4 rounded-md border border-gray-200 font-mono text-sm overflow-x-auto">
          <pre>{statement.sqlText}</pre>
        </div>
      </div>

      {/* Metadata */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-xs font-medium text-gray-600">Program</p>
          <p className="text-lg font-bold text-gray-900">{statement.program}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-xs font-medium text-gray-600">Collection</p>
          <p className="text-lg font-bold text-gray-900">{statement.collection}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-xs font-medium text-gray-600">TEXT_TOKEN</p>
          <p className="text-lg font-bold text-gray-900 font-mono">{statement.textToken}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-xs font-medium text-gray-600">CONTOKEN</p>
          <p className="text-lg font-bold text-gray-900 font-mono">{statement.contoken}</p>
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-sm font-medium text-gray-600 mb-4">Execution Count</h3>
          <p className="text-3xl font-bold text-gray-900">{statement.executionCount.toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-sm font-medium text-gray-600 mb-4">Avg CPU (ms)</h3>
          <p className="text-3xl font-bold text-red-600">{statement.avgCpu.toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-sm font-medium text-gray-600 mb-4">Avg Elapsed (ms)</h3>
          <p className="text-3xl font-bold text-blue-600">{statement.avgElapsed.toLocaleString()}</p>
        </div>
      </div>

      {/* Performance Trend */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Trend</h3>
        <ResponsiveContainer width="100%" height={300}>
          <ComposedChart data={trendData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="time" />
            <YAxis yAxisId="left" />
            <YAxis yAxisId="right" orientation="right" />
            <Tooltip />
            <Legend />
            <Bar
              yAxisId="left"
              dataKey="cpu"
              fill="#ef4444"
              name="CPU (ms)"
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="getPages"
              stroke="#8b5cf6"
              strokeWidth={2}
              name="Get Pages"
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Table Statistics */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Referenced Tables & Statistics</h3>
        </div>

        <div className="divide-y divide-gray-200">
          {tableStats.map((table) => {
            const daysOld = statsWarningDays(table.lastStatsTime)
            const isStale = daysOld > 30
            const isExpanded = expandedTables[table.tableName]

            return (
              <div key={table.tableId}>
                <div
                  onClick={() => toggleTableExpand(table.tableName)}
                  className="p-6 cursor-pointer hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="text-sm font-semibold text-gray-900">{table.tableName}</h4>
                      <p className="text-xs text-gray-600 mt-1">
                        Table ID: {table.tableId} | Cardinality: {table.cardinalityEstimate.toLocaleString()}
                      </p>
                      <p className="text-xs text-gray-600 mt-1">
                        Last Stats: {new Date(table.lastStatsTime).toLocaleDateString()} ({daysOld} days ago)
                      </p>
                    </div>
                    <div className="flex items-center space-x-3">
                      {isStale && (
                        <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded flex items-center space-x-1">
                          <WarningIcon size={14} />
                          <span>Stale Stats</span>
                        </span>
                      )}
                      <span className="text-gray-400">
                        {isExpanded ? <ChevronDownIcon size={16} /> : <ChevronRightIcon size={16} />}
                      </span>
                    </div>
                  </div>
                </div>

                {isExpanded && (
                  <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                    <h5 className="text-sm font-medium text-gray-900 mb-3">Columns</h5>
                    <div className="space-y-2">
                      {table.columns.map((col, idx) => (
                        <div key={idx} className="flex items-center space-x-2 text-xs">
                          <span className="font-mono bg-white px-2 py-1 rounded border border-gray-200">
                            {col.name}
                          </span>
                          <span className="text-gray-600">{col.type}</span>
                          {!col.nullable && (
                            <span className="text-red-600 font-medium">NOT NULL</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Action Links */}
      <div className="flex space-x-3">
        <button
          onClick={() => navigate('/access-path')}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium flex items-center space-x-2"
        >
          <span>View Access Path</span>
          <ArrowRightIcon size={16} />
        </button>
        <button
          onClick={() => navigate('/')}
          className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 font-medium flex items-center space-x-2"
        >
          <ArrowLeftIcon size={16} />
          <span>Back to Dashboard</span>
        </button>
      </div>
    </div>
  )
}
