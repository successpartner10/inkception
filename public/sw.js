/* Inkception service worker — network-first with cache fallback.
   The app is fully local (no backend), so after the first visit this makes
   the hosted site work offline too. Hashed build assets are immutable, so a
   network-first policy never serves stale code after a new deploy. */
const CACHE = 'inkception-v1'

self.addEventListener('install', (e) => {
  self.skipWaiting()
})

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()),
  )
})

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return
  // never cache cross-origin (fonts from Google, etc.) — let the browser handle them
  if (!e.request.url.startsWith(self.location.origin)) return
  e.respondWith(
    fetch(e.request)
      .then((res) => {
        if (res && res.ok) {
          const clone = res.clone()
          caches.open(CACHE).then((c) => c.put(e.request, clone)).catch(() => {})
        }
        return res
      })
      .catch(() =>
        caches.match(e.request, { ignoreSearch: true }).then((hit) => hit || (e.request.mode === 'navigate' ? caches.match('./index.html') : Response.error())),
      ),
  )
})
