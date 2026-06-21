const CACHE_NAME = 'minime-cache-v2';
const DEV_HOSTS = new Set(['localhost', '127.0.0.1']);

const log = (...args) => {
  if (DEV_HOSTS.has(self.location.hostname)) console.log(...args);
};

const warn = (...args) => console.warn(...args);

const CORE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/shoe.svg'
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        log('[ServiceWorker] Pre-caching core assets');
        return cache.addAll(CORE_ASSETS);
      })
      .catch((error) => {
        warn('[ServiceWorker] Pre-cache skipped for one or more assets:', error);
      })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            log('[ServiceWorker] Removing old cache', cacheName);
            return caches.delete(cacheName);
          }
          return undefined;
        })
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET' || !event.request.url.startsWith(self.location.origin)) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const fetchPromise = fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache);
            });
          }
          return networkResponse;
        })
        .catch(() => {
          warn('[ServiceWorker] Network failed, using cache for:', event.request.url);
          return cachedResponse;
        });

      return cachedResponse || fetchPromise;
    })
  );
});
