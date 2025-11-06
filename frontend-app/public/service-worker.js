const CACHE_NAME = 'auditorias-v1';
const urlsToCache = [
  '/'
];

// Instalación - cachear recursos estáticos
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        // Intentar cachear, pero no fallar si alguno falla
        return Promise.allSettled(
          urlsToCache.map(url => cache.add(url).catch(err => console.log('Cache miss:', url)))
        );
      })
      .then(() => self.skipWaiting())
  );
});

// Activación - limpiar cachés viejos
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch - estrategia Network First con fallback a caché
self.addEventListener('fetch', event => {
  // Solo cachear GET requests
  if (event.request.method !== 'GET') return;
  
  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Cachear respuestas exitosas
        if (response && response.status === 200) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      })
      .catch(() => {
        // Si falla la red, usar caché
        return caches.match(event.request);
      })
  );
});

// Background Sync - sincronizar cuando vuelva internet
self.addEventListener('sync', event => {
  if (event.tag === 'sync-audits') {
    event.waitUntil(syncPendingChanges());
  }
});

async function syncPendingChanges() {
  // Esta función se llamará desde el código React
  console.log('Sincronizando cambios pendientes...');
}
