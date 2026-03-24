import axios from 'axios'

// Configure your backend URL here
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080/api'

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Add auth token if needed
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// API Endpoints for Dashboard
export const dashboardAPI = {
  getKPIs: ({ from, to }) => {
    return apiClient.get('/dashboard/kpis', {
      params: { from, to }
    })
  },

  getMetricsTrend: ({ from, to }) => {
    return apiClient.get('/dashboard/metrics-trend', {
      params: { from, to }
    })
  },

  getWorstPackages: ({ from, to, page = 1, pageSize = 50, sortBy = 'getPages' } = {}) => {
    return apiClient.get('/dashboard/worst-packages', {
      params: { from, to, page, pageSize, sortBy }
    })
  },

  getWorstStatements: ({ from, to, page = 1, pageSize = 50, sortBy = 'getPages' } = {}) => {
    return apiClient.get('/dashboard/worst-statements', {
      params: { from, to, page, pageSize, sortBy }
    })
  },

  searchStatements: ({ query, from, to, page = 1, pageSize = 50 } = {}) => {
    return apiClient.get('/dashboard/search-statements', {
      params: { query, from, to, page, pageSize }
    })
  },
}

// API Endpoints for Package Analyzer
export const packageAPI = {
  getPackage: (packageId) => {
    return apiClient.get(`/packages/${packageId}`)
  },

  listPackages: ({ page = 1, pageSize = 50, search = '' } = {}) => {
    return apiClient.get('/packages', {
      params: { page, pageSize, search }
    })
  },

  getPackagePerformanceTrend: (packageId, { from, to } = {}) => {
    return apiClient.get(`/packages/${packageId}/trend`, {
      params: { from, to }
    })
  },

  getBindingHistory: (packageId) => {
    return apiClient.get(`/packages/${packageId}/bindings`)
  },

  getPackageStatements: (
    packageId,
    { page = 1, pageSize = 50, sortBy = 'getPages', search = '', from, to } = {}
  ) => {
    return apiClient.get(`/packages/${packageId}/statements`, {
      params: { page, pageSize, sortBy, search, from, to }
    })
  },

  rebindPackage: (packageId, options = {}) => {
    return apiClient.post(`/packages/${packageId}/rebind`, options)
  },
}

// API Endpoints for Statement Analyzer
export const statementAPI = {
  getStatement: (statementId) => {
    return apiClient.get(`/statements/${statementId}`)
  },

  getStatementMetrics: (statementId, { from, to } = {}) => {
    return apiClient.get(`/statements/${statementId}/metrics`, {
      params: { from, to }
    })
  },

  getStatementTrend: (statementId, { from, to } = {}) => {
    return apiClient.get(`/statements/${statementId}/trend`, {
      params: { from, to }
    })
  },

  getReferencedTables: (statementId) => {
    return apiClient.get(`/statements/${statementId}/tables`)
  },

  getTableStatistics: (tableName) => {
    return apiClient.get(`/tables/${tableName}/statistics`)
  },
}

// API Endpoints for Access Path Viewer
export const explainAPI = {
  getCurrentExplain: ({ statementId, contoken, from, to }) => {
    return apiClient.get(`/explain/current`, {
      params: { statementId, contoken, from, to }
    })
  },

  getPreviousExplain: ({ statementId, from, to }) => {
    return apiClient.get(`/explain/previous`, {
      params: { statementId, from, to }
    })
  },

  listStatements: ({ from, to, page = 1, pageSize = 100 } = {}) => {
    return apiClient.get('/explain/statements', {
      params: { from, to, page, pageSize }
    })
  },

  runDynamicExplain: (sqlText, options = {}) => {
    return apiClient.post('/explain/dynamic', {
      sqlText,
      ...options
    })
  },

  compareExplainPlans: ({ currentId, previousId, statementId, from, to }) => {
    return apiClient.get('/explain/compare', {
      params: { currentId, previousId, statementId, from, to }
    })
  },
}

// API Endpoints for Settings/Configuration
export const configAPI = {
  getSettings: () => {
    return apiClient.get('/config/settings')
  },

  updateSettings: (settings) => {
    return apiClient.put('/config/settings', settings)
  },

  getAvailableCollections: () => {
    return apiClient.get('/config/collections')
  },

  getAvailableSubsystems: () => {
    return apiClient.get('/config/subsystems')
  },
}

// Health check
export const healthCheck = () => {
  return apiClient.get('/health')
}

export default apiClient
