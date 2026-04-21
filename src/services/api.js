import axios from 'axios'

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080/api'

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30_000,
  headers: { 'Content-Type': 'application/json' },
})

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const envelope = error.response?.data
    if (envelope?.error?.message) {
      error.message = envelope.error.message
    }
    return Promise.reject(error)
  },
)

/**
 * Every backend endpoint returns ApiResponse<T> = { data, meta, error }.
 * These helpers unwrap that envelope so pages stay unaware of the shape.
 */
const unwrap = (response) => response.data?.data
const unwrapWithMeta = (response) => ({
  data: response.data?.data,
  meta: response.data?.meta,
})

export const healthAPI = {
  ping: () => apiClient.get('/health').then(unwrap),
}

export const dashboardAPI = {
  getKpis: ({ from, to }) =>
    apiClient.get('/dashboard/kpis', { params: { from, to } }).then(unwrap),

  getMetricsTrend: ({ from, to }) =>
    apiClient.get('/dashboard/metrics-trend', { params: { from, to } }).then(unwrap),

  getWorstPackages: ({ from, to, pageNumber = 1, pageSize = 25, sortBy = 'DB2_CPU' } = {}) =>
    apiClient
      .get('/dashboard/worst-packages', { params: { from, to, pageNumber, pageSize, sortBy } })
      .then(unwrapWithMeta),
}

export const packageAPI = {
  listPackages: ({ topN = 150, showBinds = false, showSqlStatements = false } = {}) =>
    apiClient
      .get('/packages', { params: { topN, showBinds, showSqlStatements } })
      .then(unwrap),

  searchPackages: ({ q, limit = 50 } = {}) =>
    apiClient.get('/packages/search', { params: { q, limit } }).then(unwrap),

  getPackageDetails: (packageName, { showBinds = true, showSqlStatements = false } = {}) =>
    apiClient
      .get(`/packages/${encodeURIComponent(packageName)}`, {
        params: { showBinds, showSqlStatements },
      })
      .then(unwrap),

  getBindsByPackage: (packageName) =>
    apiClient.get(`/packages/${encodeURIComponent(packageName)}/binds`).then(unwrap),

  getStatementsByBind: (packageName, conToken) =>
    apiClient
      .get(
        `/packages/${encodeURIComponent(packageName)}/binds/${encodeURIComponent(conToken)}/statements`,
      )
      .then(unwrap),

  getMetricsTrend: (packageName, { from, to } = {}) =>
    apiClient
      .get(`/packages/${encodeURIComponent(packageName)}/metrics-trend`, { params: { from, to } })
      .then(unwrap),
}

export default apiClient
