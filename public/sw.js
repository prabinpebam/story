/* Basic offline-first runtime caching for Story.
   - App shell: network-first (cache fallback)
   - Static/media: cache-first (populate on demand)
*/

const CACHE_VERSION = 'story-sw-v1';
const APP_SHELL_CACHE = `${CACHE_VERSION}:app-shell`;
const RUNTIME_CACHE = `${CACHE_VERSION}:runtime`;

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    // Cache minimal shell; the rest is runtime cached.
    const cache = await caches.open(APP_SHELL_CACHE);
    await cache.addAll(['/']);
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.map((k) => {
      if (!k.startsWith(CACHE_VERSION)) return caches.delete(k);
      return Promise.resolve();
    }));

    await self.clients.claim();
  })());
});

function isSameOrigin(url) {
  try {
    return new URL(url).origin === self.location.origin;
  } catch {
    return false;
  }
}

function shouldCacheRequest(request) {
  if (request.method !== 'GET') return false;
  if (!isSameOrigin(request.url)) return false;

  const url = new URL(request.url);
  // Don't cache dev endpoints or opaque cross-origin.
  if (url.pathname.startsWith('/@')) return false;
  return true;
}

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (!shouldCacheRequest(req)) return;

  // Navigations: try network first for freshness, fall back to cache.
  if (req.mode === 'navigate' || (req.headers.get('accept') || '').includes('text/html')) {
    event.respondWith((async () => {
      const cache = await caches.open(APP_SHELL_CACHE);
      try {
        const res = await fetch(req);
        if (res && res.ok) cache.put(req, res.clone());
        return res;
      } catch {
        const cached = await cache.match(req);
        return cached || cache.match('/') || Response.error();
      }
    })());
    return;
  }

  // Assets/media: cache-first, update cache on miss.
  event.respondWith((async () => {
    const cache = await caches.open(RUNTIME_CACHE);
    const cached = await cache.match(req);
    if (cached) return cached;

    try {
      const res = await fetch(req);
      if (res && res.ok) cache.put(req, res.clone());
      return res;
    } catch {
      return Response.error();
    }
  })());
});
