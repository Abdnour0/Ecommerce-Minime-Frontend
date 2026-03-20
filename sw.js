const CACHE_NAME = 'minime-cache-v1';

// Pre-cache core structural assets to ensure the "App Shell" loads instantly offline
const CORE_ASSETS = [
  '/',
  '/index.html',
  '/style.css',
  '/main.js',
  '/manifest.json'
];

// Install event - cache core assets
self.addEventListener('install', (event) => {
  self.skipWaiting(); // Force the waiting service worker to become the active service worker
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[ServiceWorker] Pre-caching core structural assets');
        return cache.addAll(CORE_ASSETS);
      })
      .catch((error) => {
        console.warn('[ServiceWorker] Pre-caching encountered an error (some paths may not exist yet):', error);
      })
  );
});

// Activate event - clean up old caches if the CACHE_NAME changes
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[ServiceWorker] Removing old cache', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch event - Stale-While-Revalidate network strategy
self.addEventListener('fetch', (event) => {
  // Skip cross-origin requests, like API endpoints (Stripe, Backend, etc), and only handle GET
  if (event.request.method !== 'GET' || !event.request.url.startsWith(self.location.origin)) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      // 1. Return the cached response immediately if it exists (Stale)
      // 2. Regardless, fetch the newest version from the network (Revalidate)
      const fetchPromise = fetch(event.request).then((networkResponse) => {
        // Only cache valid structural responses (not errors)
        if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      }).catch((err) => {
        console.warn('[ServiceWorker] Network request failed, relying on cache for:', event.request.url);
      });

      // Return cached immediately; if null, return the active fetch promise waiting for the network
      return cachedResponse || fetchPromise;
    })
  );
});
