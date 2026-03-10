// Gaucho Lax — Service Worker
// Strategies:
//   App shell / static JS+CSS  → CacheFirst (versioned by cache name)
//   Page HTML                  → NetworkFirst with cache fallback
//   /api/*                     → NetworkFirst, 10s timeout, 1h TTL
//   Images / fonts             → CacheFirst, 30d TTL

const SHELL_CACHE  = 'gaucho-shell-v1';
const PAGE_CACHE   = 'gaucho-pages-v1';
const API_CACHE    = 'gaucho-api-v1';
const ASSET_CACHE  = 'gaucho-assets-v1';

const APP_SHELL = [
  '/',
  '/schedule',
  '/stats',
  '/leaders',
  '/map',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
];

// ─── Install: precache app shell ─────────────────────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE).then((cache) => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

// ─── Activate: prune old caches ──────────────────────────────────────────────
self.addEventListener('activate', (event) => {
  const current = new Set([SHELL_CACHE, PAGE_CACHE, API_CACHE, ASSET_CACHE]);
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => !current.has(k)).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// ─── Fetch ────────────────────────────────────────────────────────────────────
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Only handle same-origin requests + GET
  if (request.method !== 'GET' || url.origin !== self.location.origin) return;

  // /api/* → NetworkFirst, fall back to stale cache
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(networkFirst(request, API_CACHE, 10_000));
    return;
  }

  // Static assets (_next/static, images, fonts) → CacheFirst
  if (
    url.pathname.startsWith('/_next/static/') ||
    /\.(png|jpg|jpeg|svg|gif|webp|ico|woff2?|ttf)$/i.test(url.pathname)
  ) {
    event.respondWith(cacheFirst(request, ASSET_CACHE));
    return;
  }

  // Navigation (HTML pages) → NetworkFirst with page cache
  if (request.mode === 'navigate') {
    event.respondWith(networkFirst(request, PAGE_CACHE, 5_000));
    return;
  }
});

// ─── Strategy helpers ─────────────────────────────────────────────────────────

async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  if (cached) return cached;
  try {
    const response = await fetch(request);
    if (response.ok) cache.put(request, response.clone());
    return response;
  } catch {
    return new Response('Offline', { status: 503 });
  }
}

async function networkFirst(request, cacheName, timeoutMs) {
  const cache = await caches.open(cacheName);
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    const response = await fetch(request, { signal: controller.signal });
    clearTimeout(timer);
    if (response.ok) cache.put(request, response.clone());
    return response;
  } catch {
    const cached = await cache.match(request);
    if (cached) return cached;
    // Last resort for navigation: return cached root
    if (request.mode === 'navigate') {
      const root = await cache.match('/');
      if (root) return root;
    }
    return new Response(JSON.stringify({ error: 'Offline' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
