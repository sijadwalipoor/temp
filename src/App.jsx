import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AppProvider } from './context/AppContext'
import Navbar from './components/Navbar'
import Sidebar from './components/Sidebar'
import Dashboard from './pages/Dashboard'
import PackageAnalyzer from './pages/PackageAnalyzer'
import StatementAnalyzer from './pages/StatementAnalyzer'
import AccessPathViewer from './pages/AccessPathViewer'
import Settings from './pages/Settings'

function App() {
  return (
    <AppProvider>
      <Router>
        <div className="flex h-screen bg-light">
          <Sidebar />
          <div className="flex-1 flex flex-col overflow-hidden">
            <Navbar />
            <main className="flex-1 overflow-auto bg-light">
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/package-analyzer" element={<PackageAnalyzer />} />
                <Route path="/statement/:statementId" element={<StatementAnalyzer />} />
                <Route path="/access-path" element={<AccessPathViewer />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </main>
          </div>
        </div>
      </Router>
    </AppProvider>
  )
}

export default App
