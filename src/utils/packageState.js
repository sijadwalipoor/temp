export const REVIEWED_PACKAGES_STORAGE_KEY = 'dashboardReviewedPackages'
export const FAVORITE_PACKAGES_STORAGE_KEY = 'dashboardFavoritePackages'

export const readPackageIdSet = (key) => {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return new Set()
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return new Set()
    return new Set(parsed.map((value) => String(value)))
  } catch {
    return new Set()
  }
}

export const writePackageIdSet = (key, values) => {
  const normalized = Array.from(values || []).map((value) => String(value))
  localStorage.setItem(key, JSON.stringify(normalized))
}
