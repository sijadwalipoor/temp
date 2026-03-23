import { TrendUpIcon, TrendDownIcon } from '../utils/icons'

export default function MetricsCard({ 
  title, 
  value, 
  unit, 
  trend, 
  icon: IconComponent, 
  onClick,
  status = 'normal' // 'critical', 'warning', 'healthy', 'normal'
}) {
  const isPositiveTrend = trend >= 0

  const statusConfig = {
    critical: { bg: 'bg-red-50', border: 'border-red-200', label: 'Critical', dotColor: 'bg-danger' },
    warning: { bg: 'bg-yellow-50', border: 'border-yellow-200', label: 'Warning', dotColor: 'bg-warning' },
    healthy: { bg: 'bg-green-50', border: 'border-green-200', label: 'Healthy', dotColor: 'bg-success' },
    normal: { bg: 'bg-blue-50', border: 'border-blue-200', label: 'Normal', dotColor: 'bg-info' },
  }

  const config = statusConfig[status] || statusConfig.normal

  return (
    <div
      onClick={onClick}
      className={`
        rounded-lg border-2 p-6 
        transition-all duration-200 
        ${config.bg} ${config.border}
        ${onClick ? 'hover:shadow-lg hover:border-opacity-60 cursor-pointer' : ''}
        hover:-translate-y-1
      `}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-2">
          <div className={`w-3 h-3 rounded-full ${config.dotColor}`}></div>
          <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">{config.label}</span>
        </div>
        {IconComponent && (
          <div className="text-gray-400 opacity-60">
            <IconComponent size={28} />
          </div>
        )}
      </div>

      <div>
        <p className="text-sm font-medium text-gray-700 mb-2">{title}</p>
        <div className="flex items-baseline space-x-2">
          <p className="text-4xl font-bold text-gray-900">
            {value.toLocaleString()}
          </p>
          <span className="text-sm font-medium text-gray-600">{unit}</span>
        </div>
      </div>

      {trend !== undefined && (
        <div className={`mt-4 pt-3 border-t border-gray-300 border-opacity-30`}>
          <p className={`text-sm font-medium flex items-center space-x-1 ${
            isPositiveTrend ? 'text-danger' : 'text-success'
          }`}>
            {isPositiveTrend ? (
              <TrendUpIcon size={16} strokeWidth={2} />
            ) : (
              <TrendDownIcon size={16} strokeWidth={2} />
            )}
            <span>{Math.abs(trend)}% vs previous period</span>
          </p>
        </div>
      )}
    </div>
  )
}
