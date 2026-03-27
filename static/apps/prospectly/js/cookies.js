// ===== COOKIE BANNER GDPR =====
const COOKIE_KEY = 'prospectly_cookie_consent'

function getCookieConsent() {
  try { return JSON.parse(localStorage.getItem(COOKIE_KEY)) } catch { return null }
}

function saveCookieConsent(consent) {
  localStorage.setItem(COOKIE_KEY, JSON.stringify(consent))
}

function showCookieBanner() {
  const existing = getCookieConsent()
  if (existing) return

  const banner = document.getElementById('cookie-banner')
  if (banner) banner.classList.add('visible')
}

function acceptAllCookies() {
  saveCookieConsent({ analytics: true, functional: true, accepted: true })
  closeCookieBanner()
}

function rejectOptionalCookies() {
  saveCookieConsent({ analytics: false, functional: false, accepted: true })
  closeCookieBanner()
}

function openCookieConfig() {
  document.getElementById('cookie-config')?.classList.add('visible')
}

function saveCookieConfig() {
  const analytics = document.getElementById('cookie-analytics')?.checked ?? false
  const functional = document.getElementById('cookie-functional')?.checked ?? false
  saveCookieConsent({ analytics, functional, accepted: true })
  document.getElementById('cookie-config')?.classList.remove('visible')
  closeCookieBanner()
}

function closeCookieBanner() {
  document.getElementById('cookie-banner')?.classList.remove('visible')
}

// Expose
window.acceptAllCookies = acceptAllCookies
window.rejectOptionalCookies = rejectOptionalCookies
window.openCookieConfig = openCookieConfig
window.saveCookieConfig = saveCookieConfig

// Init
document.addEventListener('DOMContentLoaded', showCookieBanner)
