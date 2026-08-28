/* LinkPilot service worker — offline shell + runtime asset cache.
 * Deliberately conservative: never intercepts /api or auth endpoints, and
 * serves the offline fallback only when navigation itself fails.
 */
const VERSION = 'lp-v1';
const SHELL = ['/offline', '/icon.svg', '/apple-icon.png', '/icon-192.png', '/icon-512.png'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(VERSION)
      .then((cache) => cache.addAll(SHELL))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

const isNavigation = (req) => req.mode === 'navigate';
const isApi = (url) => url.pathname.startsWith('/api') || url.pathname.startsWith('/uploads');

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  if (request.method !== 'GET') return;
  if (url.origin !== self.location.origin) return;
  if (isApi(url)) return; // never offline-cache auth/API/data

  if (isNavigation(request)) {
    // Network-first so users always get fresh app shell; fall back offline.
    event.respondWith(
      fetch(request)
        .then((res) => {
          const copy = res.clone();
          caches.open(VERSION).then((c) => c.put('/offline', copy));
          return res;
        })
        .catch(() => cacheFirst(event)),
    );
    return;
  }

  // Static assets: cache-first with network fallback.
  event.respondWith(
    caches.match(request).then(
      (hit) =>
        hit ||
        fetch(request).then((res) => {
          if (res.ok) {
            const copy = res.clone();
            caches.open(VERSION).then((c) => c.put(request, copy));
          }
          return res;
        }),
    ),
  );
});

async function cacheFirst(event) {
  const cached = await caches.match(event.request);
  if (cached) return cached;
  const offline = await caches.match('/offline');
  if (offline) return offline;
  return Response.error();
}