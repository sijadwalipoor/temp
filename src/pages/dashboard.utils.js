export const EMPTY_KPIS = {
  totalCpu: 0,
  totalElapsed: 0,
  totalGetPages: 0,
  totalSqlCalls: 0,
}

export const METRIC_OPTIONS = [
  { key: 'getPages', label: 'Get Pages', unit: 'pages', color: '#8b5cf6', chartType: 'bar' },
  { key: 'cpu', label: 'CPU', unit: 'ms', color: '#da1e28', chartType: 'line' },
  { key: 'elapsed', label: 'Elapsed Time', unit: 'ms', color: '#cd3434', chartType: 'line' },
  { key: 'sqlCalls', label: 'SQL Calls', unit: 'calls', color: '#f59e0b', chartType: 'line' },
]

export const SORT_OPTIONS = [
  { value: 'DB2_CPU', label: 'CPU' },
  { value: 'DB2_ELAPSED', label: 'Elapsed' },
  { value: 'GETPAGES', label: 'Get Pages' },
  { value: 'SQL_CALLS', label: 'SQL Calls' },
]

const toNumber = (value) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

export const getErrorMessage = (error, fallback) =>
  error?.response?.data?.error?.message || error?.message || fallback

export const normalizeKpis = (kpi) => {
  if (!kpi) return EMPTY_KPIS
  return {
    totalCpu: toNumber(kpi.totalCpu),
    totalElapsed: toNumber(kpi.totalElapsed),
    totalGetPages: toNumber(kpi.totalGetPages),
    totalSqlCalls: toNumber(kpi.totalSqlCalls),
  }
}

const DAY_MS = 24 * 60 * 60 * 1000
const DAY_TICK_THRESHOLD_MS = DAY_MS

export const formatChartTick = (timestamp, spanMs) => {
  const date = new Date(timestamp)
  if (Number.isNaN(date.getTime())) return ''
  if (spanMs >= DAY_TICK_THRESHOLD_MS) {
    return date.toLocaleDateString([], { day: '2-digit', month: 'short' })
  }
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

export const formatChartTooltipLabel = (timestamp) => {
  const date = new Date(timestamp)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleString([], {
    day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
  })
}

export const formatAxisValue = (value) => {
  if (value == null || Number.isNaN(value)) return ''
  const abs = Math.abs(value)
  if (abs >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1)}B`
  if (abs >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`
  if (abs >= 1_000) return `${(value / 1_000).toFixed(0)}K`
  return `${value}`
}

export const normalizeTrendPoint = (point) => ({
  timestamp: new Date(point.timestamp).getTime(),
  cpu: toNumber(point.db2Cpu),
  elapsed: toNumber(point.db2Elapsed),
  getPages: toNumber(point.getPages),
  sqlCalls: toNumber(point.sqlCalls),
})

/**
 * A package is uniquely identified by (collection, program, consistency token).
 * The UI uses `packageKey` everywhere so favourites/reviewed survive refreshes.
 */
export const buildPackageKey = ({ collection, program, conToken }) =>
  [collection ?? '', program ?? '', conToken ?? ''].join('::')

export const normalizePackage = (pkg) => {
  const totalCpu = toNumber(pkg.db2Cpu)
  const totalElapsed = toNumber(pkg.db2Elapsed)
  const totalGetPages = toNumber(pkg.getPages)
  const totalSqlCalls = toNumber(pkg.sqlCalls)
  const callsPerCpuMs = totalCpu > 0 ? totalSqlCalls / totalCpu : 0

  return {
    collection: pkg.collection ?? '',
    program: pkg.program ?? '',
    conToken: pkg.conToken ?? '',
    packageKey: buildPackageKey(pkg),
    displayName: [pkg.collection, pkg.program].filter(Boolean).join('.') || pkg.program || '—',
    totalCpu,
    totalElapsed,
    totalGetPages,
    totalSqlCalls,
    callsPerCpuMs: Number(callsPerCpuMs.toFixed(2)),
  }
}

export const normalizeStatement = (stmt, idx) => ({
  id: `${stmt.conToken ?? 'CT'}-${stmt.statementNumber ?? idx}-${stmt.seqNumber ?? 0}`,
  collection: stmt.collection ?? '',
  program: stmt.program ?? '',
  conToken: stmt.conToken ?? '',
  statementNumber: stmt.statementNumber ?? null,
  seqNumber: stmt.seqNumber ?? null,
  sqlText: stmt.sqlText ?? '',
  textToken: stmt.textToken ?? '',
  totalCpu: toNumber(stmt.totalCpu),
  totalElapsed: toNumber(stmt.totalElapsed),
  totalGetPages: toNumber(stmt.totalGetPages),
  executionCount: toNumber(stmt.executionCount),
})

export const normalizeBind = (bind, idx) => ({
  id: bind.conToken ?? `bind-${idx}`,
  conToken: bind.conToken ?? '',
  bindTime: bind.bindTime ?? null,
  version: bind.version ?? '',
  isCurrent: idx === 0,
})
