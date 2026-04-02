export const EMPTY_KPIS = {
  totalCpu: 0,
  totalElapsed: 0,
  totalGetPages: 0,
  totalSqlCalls: 0,
}

export const METRIC_OPTIONS = [
  { key: 'getPages', label: 'Get Pages', unit: 'pages', color: '#8b5cf6', chartType: 'bar' },
  { key: 'cpu', label: 'CPU', unit: 'ms', color: '#da1e28', chartType: 'line' },
  { key: 'elapsed', label: 'Elapsed Time', unit: 'ms', color: '#0043ce', chartType: 'line' },
  { key: 'sqlCalls', label: 'SQL Calls', unit: 'calls', color: '#f59e0b', chartType: 'line' },
]

const toNumberOrZero = (value) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

export const getApiErrorMessage = (result, fallbackMessage) => {
  if (!result || result.status !== 'rejected') return ''
  return result.reason?.response?.data?.message || result.reason?.message || fallbackMessage
}

export const extractEnvelopeData = (payload) => {
  if (!payload || typeof payload !== 'object') return payload
  if ('data' in payload && payload.data !== undefined && payload.data !== null) {
    return payload.data
  }
  return payload
}

export const normalizeKpiPayload = (payload) => {
  const data = extractEnvelopeData(payload) || {}

  return {
    totalCpu: toNumberOrZero(data.totalCpu ?? data.totalCPU ?? data.total_cpu ?? data.cpu),
    totalElapsed: toNumberOrZero(data.totalElapsed ?? data.totalELAPSED ?? data.total_elapsed ?? data.elapsed),
    totalGetPages: toNumberOrZero(data.totalGetPages ?? data.totalGETPAGES ?? data.total_get_pages ?? data.getPages),
    totalSqlCalls: toNumberOrZero(data.totalSqlCalls ?? data.totalSQLCalls ?? data.total_sql_calls ?? data.sqlCalls),
  }
}

export const normalizeTrendPoint = (point, idx) => {
  const fallbackTime = new Date(Date.now() - (23 - idx) * 60 * 60 * 1000)
  const timestamp = point.timestamp || point.time || point.bucketTime || fallbackTime.toISOString()
  const time = point.time || new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

  return {
    ...point,
    time,
    timestamp,
    cpu: toNumberOrZero(point.cpu ?? point.totalCpu ?? point.db2Cpu),
    elapsed: toNumberOrZero(point.elapsed ?? point.totalElapsed ?? point.db2Elapsed),
    getPages: toNumberOrZero(point.getPages ?? point.totalGetPages),
    sqlCalls: toNumberOrZero(point.sqlCalls ?? point.totalSqlCalls),
  }
}

export const normalizePackage = (pkg, idx) => {
  const totalCpu = toNumberOrZero(pkg.db2Cpu ?? pkg.totalCpu ?? pkg.cpu)
  const totalSqlCalls = toNumberOrZero(pkg.sqlCalls ?? pkg.totalSqlCalls)
  const totalElapsed = toNumberOrZero(pkg.db2Elapsed ?? pkg.totalElapsed ?? pkg.elapsed)
  const totalGetPages = toNumberOrZero(pkg.getPages ?? pkg.totalGetPages)

  const fallbackId = `${pkg.collection || 'COLL'}:${pkg.program || 'PROG'}:${pkg.consistencyToken || idx + 1}`
  const defaultName = [pkg.collection, pkg.program].filter(Boolean).join('.') || `PACKAGE_${idx + 1}`

  return {
    ...pkg,
    id: String(pkg.id ?? pkg.packageId ?? fallbackId),
    name: pkg.name ?? pkg.packageName ?? defaultName,
    program: pkg.program ?? pkg.programName ?? 'N/A',
    totalCpu,
    totalSqlCalls,
    totalElapsed,
    totalGetPages,
    sqlCallsToCpuRatio: totalCpu > 0 ? (totalSqlCalls / totalCpu).toFixed(2) : '0.00',
  }
}
