export default function MetricsCard({ title, value, unit, trend, onClick }) {
  const isPositiveTrend = trend >= 0

  return (
    <div
      onClick={onClick}
      className={`
        rounded-lg border border-gray-200 bg-white p-6
        transition-all duration-200
        ${onClick ? 'hover:shadow-lg cursor-pointer' : ''}
        hover:-translate-y-1
      `}
    >
      <div className="mb-4">
        <p className="text-sm font-medium text-gray-700">{title}</p>
      </div>

      <div className="flex items-baseline space-x-2">
        <p className="text-4xl font-bold text-gray-900">
          {value.toLocaleString()}
        </p>
        <span className="text-sm font-medium text-gray-600">{unit}</span>
      </div>

      {trend !== undefined && (
        <div className="mt-4 pt-3 border-t border-gray-200">
          <p className={`text-sm font-medium ${
            isPositiveTrend ? 'text-danger' : 'text-success'
          }`}>
            <span>{Math.abs(trend)}% vs previous period</span>
          </p>
        </div>
      )}
    </div>
  )
}
