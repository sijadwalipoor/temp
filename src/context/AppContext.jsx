import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'

const SIDEBAR_STORAGE_KEY = 'db2perf.sidebarCollapsed'

const readStoredBool = (key) => {
  try {
    return localStorage.getItem(key) === 'true'
  } catch {
    return false
  }
}

export const AppContext = createContext(null)

export const AppProvider = ({ children }) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => readStoredBool(SIDEBAR_STORAGE_KEY))

  useEffect(() => {
    localStorage.setItem(SIDEBAR_STORAGE_KEY, String(sidebarCollapsed))
  }, [sidebarCollapsed])

  const toggleSidebar = useCallback(() => setSidebarCollapsed((prev) => !prev), [])

  const value = useMemo(
    () => ({ sidebarCollapsed, toggleSidebar }),
    [sidebarCollapsed, toggleSidebar],
  )

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export const useAppContext = () => {
  const context = useContext(AppContext)
  if (!context) {
    throw new Error('useAppContext must be used within AppProvider')
  }
  return context
}
