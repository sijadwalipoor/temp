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

export const getIntervalForPreset = (preset) => {
  if (preset === 'last7Days') return getIntervalFromNow({ hours: 24 * 7 })
  return getIntervalFromNow({ hours: 24 })
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
