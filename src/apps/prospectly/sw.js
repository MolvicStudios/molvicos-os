const CACHE_NAME = 'prospectly-v3'
const ASSETS = [
  '/',
  '/index.html',
  '/css/tokens.css',
  '/css/reset.css',
  '/css/layout.css',
  '/css/components.css',
  '/css/generator.css',
  '/css/prospecting.css',
  '/js/app.js',
  '/js/generator.js',
  '/js/prospecting.js',
  '/js/export.js',
  '/js/groq.js',
  '/js/cookies.js',
  '/js/onboarding.js',
  '/js/i18n.js',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/favicon.svg',
  '/manifest.json'
]

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE_NAME).then(c => c.addAll(ASSETS)))
  self.skipWaiting()
})

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  )
  self.clients.claim()
})

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url)

  // Network-first for API calls and external resources
  if (url.origin !== self.location.origin || e.request.method !== 'GET') {
    e.respondWith(fetch(e.request).catch(() => caches.match(e.request)))
    return
  }

  // Cache-first for local assets, fallback to network + update cache
  e.respondWith(
    caches.match(e.request).then(cached => {
      const fetchPromise = fetch(e.request).then(response => {
        if (response.ok) {
          const clone = response.clone()
          caches.open(CACHE_NAME).then(cache => cache.put(e.request, clone))
        }
        return response
      }).catch(() => cached)

      return cached || fetchPromise
    })
  )
})
