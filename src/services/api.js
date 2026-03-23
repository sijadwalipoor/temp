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
  getKPIs: (subsystem = 'DB2', collection = 'XDB2I', timeRange = '24h') => {
    return apiClient.get('/dashboard/kpis', {
      params: { subsystem, collection, timeRange }
    })
  },

  getMetricsTrend: (subsystem = 'DB2', collection = 'XDB2I', timeRange = '24h') => {
    return apiClient.get('/dashboard/metrics-trend', {
      params: { subsystem, collection, timeRange }
    })
  },

  getWorstStatements: (
    subsystem = 'DB2',
    collection = 'XDB2I',
    page = 1,
    pageSize = 50,
    sortBy = 'getPages'
  ) => {
    return apiClient.get('/dashboard/worst-statements', {
      params: { subsystem, collection, page, pageSize, sortBy }
    })
  },

  searchStatements: (query, subsystem = 'DB2', collection = 'XDB2I') => {
    return apiClient.get('/dashboard/search-statements', {
      params: { query, subsystem, collection }
    })
  },
}

// API Endpoints for Package Analyzer
export const packageAPI = {
  getPackage: (packageId, subsystem = 'DB2', collection = 'XDB2I') => {
    return apiClient.get(`/packages/${packageId}`, {
      params: { subsystem, collection }
    })
  },

  listPackages: (subsystem = 'DB2', collection = 'XDB2I', page = 1, pageSize = 50) => {
    return apiClient.get('/packages', {
      params: { subsystem, collection, page, pageSize }
    })
  },

  getPackagePerformanceTrend: (packageId, timeRange = '24h') => {
    return apiClient.get(`/packages/${packageId}/trend`, {
      params: { timeRange }
    })
  },

  getBindingHistory: (packageId, subsystem = 'DB2', collection = 'XDB2I') => {
    return apiClient.get(`/packages/${packageId}/bindings`, {
      params: { subsystem, collection }
    })
  },

  getPackageStatements: (
    packageId,
    page = 1,
    pageSize = 50,
    sortBy = 'getPages'
  ) => {
    return apiClient.get(`/packages/${packageId}/statements`, {
      params: { page, pageSize, sortBy }
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

  getStatementMetrics: (statementId, timeRange = '24h') => {
    return apiClient.get(`/statements/${statementId}/metrics`, {
      params: { timeRange }
    })
  },

  getStatementTrend: (statementId, timeRange = '24h') => {
    return apiClient.get(`/statements/${statementId}/trend`, {
      params: { timeRange }
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
  getCurrentExplain: (statementId, contoken) => {
    return apiClient.get(`/explain/current`, {
      params: { statementId, contoken }
    })
  },

  getPreviousExplain: (statementId) => {
    return apiClient.get(`/explain/previous`, {
      params: { statementId }
    })
  },

  runDynamicExplain: (sqlText, options = {}) => {
    return apiClient.post('/explain/dynamic', {
      sqlText,
      ...options
    })
  },

  compareExplainPlans: (currentId, previousId) => {
    return apiClient.get('/explain/compare', {
      params: { currentId, previousId }
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

  getAvailableCollections: (subsystem = 'DB2') => {
    return apiClient.get('/config/collections', {
      params: { subsystem }
    })
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
