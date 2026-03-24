import { Link, useLocation } from 'react-router-dom'
import { useContext, useState } from 'react'
import { DashboardIcon, PackageIcon, SearchIcon, SettingsIcon } from '../utils/icons'
import { AppContext } from '../context/AppContext'
import { ChevronLeft, ChevronRight } from 'lucide-react'

export default function Sidebar() {
  const location = useLocation()
  const { sidebarCollapsed, toggleSidebar } = useContext(AppContext)
  const [logoLoadError, setLogoLoadError] = useState(false)

  const menuItems = [
    { path: '/', label: 'Dashboard', icon: DashboardIcon },
    { path: '/package-analyzer', label: 'Package Analyzer', icon: PackageIcon },
    { path: '/access-path', label: 'Access Path Viewer', icon: SearchIcon },
    { path: '/settings', label: 'Settings', icon: SettingsIcon },
  ]

  const isActive = (path) => location.pathname === path

  return (
    <aside className={`${sidebarCollapsed ? 'w-20' : 'w-64'} bg-gray-900 text-white h-screen flex flex-col overflow-y-auto shadow-lg transition-all duration-300`}>
      {/* Logo / Header */}
      <div className="p-4 border-b border-gray-800 bg-gradient-to-r from-gray-900 to-gray-800 flex items-center justify-between">
        <div className={`flex items-center space-x-2 ${sidebarCollapsed ? 'hidden' : ''}`}>
          <div className="h-10 flex items-center">
            {!logoLoadError ? (
              <img
                src="/logo.png"
                alt="Company logo"
                className="h-full w-auto object-contain"
                onError={() => setLogoLoadError(true)}
              />
            ) : (
              <div className="w-8 h-8 bg-primary rounded flex items-center justify-center">
                <span className="text-white font-bold text-sm">DB</span>
              </div>
            )}
          </div>
        </div>
        <button
          onClick={toggleSidebar}
          className="p-1 hover:bg-gray-800 rounded transition-colors"
          aria-label="Toggle sidebar"
        >
          {sidebarCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
        </button>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 px-3 py-6 space-y-1">
        {!sidebarCollapsed && <p className="text-xs font-semibold text-gray-500 uppercase px-3 mb-4">Menu</p>}
        <ul className="space-y-1">
          {menuItems.map((item) => {
            const IconComp = item.icon
            return (
              <li key={item.path} title={sidebarCollapsed ? item.label : ''}>
                <Link
                  to={item.path}
                  className={`flex items-center ${sidebarCollapsed ? 'justify-center' : 'justify-start'} space-x-3 px-4 py-3 rounded transition-all duration-200 ${
                    isActive(item.path)
                      ? 'bg-primary text-white font-medium shadow-md'
                      : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                  }`}
                >
                  <IconComp size={20} strokeWidth={1.5} />
                  {!sidebarCollapsed && <span className="text-sm font-medium">{item.label}</span>}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-gray-800 bg-gray-950">
        {!sidebarCollapsed && (
          <div className="text-xs text-gray-500 space-y-2">
            <p>DB2 Performance Viz</p>
            <p className="text-gray-600">v1.0.0</p>
          </div>
        )}
      </div>
    </aside>
  )
}
