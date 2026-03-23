import { useState } from 'react'

export default function TimeRangePicker({ onRangeChange, defaultRange = '24h' }) {
  const [selectedRange, setSelectedRange] = useState(defaultRange)
  const [customStartDate, setCustomStartDate] = useState('')
  const [customEndDate, setCustomEndDate] = useState('')
  const [showCustom, setShowCustom] = useState(false)

  const handleRangeChange = (range) => {
    setSelectedRange(range)
    setShowCustom(false)
    onRangeChange(range, null, null)
  }

  const handleCustomDateSubmit = () => {
    if (customStartDate && customEndDate) {
      onRangeChange('custom', customStartDate, customEndDate)
    }
  }

  return (
    <div className="flex flex-col gap-4 bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
      <div className="flex items-center gap-4">
        <label className="text-sm font-semibold text-gray-900 uppercase tracking-wide">Time Period:</label>
        
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => handleRangeChange('24h')}
            className={`px-4 py-2 rounded font-medium text-sm transition-all ${
              selectedRange === '24h'
                ? 'bg-primary text-white shadow-md'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300'
            }`}
          >
            Last 24 Hours
          </button>
          
          <button
            onClick={() => handleRangeChange('7d')}
            className={`px-4 py-2 rounded font-medium text-sm transition-all ${
              selectedRange === '7d'
                ? 'bg-primary text-white shadow-md'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300'
            }`}
          >
            Last 7 Days
          </button>

          <button
            onClick={() => setShowCustom(!showCustom)}
            className={`px-4 py-2 rounded font-medium text-sm transition-all border ${
              showCustom
                ? 'bg-gray-200 text-gray-900 border-gray-400'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border-gray-300'
            }`}
          >
            Custom Range
          </button>
        </div>
      </div>

      {showCustom && (
        <div className="flex gap-2 p-4 bg-gray-50 rounded border border-gray-300">
          <input
            type="date"
            value={customStartDate}
            onChange={(e) => setCustomStartDate(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-primary focus:border-primary"
          />
          <span className="text-gray-500 font-medium self-center">to</span>
          <input
            type="date"
            value={customEndDate}
            onChange={(e) => setCustomEndDate(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-primary focus:border-primary"
          />
          <button
            onClick={handleCustomDateSubmit}
            className="px-4 py-2 bg-primary text-white rounded font-medium text-sm hover:bg-primaryDark transition-colors"
          >
            Apply
          </button>
        </div>
      )}
    </div>
  )
}
