export default function StatusBanner({
  type = 'info',
  message,
}) {
  if (!message) return null

  const styles = {
    info: 'border-gray-200 bg-gray-50 text-gray-700',
    error: 'border-red-200 bg-red-50 text-red-700',
    success: 'border-green-200 bg-green-50 text-green-700',
    warning: 'border-yellow-200 bg-yellow-50 text-yellow-700',
  }

  return (
    <div className={`p-4 rounded border text-sm ${styles[type] || styles.info}`}>
      {message}
    </div>
  )
}
