const WORKER_URL = 'https://groq-proxy.molvicstudios.pro'

const KEYS = {
  license_key: 'prospectly_pro_license_key',
  plan:        'prospectly_pro_plan',
  verified_at: 'prospectly_pro_verified_at',
  expires:     'prospectly_pro_expires'
}

const CACHE_TTL = 24 * 60 * 60 * 1000  // 24h

function get(key) { return localStorage.getItem(key) }
function set(key, val) { localStorage.setItem(key, val) }
function del(key) { localStorage.removeItem(key) }

function isCacheValid() {
  const verifiedAt = get(KEYS.verified_at)
  const plan = get(KEYS.plan)
  if (!verifiedAt || !plan) return false
  return Date.now() - parseInt(verifiedAt) < CACHE_TTL
}

async function verifyWithServer(licenseKey) {
  const res = await fetch(`${WORKER_URL}/api/verify-license`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ license_key: licenseKey })
  })
  return res.json()
}

const LicenseSystem = {
  isPro() {
    return true
  },

  getPlan() {
    return 'pro'
  },

  async activate(licenseKey) {
    if (!licenseKey || !licenseKey.trim()) {
      return { success: false, error: 'Introduce una clave de licencia' }
    }

    try {
      const result = await verifyWithServer(licenseKey.trim())

      if (!result.valid) {
        const reasons = {
          subscription_inactive: 'Tu suscripción no está activa',
          missing_key: 'Clave no válida'
        }
        return { success: false, error: reasons[result.reason] || 'Clave de licencia no válida' }
      }

      set(KEYS.license_key, licenseKey.trim())
      set(KEYS.plan, result.plan)
      set(KEYS.verified_at, Date.now().toString())
      if (result.expires) set(KEYS.expires, result.expires)

      return { success: true, plan: result.plan }
    } catch {
      return { success: false, error: 'Error de conexión. Inténtalo de nuevo.' }
    }
  },

  deactivate() {
    Object.values(KEYS).forEach(k => del(k))
  },

  async refresh() {
    const licenseKey = get(KEYS.license_key)
    if (!licenseKey) return false

    if (isCacheValid()) return true

    try {
      const result = await verifyWithServer(licenseKey)

      if (!result.valid) {
        this.deactivate()
        return false
      }

      set(KEYS.plan, result.plan)
      set(KEYS.verified_at, Date.now().toString())
      if (result.expires) set(KEYS.expires, result.expires)

      return true
    } catch {
      // Offline: trust cache if it existed
      return !!get(KEYS.plan)
    }
  }
}

export default LicenseSystem
