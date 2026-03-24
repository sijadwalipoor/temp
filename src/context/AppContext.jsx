import { createContext, useContext, useState, useEffect } from 'react'
import { getCookie, setCookie } from '../utils/cookies'

export const AppContext = createContext()

const defaultSettings = {
  subsystem: 'DB2',
  collection: 'XDB2I',
  defaultTimeRange: '24h',
  statsWarningThreshold: 30,
  itemsPerPage: 50,
}

const defaultFilters = {
  search: '',
  sortBy: 'getPages',
  timeRange: '24h',
}

const defaultUser = {
  name: 'DBA User',
  role: 'admin',
  authenticated: true,
}

export const AppProvider = ({ children }) => {
  // Initialize state from cookies or use defaults
  const [settings, setSettings] = useState(() => getCookie('appSettings') || defaultSettings)
  const [filters, setFilters] = useState(() => getCookie('appFilters') || defaultFilters)
  const [user, setUser] = useState(() => getCookie('appUser') || defaultUser)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => getCookie('sidebarCollapsed') || false)

  // Save settings to cookie whenever they change
  useEffect(() => {
    setCookie('appSettings', settings)
  }, [settings])

  // Save filters to cookie whenever they change
  useEffect(() => {
    setCookie('appFilters', filters)
  }, [filters])

  // Save user to cookie whenever they change
  useEffect(() => {
    setCookie('appUser', user)
  }, [user])

  // Save sidebar state to cookie whenever it changes
  useEffect(() => {
    setCookie('sidebarCollapsed', sidebarCollapsed)
  }, [sidebarCollapsed])

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

  const toggleSidebar = () => {
    setSidebarCollapsed(prev => !prev)
  }

  const value = {
    settings,
    updateSettings,
    filters,
    updateFilters,
    user,
    setUser,
    sidebarCollapsed,
    toggleSidebar,
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
