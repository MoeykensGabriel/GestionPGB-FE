// Service worker minimo para que la PWA sea instalable (Android/Chrome lo exige).
// Estrategia network-first: siempre intenta la red (app siempre fresca), y solo
// usa el cache como respaldo si no hay conexion. No cachea la API (otro origen).
const CACHE = 'gpgb-v1'

self.addEventListener('install', () => self.skipWaiting())

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      // Limpia caches viejos de versiones anteriores.
      const keys = await caches.keys()
      await Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
      await self.clients.claim()
    })()
  )
})

self.addEventListener('fetch', (event) => {
  const req = event.request
  // Solo GET y solo mismo origen (excluye llamadas a la API del backend).
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return

  event.respondWith(
    fetch(req)
      .then((res) => {
        // Guarda copia para respaldo offline.
        const copy = res.clone()
        caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {})
        return res
      })
      .catch(async () => {
        const cached = await caches.match(req)
        if (cached) return cached
        // Para navegaciones sin conexion, cae al index cacheado.
        if (req.mode === 'navigate') {
          const shell = await caches.match('/')
          if (shell) return shell
        }
        return Response.error()
      })
  )
})
