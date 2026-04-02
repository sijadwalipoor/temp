import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import StatusBanner from '../components/StatusBanner'
import { packageAPI } from '../services/api'
import {
  FAVORITE_PACKAGES_STORAGE_KEY,
  REVIEWED_PACKAGES_STORAGE_KEY,
  readPackageIdSet,
  writePackageIdSet,
} from '../utils/packageState'

export default function WatchList() {
  const navigate = useNavigate()
  const [favoritePackageIds, setFavoritePackageIds] = useState(() => readPackageIdSet(FAVORITE_PACKAGES_STORAGE_KEY))
  const [reviewedPackageIds, setReviewedPackageIds] = useState(() => readPackageIdSet(REVIEWED_PACKAGES_STORAGE_KEY))
  const [packages, setPackages] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const favoriteIdList = useMemo(() => Array.from(favoritePackageIds), [favoritePackageIds])

  useEffect(() => {
    writePackageIdSet(FAVORITE_PACKAGES_STORAGE_KEY, favoritePackageIds)
  }, [favoritePackageIds])

  useEffect(() => {
    writePackageIdSet(REVIEWED_PACKAGES_STORAGE_KEY, reviewedPackageIds)
  }, [reviewedPackageIds])

  useEffect(() => {
    const loadWatchListPackages = async () => {
      setLoading(true)
      setError('')

      if (favoriteIdList.length === 0) {
        setPackages([])
        setLoading(false)
        return
      }

      try {
        const results = await Promise.allSettled(
          favoriteIdList.map((id) => packageAPI.getPackage(id))
        )

        const mapped = results.map((result, idx) => {
          const fallbackId = favoriteIdList[idx]

          if (result.status !== 'fulfilled') {
            return {
              id: fallbackId,
              name: `Package ${fallbackId}`,
              program: 'N/A',
              collection: 'XDB2I',
            }
          }

          const payload = result.value.data?.data ?? result.value.data ?? {}
          return {
            id: String(payload.id ?? payload.packageId ?? fallbackId),
            name: payload.name ?? payload.packageName ?? `Package ${fallbackId}`,
            program: payload.program ?? payload.programName ?? 'N/A',
            collection: payload.collection ?? 'XDB2I',
          }
        })

        setPackages(mapped)
      } catch (err) {
        setError(err?.response?.data?.message || 'Failed to load watch list packages')
        setPackages(
          favoriteIdList.map((id) => ({
            id,
            name: `Package ${id}`,
            program: 'N/A',
            collection: 'XDB2I',
          }))
        )
      } finally {
        setLoading(false)
      }
    }

    loadWatchListPackages()
  }, [favoriteIdList])

  const removeFromWatchList = (packageId) => {
    const id = String(packageId)
    setFavoritePackageIds((prev) => {
      const next = new Set(prev)
      next.delete(id)
      return next
    })
  }

  const toggleReviewed = (packageId) => {
    const id = String(packageId)
    setReviewedPackageIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  return (
    <div className="p-8 space-y-6 bg-light min-h-screen">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Watch List</h2>
          <p className="text-gray-600 text-sm mt-1">Your favorited packages for quick access</p>
        </div>
        <span className="text-sm font-medium text-gray-600 bg-white px-3 py-1 rounded border border-gray-300">
          {packages.length} packages
        </span>
      </div>

      {loading && <StatusBanner type="info" message="Loading watch list..." />}
      <StatusBanner type="error" message={error} />

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
        <div className="p-6 border-b border-gray-200 bg-gray-50">
          <h3 className="text-lg font-semibold text-gray-900">Favorited Packages</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left font-semibold text-gray-700 uppercase text-xs tracking-wide">Package</th>
                <th className="px-6 py-4 text-left font-semibold text-gray-700 uppercase text-xs tracking-wide">Program</th>
                <th className="px-6 py-4 text-left font-semibold text-gray-700 uppercase text-xs tracking-wide">Collection</th>
                <th className="px-6 py-4 text-center font-semibold text-gray-700 uppercase text-xs tracking-wide">Status</th>
                <th className="px-6 py-4 text-center font-semibold text-gray-700 uppercase text-xs tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody>
              {packages.map((pkg, idx) => {
                const isReviewed = reviewedPackageIds.has(String(pkg.id))
                return (
                  <tr key={pkg.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-6 py-4 font-medium text-gray-900">{pkg.name}</td>
                    <td className="px-6 py-4 text-gray-700">{pkg.program}</td>
                    <td className="px-6 py-4 text-gray-700">{pkg.collection}</td>
                    <td className="px-6 py-4 text-center">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${isReviewed ? 'bg-amber-100 text-amber-800' : 'bg-green-100 text-green-800'}`}>
                        {isReviewed ? 'Reviewed' : 'Active'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => navigate('/package-analyzer', { state: { packageId: pkg.id } })}
                          className="px-3 py-2 bg-primary text-white rounded font-medium text-xs hover:bg-primaryDark transition-colors"
                        >
                          Open
                        </button>
                        <button
                          onClick={() => toggleReviewed(pkg.id)}
                          className="px-2 py-1 rounded font-medium text-xs transition-colors border bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100"
                        >
                          {isReviewed ? 'Unreview' : 'Reviewed'}
                        </button>
                        <button
                          onClick={() => removeFromWatchList(pkg.id)}
                          className="px-2 py-1 rounded font-medium text-xs transition-colors border bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                        >
                          Remove
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}

              {packages.length === 0 && !loading && (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-sm text-gray-500">
                    No packages in your watch list yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
