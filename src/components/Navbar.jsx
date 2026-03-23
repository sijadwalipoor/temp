import { useLocation } from 'react-router-dom'
import { LogoutIcon, UserIcon } from '../utils/icons'

export default function Navbar() {
  const location = useLocation()
  
  const getPageTitle = () => {
    const titles = {
      '/': 'Dashboard',
      '/package-analyzer': 'Package Analyzer',
      '/statement': 'Statement Analysis',
      '/access-path': 'Access Path Viewer',
      '/settings': 'Settings',
    }
    return titles[location.pathname] || 'DB2 Performance Analyzer'
  }

  return (
    <nav className="bg-white border-b border-gray-200 h-16 flex items-center px-8 shadow-sm">
      <div className="flex items-center justify-between w-full">
        <div className="flex items-center space-x-4">
          <div className="border-l-4 border-primary pl-4">
            <h1 className="text-2xl font-bold text-gray-900">{getPageTitle()}</h1>
            <p className="text-xs text-gray-500 mt-0.5">IBM DB2 for z/OS</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-6">
          <div className="text-sm text-gray-600 flex items-center space-x-2">
            <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
              <UserIcon size={16} className="text-gray-600" />
            </div>
            <div className="flex flex-col">
              <span className="font-medium text-gray-900">DBA User</span>
              <span className="text-xs text-gray-500">Administrator</span>
            </div>
          </div>
          
          <div className="w-px h-6 bg-gray-300"></div>
          
          <button className="p-2 text-gray-600 hover:bg-gray-100 rounded transition-colors">
            <LogoutIcon size={20} />
          </button>
        </div>
      </div>
    </nav>
  )
}
