import { useEffect, useRef, useState } from 'react'
import { ChevronDown } from 'lucide-react'
import {
  PRESETS,
  formatIntervalLabel,
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
  const [currentInterval, setCurrentInterval] = useState(initialInterval)
  const [customStart, setCustomStart] = useState(fromApiDateTimeToInput(initialInterval.from))
  const [customEnd, setCustomEnd] = useState(fromApiDateTimeToInput(initialInterval.to))
  const [isOpen, setIsOpen] = useState(false)
  const [customError, setCustomError] = useState('')

  const rootRef = useRef(null)

  useEffect(() => {
    if (!isOpen) return undefined

    const handleMouseDown = (event) => {
      if (rootRef.current && !rootRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }
    const handleEscape = (event) => {
      if (event.key === 'Escape') setIsOpen(false)
    }

    document.addEventListener('mousedown', handleMouseDown)
    document.addEventListener('keydown', handleEscape)
    return () => {
      document.removeEventListener('mousedown', handleMouseDown)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen])

  const applyPreset = (preset) => {
    const interval = getIntervalForPreset(preset)
    setSelectedPreset(preset)
    setCurrentInterval(interval)
    setCustomStart(fromApiDateTimeToInput(interval.from))
    setCustomEnd(fromApiDateTimeToInput(interval.to))
    setCustomError('')
    setIsOpen(false)
    onRangeChange({ from: interval.from, to: interval.to, preset })
  }

  const applyCustom = () => {
    if (!customStart || !customEnd) {
      setCustomError('Please choose a start and end date.')
      return
    }
    const from = fromInputToApiDateTime(customStart)
    const to = fromInputToApiDateTime(customEnd)
    if (from > to) {
      setCustomError('Start must be before end.')
      return
    }
    setSelectedPreset('custom')
    setCurrentInterval({ from, to })
    setCustomError('')
    setIsOpen(false)
    onRangeChange({ from, to, preset: 'custom' })
  }

  const activePresetLabel = PRESETS.find((p) => p.value === selectedPreset)?.label
  const triggerText = activePresetLabel || formatIntervalLabel(currentInterval)

  return (
    <div className="relative inline-block" ref={rootRef}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex items-center gap-2 px-3 py-2 rounded-md border border-gray-300 bg-white text-sm text-gray-800 hover:border-gray-400 shadow-sm min-w-72"
      >
        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Time</span>
        <span className="font-medium">{triggerText}</span>
        <ChevronDown size={16} className="ml-auto text-gray-500" />
      </button>

      {isOpen && (
        <div className="absolute left-0 mt-2 z-30 w-[520px] bg-white border border-gray-200 rounded-lg shadow-xl p-4 flex gap-4">
          <div className="w-40 border-r border-gray-200 pr-4">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Quick ranges</p>
            <ul className="space-y-1">
              {PRESETS.map((preset) => (
                <li key={preset.value}>
                  <button
                    type="button"
                    onClick={() => applyPreset(preset.value)}
                    className={`w-full text-left px-2 py-1.5 rounded text-sm transition-colors ${
                      selectedPreset === preset.value
                        ? 'bg-primary/10 text-primary font-medium'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    {preset.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div className="flex-1 flex flex-col gap-3">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Custom range</p>

            <label className="flex flex-col gap-1 text-xs text-gray-600">
              <span>From</span>
              <input
                type="datetime-local"
                step="1"
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
                className="px-2.5 py-1.5 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-primary focus:border-primary"
              />
            </label>

            <label className="flex flex-col gap-1 text-xs text-gray-600">
              <span>To</span>
              <input
                type="datetime-local"
                step="1"
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
                className="px-2.5 py-1.5 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-primary focus:border-primary"
              />
            </label>

            {customError && <p className="text-xs text-red-600">{customError}</p>}

            <div className="flex justify-end gap-2 mt-auto pt-2">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="px-3 py-1.5 text-sm text-gray-700 rounded-md hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={applyCustom}
                className="px-4 py-1.5 bg-primary text-white rounded-md text-sm font-medium hover:bg-primaryDark"
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
