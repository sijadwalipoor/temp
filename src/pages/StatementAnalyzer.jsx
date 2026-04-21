import { useLocation, useNavigate } from 'react-router-dom'
import StatusBanner from '../components/StatusBanner'
import { ArrowLeftIcon } from '../utils/icons'

export default function StatementAnalyzer() {
  const location = useLocation()
  const navigate = useNavigate()
  const statement = location.state?.statement

  if (!statement) {
    return (
      <div className="p-6 space-y-6">
        <StatusBanner
          type="error"
          message="No statement details provided. Open a statement from the Package Viewer."
        />
        <button
          onClick={() => navigate('/package-viewer')}
          className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 font-medium flex items-center space-x-2"
        >
          <ArrowLeftIcon size={16} />
          <span>Back to Package Viewer</span>
        </button>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center space-x-2 text-sm text-gray-600">
        <button onClick={() => navigate('/')} className="hover:text-blue-600">Dashboard</button>
        <span>/</span>
        <button onClick={() => navigate('/package-viewer')} className="hover:text-blue-600">Package Viewer</button>
        <span>/</span>
        <span className="text-gray-900 font-medium">Statement {statement.statementNumber ?? ''}</span>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">SQL Statement</h3>
        <div className="bg-gray-50 p-4 rounded-md border border-gray-200 font-mono text-sm overflow-x-auto">
          <pre className="whitespace-pre-wrap">{statement.sqlText || '—'}</pre>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Meta label="Program" value={statement.program || '—'} />
        <Meta label="Collection" value={statement.collection || '—'} />
        <Meta label="CONTOKEN" value={statement.conToken || '—'} mono />
        <Meta label="TEXT_TOKEN" value={statement.textToken || '—'} mono />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Meta label="Statement #" value={statement.statementNumber ?? '—'} />
        <Meta label="Sequence #" value={statement.seqNumber ?? '—'} />
        <Meta label="Executions" value={(statement.executionCount ?? 0).toLocaleString()} />
        <Meta label="Get Pages" value={(statement.totalGetPages ?? 0).toLocaleString()} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Meta label="Total CPU (ms)" value={(statement.totalCpu ?? 0).toLocaleString()} accent="text-red-600" />
        <Meta label="Total Elapsed (ms)" value={(statement.totalElapsed ?? 0).toLocaleString()} accent="text-blue-600" />
      </div>

      <div className="flex space-x-3">
        <button
          onClick={() => navigate(-1)}
          className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 font-medium flex items-center space-x-2"
        >
          <ArrowLeftIcon size={16} />
          <span>Back</span>
        </button>
      </div>
    </div>
  )
}

function Meta({ label, value, mono = false, accent = 'text-gray-900' }) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <p className="text-xs font-medium text-gray-600">{label}</p>
      <p className={`text-lg font-bold ${accent} ${mono ? 'font-mono break-all' : ''}`}>{value}</p>
    </div>
  )
}
