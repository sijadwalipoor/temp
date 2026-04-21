const pad = (value) => String(value).padStart(2, '0')

export const toApiDateTime = (date) => {
  const d = new Date(date)
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

export const fromApiDateTimeToInput = (value) => {
  if (!value) return ''
  return value.slice(0, 16)
}

export const fromInputToApiDateTime = (value) => {
  if (!value) return ''
  return `${value}:00`
}

export const getIntervalFromNow = ({ hours = 24 } = {}) => {
  const to = new Date()
  const from = new Date(to.getTime() - hours * 60 * 60 * 1000)

  return {
    from: toApiDateTime(from),
    to: toApiDateTime(to),
  }
}

export const PRESETS = [
  { value: 'last1Hour', label: 'Last hour', hours: 1 },
  { value: 'last6Hours', label: 'Last 6h', hours: 6 },
  { value: 'last24Hours', label: 'Last 24h', hours: 24 },
  { value: 'last7Days', label: 'Last 7d', hours: 24 * 7 },
  { value: 'last30Days', label: 'Last 30d', hours: 24 * 30 },
]

export const getIntervalForPreset = (preset) => {
  const match = PRESETS.find((p) => p.value === preset)
  return getIntervalFromNow({ hours: match ? match.hours : 24 })
}

export const formatIntervalLabel = ({ from, to }) => {
  if (!from || !to) return 'N/A'

  const fromDate = new Date(from)
  const toDate = new Date(to)

  const formatter = new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

  return `${formatter.format(fromDate)} - ${formatter.format(toDate)}`
}
