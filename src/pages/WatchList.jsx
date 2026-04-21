import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Star } from 'lucide-react'
import StatusBanner from '../components/StatusBanner'
import {
  FAVORITE_PACKAGES_STORAGE_KEY,
  readPackageMap,
  writePackageMap,
} from '../utils/packageState'

export default function WatchList() {
  const navigate = useNavigate()
  const [favorites, setFavorites] = useState(() => readPackageMap(FAVORITE_PACKAGES_STORAGE_KEY))

  useEffect(() => {
    writePackageMap(FAVORITE_PACKAGES_STORAGE_KEY, favorites)
  }, [favorites])

  const packages = useMemo(
    () => Object.values(favorites).sort((a, b) => (b.totalCpu ?? 0) - (a.totalCpu ?? 0)),
    [favorites],
  )

  const toggleFavorite = (pkg) => {
    setFavorites((prev) => {
      const next = { ...prev }
      delete next[pkg.packageKey]
      return next
    })
  }

  const openAnalyzer = (pkg) => {
    navigate('/package-viewer', { state: { packageName: pkg.program, packageKey: pkg.packageKey } })
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

      {packages.length === 0 && (
        <StatusBanner
          type="info"
          message="No packages in your watch list yet. Click the star on a package in the dashboard to add it here."
        />
      )}

      {packages.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
          <div className="p-6 border-b border-gray-200 bg-gray-50">
            <h3 className="text-lg font-semibold text-gray-900">Favorited Packages</h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-2 py-4 text-center font-semibold text-gray-700 uppercase text-xs tracking-wide w-10"><span className="sr-only">Watch</span></th>
                  <th className="px-4 py-4 text-center font-semibold text-gray-700 uppercase text-xs tracking-wide w-12">#</th>
                  <th className="px-6 py-4 text-left font-semibold text-gray-700 uppercase text-xs tracking-wide">Package</th>
                  <th className="px-6 py-4 text-left font-semibold text-gray-700 uppercase text-xs tracking-wide">Program</th>
                  <th className="px-6 py-4 text-left font-semibold text-gray-700 uppercase text-xs tracking-wide">Collection</th>
                  <th className="px-6 py-4 text-right font-semibold text-gray-700 uppercase text-xs tracking-wide">CPU (ms)</th>
                  <th className="px-6 py-4 text-right font-semibold text-gray-700 uppercase text-xs tracking-wide">Get Pages</th>
                  <th className="px-6 py-4 text-center font-semibold text-gray-700 uppercase text-xs tracking-wide">Action</th>
                </tr>
              </thead>
              <tbody>
                {packages.map((pkg, idx) => (
                  <tr key={pkg.packageKey} className={`border-b border-gray-100 hover:bg-blue-50 transition-colors ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                    <td className="px-2 py-4 text-center">
                      <button
                        onClick={() => toggleFavorite(pkg)}
                        title="Unwatch"
                        aria-label="Unwatch package"
                        className="p-1 rounded hover:bg-gray-100 transition-colors"
                      >
                        <Star size={18} className="text-amber-500" fill="#f59e0b" />
                      </button>
                    </td>
                    <td className="px-4 py-4 text-center text-gray-600 font-medium">{idx + 1}</td>
                    <td className="px-6 py-4 font-medium">
                      <button
                        onClick={() => openAnalyzer(pkg)}
                        className="text-primary hover:text-primaryDark hover:underline font-medium text-left"
                      >
                        {pkg.displayName}
                      </button>
                    </td>
                    <td className="px-6 py-4 text-gray-700">{pkg.program || '—'}</td>
                    <td className="px-6 py-4 text-gray-700">{pkg.collection || '—'}</td>
                    <td className="px-6 py-4 text-right text-gray-900 font-medium">{(pkg.totalCpu ?? 0).toLocaleString()}</td>
                    <td className="px-6 py-4 text-right text-danger font-medium">{(pkg.totalGetPages ?? 0).toLocaleString()}</td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => openAnalyzer(pkg)}
                        className="px-3 py-2 bg-primary text-white rounded font-medium text-xs hover:bg-primaryDark transition-colors"
                      >
                        Open
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
