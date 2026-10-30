// Service worker FootHub, écrit à la main (aucun plugin PWA)
const CACHE_VERSION = 'foothub-v1';
const PRECACHE = ['/', '/offline', '/manifest.json', '/icons/icon-192.png', '/icons/icon-512.png', '/icons/icon-512-maskable.png'];

// install : pré-cache de l'App Shell et de la page hors ligne
self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_VERSION).then((cache) => cache.addAll(PRECACHE)));
  self.skipWaiting();
});

// activate : suppression des anciens caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_VERSION).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);

  // Non géré : requêtes non-GET (Server Actions en POST) et authentification
  if (request.method !== 'GET') return;
  if (url.pathname.startsWith('/api/auth')) return;

  // Navigations : Network First, puis la page en cache, sinon /offline
  if (request.mode === 'navigate') {
    event.respondWith(networkFirst(request));
    return;
  }

  // Fichiers statiques : Cache First
  const isStatic =
    url.pathname.startsWith('/_next/static/') || url.pathname.startsWith('/icons/') || request.destination === 'image';
  if (isStatic) {
    event.respondWith(cacheFirst(request));
  }
});

async function networkFirst(request) {
  const cache = await caches.open(CACHE_VERSION);
  try {
    const response = await fetch(request);
    if (response.ok) cache.put(request, response.clone());
    return response;
  } catch {
    return (await cache.match(request)) || (await cache.match('/offline'));
  }
}

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  try {
    const response = await fetch(request);
    if (response.ok || response.type === 'opaque') {
      const cache = await caches.open(CACHE_VERSION);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    return new Response('', { status: 504 });
  }
}
