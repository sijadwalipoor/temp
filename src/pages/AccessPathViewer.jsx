import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import TimeRangePicker from '../components/TimeRangePicker'
import StatusBanner from '../components/StatusBanner'
import { explainAPI } from '../services/api'
import { CheckIcon, WarningIcon, ArrowDownIcon, ArrowUpIcon, ArrowLeftIcon } from '../utils/icons'
import { getIntervalFromNow } from '../utils/timeInterval'

const EMPTY_PLAN = {
  statementId: null,
  accessMethod: 'N/A',
  indexName: null,
  estimatedRows: 0,
  estimatedCost: 0,
  filterFactor: 0,
  plansteps: [],
}

export default function AccessPathViewer() {
  const navigate = useNavigate()
  const [explainData, setExplainData] = useState({ current: EMPTY_PLAN, previous: EMPTY_PLAN })
  const [statementOptions, setStatementOptions] = useState([])
  const [selectedStatement, setSelectedStatement] = useState('')
  const [interval, setInterval] = useState(getIntervalFromNow({ hours: 24 }))
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const loadStatementOptions = async () => {
      setLoading(true)
      setError('')

      try {
        const statementsRes = await explainAPI.listStatements({ ...interval, page: 1, pageSize: 200 })
        const statementsPayload =
          statementsRes.data?.items ??
          statementsRes.data?.data?.items ??
          statementsRes.data?.data ??
          statementsRes.data ??
          []

        const options = Array.isArray(statementsPayload)
          ? statementsPayload.map((stmt, idx) => ({
              id: stmt.id ?? stmt.statementId ?? idx + 1,
              label: stmt.sqlText ?? stmt.text ?? `Statement ${idx + 1}`,
              contoken: stmt.contoken ?? stmt.conToken,
            }))
          : []

        setStatementOptions(options)

        if (options.length > 0 && !selectedStatement) {
          setSelectedStatement(String(options[0].id))
        }
      } catch (err) {
        setError(err?.response?.data?.message || 'Failed to load statements for explain analysis')
      } finally {
        setLoading(false)
      }
    }

    loadStatementOptions()
  }, [interval, selectedStatement])

  useEffect(() => {
    if (!selectedStatement) return

    const loadExplainData = async () => {
      setLoading(true)
      setError('')

      try {
        const selected = statementOptions.find((stmt) => String(stmt.id) === String(selectedStatement))
        const [currentRes, previousRes] = await Promise.all([
          explainAPI.getCurrentExplain({
            statementId: selectedStatement,
            contoken: selected?.contoken,
            ...interval,
          }),
          explainAPI.getPreviousExplain({ statementId: selectedStatement, ...interval }),
        ])

        const current = currentRes.data?.data ?? currentRes.data ?? null
        const previous = previousRes.data?.data ?? previousRes.data ?? null

        setExplainData({ current, previous })
      } catch (err) {
        setError(err?.response?.data?.message || 'Failed to load explain plans')
        setExplainData({ current: EMPTY_PLAN, previous: EMPTY_PLAN })
      } finally {
        setLoading(false)
      }
    }

    loadExplainData()
  }, [selectedStatement, interval, statementOptions])

  const handleIntervalChange = ({ from, to }) => {
    setInterval({ from, to })
  }

  const { current, previous } = explainData

  const previousCost = Number(previous.estimatedCost ?? 0)
  const currentCost = Number(current.estimatedCost ?? 0)
  const costImprovement = previousCost > 0
    ? (((previousCost - currentCost) / previousCost) * 100).toFixed(1)
    : '0.0'

  return (
    <div className="p-6 space-y-6">
      {loading && <StatusBanner type="info" message="Loading access path analysis..." />}
      <StatusBanner type="error" message={error} />

      <TimeRangePicker onRangeChange={handleIntervalChange} defaultInterval={interval} />

      {/* Breadcrumb */}
      <div className="flex items-center space-x-2 text-sm text-gray-600">
        <button
          onClick={() => navigate('/')}
          className="hover:text-blue-600"
        >
          Dashboard
        </button>
        <span>/</span>
        <span className="text-gray-900 font-medium">Access Path Analysis</span>
      </div>

      {/* Statement Selector */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Select Statement:
        </label>
        <select
          value={selectedStatement}
          onChange={(e) => setSelectedStatement(e.target.value)}
          className="w-full max-w-md px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {statementOptions.length === 0 && (
            <option value="" disabled>
              No statements available
            </option>
          )}
          {statementOptions.map((stmt) => (
            <option key={stmt.id} value={stmt.id}>
              Statement {stmt.id} - {stmt.label.slice(0, 60)}
            </option>
          ))}
        </select>
      </div>

      {/* Cost Comparison Header */}
      {costImprovement > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-green-800">
          <div className="flex items-center space-x-2">
            <CheckIcon size={20} />
            <div>
              <h3 className="font-semibold">Current Plan is Better</h3>
              <p className="text-sm mt-1">
                Estimated cost improvement: <span className="font-bold">{costImprovement}%</span>
              </p>
            </div>
          </div>
        </div>
      )}
      {costImprovement < 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
          <div className="flex items-center space-x-2">
            <WarningIcon size={20} />
            <div>
              <h3 className="font-semibold">Previous Plan Was Better</h3>
              <p className="text-sm mt-1">
                Current plan is <span className="font-bold">{Math.abs(costImprovement)}%</span> more expensive
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Current Explain Plan */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="bg-blue-50 border-b border-gray-200 px-6 py-4">
            <h3 className="text-lg font-semibold text-gray-900">Current Explain Plan</h3>
            <p className="text-sm text-gray-600 mt-1">Most Recent Bind</p>
          </div>

          <div className="p-6 space-y-4">
            {/* Summary */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 p-3 rounded-md">
                <p className="text-xs font-medium text-gray-600">Access Method</p>
                <p className="text-sm font-bold text-gray-900">{current.accessMethod}</p>
              </div>
              <div className="bg-gray-50 p-3 rounded-md">
                <p className="text-xs font-medium text-gray-600">Estimated Cost</p>
                <p className="text-sm font-bold text-blue-600">{current.estimatedCost}</p>
              </div>
              <div className="bg-gray-50 p-3 rounded-md">
                <p className="text-xs font-medium text-gray-600">Index Used</p>
                <p className="text-sm font-bold text-gray-900">
                  {current.indexName || 'N/A'}
                </p>
              </div>
              <div className="bg-gray-50 p-3 rounded-md">
                <p className="text-xs font-medium text-gray-600">Est. Rows</p>
                <p className="text-sm font-bold text-gray-900">
                  {current.estimatedRows.toLocaleString()}
                </p>
              </div>
            </div>

            {/* Plan Steps */}
            <div className="border-t border-gray-200 pt-4">
              <h4 className="text-sm font-semibold text-gray-900 mb-3">Plan Steps</h4>
              <div className="space-y-2">
                {current.plansteps.map((step) => (
                  <div
                    key={step.step}
                    className="p-3 bg-gray-50 rounded-md"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          Step {step.step}: {step.method}
                        </p>
                        {step.object && (
                          <p className="text-xs text-gray-600 mt-1">Object: {step.object}</p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-600">Cost: {step.cost}</p>
                      </div>
                    </div>
                  </div>
                ))}
                {current.plansteps.length === 0 && (
                  <div className="text-sm text-gray-500">No current plan steps available.</div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Previous Explain Plan */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="bg-amber-50 border-b border-gray-200 px-6 py-4">
            <h3 className="text-lg font-semibold text-gray-900">Previous Explain Plan</h3>
            <p className="text-sm text-gray-600 mt-1">Previous Bind</p>
          </div>

          <div className="p-6 space-y-4">
            {/* Summary */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 p-3 rounded-md">
                <p className="text-xs font-medium text-gray-600">Access Method</p>
                <p className="text-sm font-bold text-gray-900">{previous.accessMethod}</p>
              </div>
              <div className="bg-gray-50 p-3 rounded-md">
                <p className="text-xs font-medium text-gray-600">Estimated Cost</p>
                <p className="text-sm font-bold text-red-600">{previous.estimatedCost}</p>
              </div>
              <div className="bg-gray-50 p-3 rounded-md">
                <p className="text-xs font-medium text-gray-600">Index Used</p>
                <p className="text-sm font-bold text-gray-900">
                  {previous.indexName || 'N/A'}
                </p>
              </div>
              <div className="bg-gray-50 p-3 rounded-md">
                <p className="text-xs font-medium text-gray-600">Est. Rows</p>
                <p className="text-sm font-bold text-gray-900">
                  {previous.estimatedRows.toLocaleString()}
                </p>
              </div>
            </div>

            {/* Plan Steps */}
            <div className="border-t border-gray-200 pt-4">
              <h4 className="text-sm font-semibold text-gray-900 mb-3">Plan Steps</h4>
              <div className="space-y-2">
                {previous.plansteps.map((step) => (
                  <div
                    key={step.step}
                    className="p-3 bg-gray-50 rounded-md"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          Step {step.step}: {step.method}
                        </p>
                        {step.object && (
                          <p className="text-xs text-gray-600 mt-1">Object: {step.object}</p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-600">Cost: {step.cost}</p>
                      </div>
                    </div>
                  </div>
                ))}
                {previous.plansteps.length === 0 && (
                  <div className="text-sm text-gray-500">No previous plan steps available.</div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Comparison */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Detailed Comparison</h3>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Metric</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Current</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Previous</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Change</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-gray-200">
                <td className="px-4 py-3 font-medium text-gray-900">Access Method</td>
                <td className="px-4 py-3 text-gray-600">{current.accessMethod}</td>
                <td className="px-4 py-3 text-gray-600">{previous.accessMethod}</td>
                <td className="px-4 py-3">
                  {current.accessMethod !== previous.accessMethod && (
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium flex items-center space-x-1 w-fit">
                      <span>◆</span>
                      <span>Changed</span>
                    </span>
                  )}
                </td>
              </tr>
              <tr className="border-b border-gray-200 bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-900">Estimated Cost</td>
                <td className="px-4 py-3 text-blue-600 font-bold">{current.estimatedCost}</td>
                <td className="px-4 py-3 text-red-600 font-bold">{previous.estimatedCost}</td>
                <td className="px-4 py-3">
                  <span className={`font-bold flex items-center space-x-1 ${costImprovement > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {costImprovement > 0 ? <ArrowDownIcon size={16} /> : <ArrowUpIcon size={16} />}
                    <span>{Math.abs(costImprovement)}%</span>
                  </span>
                </td>
              </tr>
              <tr className="border-b border-gray-200">
                <td className="px-4 py-3 font-medium text-gray-900">Est. Rows</td>
                <td className="px-4 py-3 text-gray-600">{current.estimatedRows.toLocaleString()}</td>
                <td className="px-4 py-3 text-gray-600">{previous.estimatedRows.toLocaleString()}</td>
                <td className="px-4 py-3">No change</td>
              </tr>
              <tr className="border-b border-gray-200 bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-900">Filter Factor</td>
                <td className="px-4 py-3 text-gray-600">{current.filterFactor.toFixed(4)}</td>
                <td className="px-4 py-3 text-gray-600">{previous.filterFactor.toFixed(4)}</td>
                <td className="px-4 py-3">No change</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Recommendations */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-3">Recommendations</h3>
        <ul className="space-y-2 text-sm text-blue-800">
          <li className="flex items-center space-x-2">
            <CheckIcon size={16} />
            <span>Current plan is performing better with {costImprovement}% cost reduction</span>
          </li>
          <li className="flex items-center space-x-2">
            <CheckIcon size={16} />
            <span>Index {current.indexName} is properly utilized</span>
          </li>
          <li className="flex items-center space-x-2">
            <CheckIcon size={16} />
            <span>No sorting required in the current plan</span>
          </li>
          <li className="flex items-center space-x-2">
            <WarningIcon size={16} className="text-blue-600" />
            <span>Consider testing with dynamic explain on a larger dataset</span>
          </li>
        </ul>
      </div>

      {/* Action Links */}
      <div className="flex space-x-3">
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
