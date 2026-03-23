import { createContext, useContext, useState } from 'react'

const AppContext = createContext()

export const AppProvider = ({ children }) => {
  const [settings, setSettings] = useState({
    subsystem: 'DB2',
    collection: 'XDB2I',
    defaultTimeRange: '24h',
    statsWarningThreshold: 30,
    itemsPerPage: 50,
  })

  const [filters, setFilters] = useState({
    search: '',
    sortBy: 'getPages',
    timeRange: '24h',
  })

  const [user, setUser] = useState({
    name: 'DBA User',
    role: 'admin',
    authenticated: true,
  })

  const updateSettings = (newSettings) => {
    setSettings(prev => ({
      ...prev,
      ...newSettings
    }))
  }

  const updateFilters = (newFilters) => {
    setFilters(prev => ({
      ...prev,
      ...newFilters
    }))
  }

  const value = {
    settings,
    updateSettings,
    filters,
    updateFilters,
    user,
    setUser,
  }

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  )
}

export const useAppContext = () => {
  const context = useContext(AppContext)
  if (!context) {
    throw new Error('useAppContext must be used within AppProvider')
  }
  return context
}
