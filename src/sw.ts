/// <reference lib="WebWorker" />
import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { NetworkFirst, StaleWhileRevalidate } from 'workbox-strategies';
import { ExpirationPlugin } from 'workbox-expiration';

declare let self: ServiceWorkerGlobalScope;

// Clean up old caches
cleanupOutdatedCaches();

// Precache manifest - use as provided by build tool
const manifest = self.__WB_MANIFEST || [];

console.log('[SW] Precaching manifest entries:', manifest.length);

try {
  precacheAndRoute(manifest);
} catch (error) {
  console.error('[SW] Precache error:', error);
}

// Network-first for API calls
registerRoute(
  ({ url }) => url.pathname.startsWith('/api'),
  new NetworkFirst({ 
    cacheName: 'api-cache',
    plugins: [new ExpirationPlugin({ maxEntries: 50, maxAgeSeconds: 5 * 60 })]
  })
);

// Stale-while-revalidate for HTML
registerRoute(
  ({ request }) => request.mode === 'navigate',
  new StaleWhileRevalidate({ cacheName: 'pages-cache' })
);

// Network-first for scripts and styles (cache fallback)
registerRoute(
  ({ request }) => 
    request.destination === 'script' ||
    request.destination === 'style' ||
    request.destination === 'font',
  new NetworkFirst({ 
    cacheName: 'assets-cache',
    plugins: [new ExpirationPlugin({ maxEntries: 100, maxAgeSeconds: 30 * 24 * 60 * 60 })]
  })
);

// Stale-while-revalidate for images
registerRoute(
  ({ request }) => request.destination === 'image',
  new StaleWhileRevalidate({ 
    cacheName: 'images-cache',
    plugins: [new ExpirationPlugin({ maxEntries: 100, maxAgeSeconds: 30 * 24 * 60 * 60 })]
  })
);

// Default fetch handler with error recovery
self.addEventListener('fetch', (event: FetchEvent) => {
  // Only handle same-origin GET requests; let Workbox handle registered routes
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;

  // Try network first, fallback to cache for same-origin assets
  event.respondWith(
    fetch(event.request)
      .then(response => {
        if (response && response.status === 200) {
          const cloned = response.clone();
          caches.open('dynamic-cache').then(cache => cache.put(event.request, cloned));
        }
        return response;
      })
      .catch(() =>
        caches.match(event.request)
          .then(cached => cached || new Response('Offline', { status: 503 }))
          .catch(() => new Response('Service Worker Error', { status: 500 }))
      )
  );
});

// Message handler
self.addEventListener('message', (event: ExtendableMessageEvent) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Handle installation errors gracefully
self.addEventListener('install', (event: ExtendableEvent) => {
  console.log('[SW] Install event triggered');
  event.waitUntil(
    Promise.resolve().then(() => {
      console.log('[SW] Installation complete');
    }).catch(err => {
      console.error('[SW] Installation error:', err);
      // Still allow the SW to activate even if precache fails
      return Promise.resolve();
    })
  );
});

// Handle activation
self.addEventListener('activate', (event: ExtendableEvent) => {
  console.log('[SW] Activate event triggered');
  event.waitUntil(
    self.clients.claim().then(() => {
      console.log('[SW] Service Worker now controlling all clients');
    })
  );
});

