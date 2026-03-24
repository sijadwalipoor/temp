import { useState } from 'react'
import {
  fromApiDateTimeToInput,
  fromInputToApiDateTime,
  getIntervalForPreset,
} from '../utils/timeInterval'

export default function TimeRangePicker({
  onRangeChange,
  defaultPreset = 'last24Hours',
  defaultInterval,
}) {
  const initialInterval = defaultInterval || getIntervalForPreset(defaultPreset)

  const [selectedPreset, setSelectedPreset] = useState(defaultPreset)
  const [customStartDate, setCustomStartDate] = useState(fromApiDateTimeToInput(initialInterval.from))
  const [customEndDate, setCustomEndDate] = useState(fromApiDateTimeToInput(initialInterval.to))
  const [showCustom, setShowCustom] = useState(false)

  const handlePresetChange = (preset) => {
    const interval = getIntervalForPreset(preset)
    setSelectedPreset(preset)
    setCustomStartDate(fromApiDateTimeToInput(interval.from))
    setCustomEndDate(fromApiDateTimeToInput(interval.to))
    setShowCustom(false)
    onRangeChange({ from: interval.from, to: interval.to, preset })
  }

  const handleCustomDateSubmit = () => {
    if (customStartDate && customEndDate) {
      const from = fromInputToApiDateTime(customStartDate)
      const to = fromInputToApiDateTime(customEndDate)

      if (from > to) return

      setSelectedPreset('custom')
      onRangeChange({ from, to, preset: 'custom' })
    }
  }

  return (
    <div className="flex flex-col gap-4 bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
      <div className="flex items-center gap-4">
        <label className="text-sm font-semibold text-gray-900 uppercase tracking-wide">Time Period:</label>
        
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => handlePresetChange('last24Hours')}
            className={`px-4 py-2 rounded font-medium text-sm transition-all ${
              selectedPreset === 'last24Hours'
                ? 'bg-primary text-white shadow-md'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300'
            }`}
          >
            Last 24 Hours
          </button>
          
          <button
            onClick={() => handlePresetChange('last7Days')}
            className={`px-4 py-2 rounded font-medium text-sm transition-all ${
              selectedPreset === 'last7Days'
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
            type="datetime-local"
            step="1"
            value={customStartDate}
            onChange={(e) => setCustomStartDate(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-primary focus:border-primary"
          />
          <span className="text-gray-500 font-medium self-center">to</span>
          <input
            type="datetime-local"
            step="1"
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
