// Offline support for the Quran Study Companion.
// - App pages, scripts, styles and fonts: served from cache, refreshed in the background.
// - Surah and Juz text: same, so repeat visits are instant and opened surahs work offline.
// - Audio, login-required requests (bookmarks, memorization) and everything else: never cached.
const VERSION = 'v1';
const SHELL = `shell-${VERSION}`;
const DATA = `data-${VERSION}`;

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(SHELL).then((cache) => cache.addAll(['/index.html', '/manifest.webmanifest', '/icon-192.png']))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== SHELL && k !== DATA).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

async function staleWhileRevalidate(event, cacheName) {
  const request = event.request;
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  const network = fetch(request)
    .then((res) => {
      if (res && res.ok) cache.put(request, res.clone());
      return res;
    })
    .catch(() => null);
  if (cached) {
    event.waitUntil(network); // keep refreshing in the background
    return cached;
  }
  return (await network) || Response.error();
}

async function pageRequest(event) {
  try {
    const res = await fetch(event.request);
    if (res && res.ok) {
      const cache = await caches.open(SHELL);
      cache.put('/index.html', res.clone());
    }
    return res;
  } catch {
    const cached = await caches.match('/index.html');
    return cached || Response.error();
  }
}

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;
  if (request.headers.has('Authorization')) return; // private data: never cached
  if (request.headers.has('range') || request.destination === 'audio' || request.destination === 'video') return;

  const url = new URL(request.url);

  // Opening or reloading any page of the app
  if (request.mode === 'navigate') {
    event.respondWith(pageRequest(event));
    return;
  }

  // Surah and Juz text (on the backend's address)
  if (url.pathname.startsWith('/api/v1/surahs') || url.pathname.startsWith('/api/v1/juz')) {
    event.respondWith(staleWhileRevalidate(event, DATA));
    return;
  }

  // The app's own files and the Google fonts
  const isFontHost = url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com';
  const isOwnAsset =
    url.origin === self.location.origin && ['script', 'style', 'font', 'image'].includes(request.destination);
  if (isFontHost || isOwnAsset) {
    event.respondWith(staleWhileRevalidate(event, SHELL));
  }
});