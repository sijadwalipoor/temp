import { useState } from 'react'
import { SettingsIcon, CloseIcon } from '../utils/icons'

export default function FilterBar({ onFilterChange, sortOptions = [] }) {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedSort, setSelectedSort] = useState(sortOptions[0]?.value || '')
  const [showAdvanced, setShowAdvanced] = useState(false)

  const handleSearch = (value) => {
    setSearchTerm(value)
    onFilterChange({ search: value, sort: selectedSort })
  }

  const handleSort = (value) => {
    setSelectedSort(value)
    onFilterChange({ search: searchTerm, sort: value })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        {/* Search */}
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search by program or SQL statement..."
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded font-medium text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary placeholder-gray-500"
          />
        </div>

        {/* Sort Dropdown */}
        {sortOptions.length > 0 && (
          <select
            value={selectedSort}
            onChange={(e) => handleSort(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded font-medium text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-white hover:border-gray-400"
          >
            {sortOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        )}

        {/* Advanced Filter Toggle */}
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className={`px-4 py-2 text-sm font-medium rounded border transition-colors flex items-center gap-2 ${
            showAdvanced
              ? 'bg-gray-200 text-gray-900 border-gray-400'
              : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50 hover:border-gray-400'
          }`}
        >
          {showAdvanced ? (
            <>
              <CloseIcon size={16} strokeWidth={2} />
              <span>Hide Filters</span>
            </>
          ) : (
            <>
              <SettingsIcon size={16} strokeWidth={2} />
              <span>Advanced</span>
            </>
          )}
        </button>
      </div>

      {showAdvanced && (
        <div className="grid grid-cols-3 gap-4 p-4 bg-gray-50 rounded border border-gray-200">
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2 uppercase text-xs tracking-wide">
              Collection
            </label>
            <input
              type="text"
              placeholder="e.g., XDB2I"
              className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-primary focus:border-primary"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2 uppercase text-xs tracking-wide">
              Subsystem
            </label>
            <input
              type="text"
              placeholder="e.g., DB2"
              className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-primary focus:border-primary"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2 uppercase text-xs tracking-wide">
              Min CPU (ms)
            </label>
            <input
              type="number"
              placeholder="0"
              className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-primary focus:border-primary"
            />
          </div>
        </div>
      )}
    </div>
  )
}
