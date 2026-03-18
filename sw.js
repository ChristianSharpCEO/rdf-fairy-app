/* ============================================
   RDF: Fairy-Led St. John's Passport
   sw.js — Service Worker (Phase 1)
   
   Strategy: Cache-first for app shell,
   network-first for weather API data.
   ============================================ */

const CACHE_NAME = 'rdf-passport-v1';

// App shell files to pre-cache on install
const APP_SHELL = [
  './',
  './index.html',
  './styles.css',
  './app.js',
  './manifest.json',
];

// Google Fonts to cache on first use
const FONT_URLS = [
  'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400;1,600&display=swap',
];

// ─── INSTALL: Pre-cache app shell ────────────
self.addEventListener('install', (event) => {
  console.log('[RDF SW] Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[RDF SW] Caching app shell');
        return cache.addAll(APP_SHELL);
      })
      .then(() => self.skipWaiting())
  );
});

// ─── ACTIVATE: Clean up old caches ───────────
self.addEventListener('activate', (event) => {
  console.log('[RDF SW] Activating...');
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => {
            console.log('[RDF SW] Removing old cache:', key);
            return caches.delete(key);
          })
      );
    }).then(() => self.clients.claim())
  );
});

// ─── FETCH: Routing strategy ─────────────────
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Network-first for weather API calls (always want fresh data)
  if (url.hostname.includes('openweathermap.org')) {
    event.respondWith(networkFirst(request));
    return;
  }

  // Cache-first for Google Fonts
  if (url.hostname.includes('fonts.googleapis.com') || url.hostname.includes('fonts.gstatic.com')) {
    event.respondWith(cacheFirst(request));
    return;
  }

  // Cache-first for app shell (same-origin requests)
  if (url.origin === self.location.origin) {
    event.respondWith(cacheFirst(request));
    return;
  }

  // Default: network with cache fallback
  event.respondWith(networkFirst(request));
});

// ─── STRATEGIES ──────────────────────────────

// Try cache first, fall back to network (and cache the response)
async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch (err) {
    // If both cache and network fail, return a basic offline page
    return new Response('Offline — the fairies are resting.', {
      status: 503,
      headers: { 'Content-Type': 'text/plain' },
    });
  }
}

// Try network first, fall back to cache
async function networkFirst(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch (err) {
    const cached = await caches.match(request);
    if (cached) return cached;

    return new Response(JSON.stringify({ error: 'Offline' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
