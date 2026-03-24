/**
 * Utility functions for managing cookies
 */

export const setCookie = (name, value, days = 7) => {
  const expires = new Date()
  expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000)
  
  const cookieValue = typeof value === 'string' ? value : JSON.stringify(value)
  document.cookie = `${name}=${encodeURIComponent(cookieValue)};expires=${expires.toUTCString()};path=/`
}

export const getCookie = (name) => {
  const nameEQ = name + '='
  const cookies = document.cookie.split(';')
  
  for (let cookie of cookies) {
    cookie = cookie.trim()
    if (cookie.indexOf(nameEQ) === 0) {
      const rawValue = decodeURIComponent(cookie.substring(nameEQ.length))
      try {
        return JSON.parse(rawValue)
      } catch {
        return rawValue
      }
    }
  }
  return null
}

export const deleteCookie = (name) => {
  setCookie(name, '', -1)
}
