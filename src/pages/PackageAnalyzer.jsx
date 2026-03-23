import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer
} from 'recharts'
import { generateMockPackageData } from '../services/mockDataService'
import FilterBar from '../components/FilterBar'
import Paginator from '../components/Paginator'
import { CheckIcon } from '../utils/icons'

export default function PackageAnalyzer() {
  const navigate = useNavigate()
  const [packageData, setPackageData] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [filteredStatements, setFilteredStatements] = useState([])
  const itemsPerPage = 50

  useEffect(() => {
    // Load initial package (demo: package 1)
    const pkg = generateMockPackageData(1)
    setPackageData(pkg)
    setFilteredStatements(pkg.statements)
  }, [])

  const handlePackageChange = (e) => {
    const packageId = parseInt(e.target.value)
    const pkg = generateMockPackageData(packageId)
    setPackageData(pkg)
    setFilteredStatements(pkg.statements)
    setCurrentPage(1)
  }

  const handleFilterChange = ({ search, sort }) => {
    if (!packageData) return

    let filtered = packageData.statements

    if (search) {
      filtered = filtered.filter(stmt =>
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

  if (!packageData) return <div className="p-6">Loading...</div>

  return (
    <div className="p-6 space-y-6">
      {/* Package Selector */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Select Package:
        </label>
        <select
          value={packageData.id}
          onChange={handlePackageChange}
          className="w-full max-w-md px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {Array.from({ length: 10 }, (_, i) => (
            <option key={i + 1} value={i + 1}>
              Package {i + 1} - {packageData.program}
            </option>
          ))}
        </select>
      </div>

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
