import { useState, useEffect } from 'react'
import { CheckIcon } from '../utils/icons'

export default function Settings() {
  const [settings, setSettings] = useState({
    subsystem: 'DB2',
    collection: 'XDB2I',
    defaultTimeRange: '24h',
    statsWarningThreshold: 30,
    itemsPerPage: 50,
    chartRefreshInterval: 60,
  })

  const [saved, setSaved] = useState(false)

  // Load settings from localStorage
  useEffect(() => {
    const savedSettings = localStorage.getItem('db2VizSettings')
    if (savedSettings) {
      setSettings(JSON.parse(savedSettings))
    }
  }, [])

  const handleInputChange = (field, value) => {
    setSettings(prev => ({
      ...prev,
      [field]: value
    }))
    setSaved(false)
  }

  const handleSave = () => {
    localStorage.setItem('db2VizSettings', JSON.stringify(settings))
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  const handleReset = () => {
    setSettings({
      subsystem: 'DB2',
      collection: 'XDB2I',
      defaultTimeRange: '24h',
      statsWarningThreshold: 30,
      itemsPerPage: 50,
      chartRefreshInterval: 60,
    })
    setSaved(false)
  }

  return (
    <div className="p-6 max-w-4xl">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Application Settings</h2>
          <p className="text-gray-600 mt-2">Manage your DB2 Performance Visualizer preferences</p>
        </div>

        {/* Success Message */}
        {saved && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-green-800 flex items-center space-x-2">
            <CheckIcon size={20} />
            <p className="font-medium">Settings saved successfully</p>
          </div>
        )}

        {/* Database Settings */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Database Connection</h3>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Subsystem
              </label>
              <input
                type="text"
                value={settings.subsystem}
                onChange={(e) => handleInputChange('subsystem', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., DB2"
              />
              <p className="text-xs text-gray-600 mt-1">The DB2 subsystem identifier</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Default Collection
              </label>
              <input
                type="text"
                value={settings.collection}
                onChange={(e) => handleInputChange('collection', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., XDB2I"
              />
              <p className="text-xs text-gray-600 mt-1">The default collection to analyze</p>
            </div>
          </div>
        </div>

        {/* Dashboard Settings */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Dashboard Preferences</h3>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Default Time Range
              </label>
              <select
                value={settings.defaultTimeRange}
                onChange={(e) => handleInputChange('defaultTimeRange', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="24h">Last 24 Hours</option>
                <option value="7d">Last 7 Days</option>
                <option value="30d">Last 30 Days</option>
                <option value="custom">Custom Range</option>
              </select>
              <p className="text-xs text-gray-600 mt-1">Default time range for dashboard view</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Items Per Page
              </label>
              <input
                type="number"
                value={settings.itemsPerPage}
                onChange={(e) => handleInputChange('itemsPerPage', parseInt(e.target.value))}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                min="10"
                max="500"
                step="10"
              />
              <p className="text-xs text-gray-600 mt-1">Number of rows displayed per page in tables</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Chart Refresh Interval
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="number"
                  value={settings.chartRefreshInterval}
                  onChange={(e) => handleInputChange('chartRefreshInterval', parseInt(e.target.value))}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="30"
                  max="600"
                  step="30"
                />
                <span className="text-gray-600">seconds</span>
              </div>
              <p className="text-xs text-gray-600 mt-1">Auto-refresh interval for charts (currently disabled in demo)</p>
            </div>
          </div>
        </div>

        {/* Data Settings */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Data Analysis</h3>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Statistics Staleness Warning (days)
              </label>
              <input
                type="number"
                value={settings.statsWarningThreshold}
                onChange={(e) => handleInputChange('statsWarningThreshold', parseInt(e.target.value))}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                min="5"
                max="365"
                step="5"
              />
              <p className="text-xs text-gray-600 mt-1">
                Show warning if table statistics are older than this number of days
              </p>
            </div>
          </div>
        </div>

        {/* Advanced Settings */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Advanced Options</h3>

          <div className="space-y-4">
            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="checkbox"
                defaultChecked={true}
                className="w-4 h-4 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">Enable query caching</span>
            </label>

            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="checkbox"
                defaultChecked={false}
                className="w-4 h-4 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">Show performance predictions</span>
            </label>

            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="checkbox"
                defaultChecked={true}
                className="w-4 h-4 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">Highlight anomalies automatically</span>
            </label>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex space-x-4">
          <button
            onClick={handleSave}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium"
          >
            Save Settings
          </button>
          <button
            onClick={handleReset}
            className="px-6 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 font-medium"
          >
            Reset to Defaults
          </button>
        </div>

        {/* Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-blue-800 text-sm">
          <p>
            <strong>Note:</strong> Settings are saved locally in your browser. Backend endpoints for settings
            persistence will be configured once backend is ready.
          </p>
        </div>
      </div>
    </div>
  )
}
