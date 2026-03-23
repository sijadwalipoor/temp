import { ChevronLeftIcon, ChevronRightIcon } from '../utils/icons'

export default function Paginator({ 
  currentPage = 1, 
  totalItems = 0, 
  itemsPerPage = 50, 
  onPageChange 
}) {
  const totalPages = Math.ceil(totalItems / itemsPerPage)

  const handlePrevious = () => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1)
    }
  }

  const handleNext = () => {
    if (currentPage < totalPages) {
      onPageChange(currentPage + 1)
    }
  }

  const getPageNumbers = () => {
    const delta = 2
    const range = []
    const rangeWithDots = []
    let l

    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || (i >= currentPage - delta && i <= currentPage + delta)) {
        range.push(i)
      }
    }

    range.forEach((i) => {
      if (l) {
        if (i - l === 2) {
          rangeWithDots.push(l + 1)
        } else if (i - l !== 1) {
          rangeWithDots.push('...')
        }
      }
      rangeWithDots.push(i)
      l = i
    })

    return rangeWithDots
  }

  if (totalPages <= 1) return null

  return (
    <div className="flex items-center justify-between px-6 py-4 bg-white border-t border-gray-200">
      <div className="text-sm text-gray-700 font-medium">
        Page <span className="font-semibold text-gray-900">{currentPage}</span> of{' '}
        <span className="font-semibold text-gray-900">{totalPages}</span>
        {totalItems > 0 && (
          <span className="ml-2 text-gray-600">
            • <span className="font-semibold text-gray-900">{totalItems.toLocaleString()}</span> total items
          </span>
        )}
      </div>

      <div className="flex items-center gap-1">
        <button
          onClick={handlePrevious}
          disabled={currentPage === 1}
          className={`px-3 py-2 rounded border font-medium text-sm flex items-center gap-1 transition-all ${
            currentPage === 1
              ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
              : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50 hover:border-gray-400'
          }`}
        >
          <ChevronLeftIcon size={16} strokeWidth={2} />
          <span>Prev</span>
        </button>

        <div className="flex items-center gap-1 mx-2">
          {getPageNumbers().map((pageNum, idx) => (
            <button
              key={idx}
              onClick={() => pageNum !== '...' && onPageChange(pageNum)}
              disabled={pageNum === '...'}
              className={`px-3 py-2 rounded text-sm font-medium border transition-all ${
                pageNum === currentPage
                  ? 'bg-primary text-white border-primary shadow-md'
                  : pageNum === '...'
                  ? 'bg-white text-gray-700 border-gray-200 cursor-default'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50 hover:border-gray-400'
              }`}
            >
              {pageNum}
            </button>
          ))}
        </div>

        <button
          onClick={handleNext}
          disabled={currentPage === totalPages}
          className={`px-3 py-2 rounded border font-medium text-sm flex items-center gap-1 transition-all ${
            currentPage === totalPages
              ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
              : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50 hover:border-gray-400'
          }`}
        >
          <span>Next</span>
          <ChevronRightIcon size={16} strokeWidth={2} />
        </button>
      </div>
    </div>
  )
}
