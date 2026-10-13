// Service Worker for Golden Palace POS
const CACHE_NAME = 'golden-palace-pos-v1';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/icons/icon-192.svg',
  '/icons/icon-512.svg'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  // Only handle HTTP and HTTPS requests; ignore chrome-extension://, moz-extension://, file://, etc.
  if (!event.request.url.startsWith('http://') && !event.request.url.startsWith('https://')) {
    return;
  }

  const url = new URL(event.request.url);

  // For API calls, attempt network first, don't cache unless necessary
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(event.request).catch(() => {
        // Return JSON error response indicating offline state so client can queue it in IndexedDB
        return new Response(JSON.stringify({ 
          offline: true, 
          error: 'Network connection unavailable. Queued for offline sync.' 
        }), {
          status: 503,
          headers: { 'Content-Type': 'application/json' }
        });
      })
    );
    return;
  }

  // For static assets, try cache then network
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(event.request).then((networkResponse) => {
        if (
          networkResponse && 
          networkResponse.status === 200 && 
          event.request.method === 'GET' && 
          (url.pathname.endsWith('.js') || url.pathname.endsWith('.css') || url.pathname.endsWith('.svg') || url.pathname.endsWith('.woff2') || url.pathname.endsWith('.ico'))
        ) {
          const clone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, clone).catch((err) => {
              console.warn('Cache put skipped for request:', event.request.url, err);
            });
          });
        }
        return networkResponse;
      }).catch(async () => {
        if (event.request.mode === 'navigate') {
          const fallback = await caches.match('/index.html');
          if (fallback) return fallback;
        }
        // Return safe empty response instead of undefined/error
        return new Response('', { status: 404, statusText: 'Not Found' });
      });
    })
  );
});
