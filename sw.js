/* ============================================
   RDF: Fairy-Led St. John's Passport
   sw.js — Service Worker (Phase 1)
   
   Caching Strategy:
   ─────────────────
   • INSTALL:  Pre-cache the app shell (HTML, CSS, JS)
   • FETCH:    Cache-first for app shell & fonts
               Network-first for weather API
   • ACTIVATE: Purge stale caches from previous versions
   
   Bump CACHE_VERSION when deploying updates.
   ============================================ */

const CACHE_VERSION = 'rdf-v11';

/* ─── APP SHELL ──────────────────────────────── */
// Files that must be cached for the app to work offline.
const APP_SHELL = [
  './',
  './index.html',
  './styles.css',
  './app.js',
  './manifest.json',
];


/* ─── INSTALL: Pre-cache app shell ───────────── */
self.addEventListener('install', (event) => {
  console.log(`[RDF SW] Installing ${CACHE_VERSION}...`);

  event.waitUntil(
    caches.open(CACHE_VERSION)
      .then(cache => {
        console.log('[RDF SW] Caching app shell');
        return cache.addAll(APP_SHELL);
      })
      // Skip waiting so the new SW activates immediately
      .then(() => self.skipWaiting())
  );
});


/* ─── ACTIVATE: Clean old caches ─────────────── */
self.addEventListener('activate', (event) => {
  console.log(`[RDF SW] Activating ${CACHE_VERSION}...`);

  event.waitUntil(
    caches.keys()
      .then(keys =>
        Promise.all(
          keys
            .filter(key => key !== CACHE_VERSION)
            .map(key => {
              console.log('[RDF SW] Purging old cache:', key);
              return caches.delete(key);
            })
        )
      )
      // Claim all open clients so the new SW takes effect immediately
      .then(() => self.clients.claim())
  );
});


/* ─── FETCH: Route requests to the right strategy ── */
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // ── Weather API (Open-Meteo): Network-first ──
  // Always try to get fresh data; fall back to cached if offline.
  if (url.hostname.includes('open-meteo.com')) {
    event.respondWith(networkFirst(request));
    return;
  }

  // ── Google Sheets CSV (all live data tabs): Network-first ──
  // Fairy Hunt, Directory, Lore, Pastimes — always want fresh data.
  if (url.hostname.includes('docs.google.com')) {
    event.respondWith(networkFirst(request));
    return;
  }

  // ── Google Fonts: Cache-first ──
  // Fonts rarely change; cache them aggressively.
  if (
    url.hostname.includes('fonts.googleapis.com') ||
    url.hostname.includes('fonts.gstatic.com')
  ) {
    event.respondWith(cacheFirst(request));
    return;
  }

  // ── App shell (same origin): Cache-first ──
  if (url.origin === self.location.origin) {
    event.respondWith(cacheFirst(request));
    return;
  }

  // ── Everything else: Network with cache fallback ──
  event.respondWith(networkFirst(request));
});


/* ═══════════════════════════════════════════════
   CACHING STRATEGIES
   ═══════════════════════════════════════════════ */

/**
 * Cache-first: Return cached response if available,
 * otherwise fetch from network and cache the result.
 */
async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_VERSION);
      cache.put(request, response.clone());
    }
    return response;
  } catch (err) {
    // Both cache and network failed — return offline fallback
    return offlineResponse();
  }
}

/**
 * Network-first: Try the network for fresh data,
 * fall back to cache if offline.
 */
async function networkFirst(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_VERSION);
      cache.put(request, response.clone());
    }
    return response;
  } catch (err) {
    const cached = await caches.match(request);
    if (cached) return cached;
    return offlineResponse();
  }
}

/**
 * Returns a simple offline response when all else fails.
 */
function offlineResponse() {
  return new Response(
    'Offline — the fairies are resting. Try again when you have signal.',
    {
      status: 503,
      headers: { 'Content-Type': 'text/plain' },
    }
  );
}


/* ─── PUSH EVENT (Phase 2 Placeholder) ────────── */
// In production, a push service (e.g. Firebase Cloud Messaging)
// would send weather-triggered push events to this worker.
//
// self.addEventListener('push', (event) => {
//   const data = event.data ? event.data.json() : {};
//   event.waitUntil(
//     self.registration.showNotification(data.title || '🧚 RDF Alert', {
//       body: data.body || 'The fairies are waiting!',
//       icon: './icons/icon-192.png',
//       badge: './icons/badge-72.png',
//       tag: 'rdf-push',
//     })
//   );
// });
//
// self.addEventListener('notificationclick', (event) => {
//   event.notification.close();
//   event.waitUntil(
//     clients.openWindow('/')
//   );
// });
