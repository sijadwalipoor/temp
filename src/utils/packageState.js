export const REVIEWED_PACKAGES_STORAGE_KEY = 'db2perf.reviewedPackages'
export const FAVORITE_PACKAGES_STORAGE_KEY = 'db2perf.favoritePackages'

/**
 * Reviewed / favourite packages are persisted client-side keyed by `packageKey`
 * (collection::program::conToken) so the selection survives refreshes without
 * requiring a backend user profile.
 */
export const readPackageMap = (key) => {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return {}
    const parsed = JSON.parse(raw)
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {}
  } catch {
    return {}
  }
}

export const writePackageMap = (key, map) => {
  localStorage.setItem(key, JSON.stringify(map ?? {}))
}
