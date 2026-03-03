const CACHE_NAME = 'NormalizaCoherente.v1.0.0_03-03-2026_pwa-offline';

// Precache: todo lo necesario para que la app funcione 100% offline
const ASSETS = [
  './index.html',
  './styles.css',
  './app.js',
  './i18n.js',
  './manifest.webmanifest',

  // Imágenes usadas por la UI / PWA
  './assets/img/logo.png',
  './assets/img/normalizacoherente180.png',
  './assets/img/normalizacoherente192.png',
  './assets/img/normalizacoherente512.png',

  // Idiomas (cambiar idioma también offline)
  './lang/es.json',
  './lang/en.json',
  './lang/pt-br.json',
  './lang/fr.json',
  './lang/de.json',
  './lang/it.json',
  './lang/ko.json',
  './lang/zh.json',
  './lang/ja.json',
  './lang/ru.json',
  './lang/hi.json',
  './lang/cat.json'
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    // Si algo de ASSETS da 404 aquí, el SW no instala (y eso es bueno: te avisa que falta algo).
    await cache.addAll(ASSETS);
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)));
    await self.clients.claim();
  })());
});

async function matchCache(request) {
  const cache = await caches.open(CACHE_NAME);
  // ignoreSearch para ser robustos con ?v=, ?source=pwa, etc.
  return cache.match(request, { ignoreSearch: true });
}

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  // Solo mismo origen (no tocar CDN externos, etc.)
  if (url.origin !== self.location.origin) return;

  // === Navegación (documentos) => App Shell offline-first ===
  if (req.mode === 'navigate' || req.destination === 'document') {
    event.respondWith((async () => {
      // 1) cache del propio request (por si se cacheó con ese URL)
      const cached = await matchCache(req);
      if (cached) return cached;

      // 2) app-shell: index.html siempre (ideal para PWA instalada)
      const shell = await matchCache('./index.html');
      if (shell) return shell;

      // 3) último recurso: red
      try {
        const res = await fetch(req);
        if (res && res.ok) {
          const cache = await caches.open(CACHE_NAME);
          cache.put(req, res.clone());
        }
        return res;
      } catch {
        return new Response('Offline', {
          status: 503,
          headers: { 'Content-Type': 'text/plain; charset=utf-8' }
        });
      }
    })());
    return;
  }

  // === Recursos estáticos => Cache-first (sin tocar red si ya existe) ===
  event.respondWith((async () => {
    const cached = await matchCache(req);
    if (cached) return cached;

    try {
      const res = await fetch(req);
      if (res && res.ok) {
        const cache = await caches.open(CACHE_NAME);
        cache.put(req, res.clone());
      }
      return res;
    } catch {
      return new Response('Offline', {
        status: 503,
        headers: { 'Content-Type': 'text/plain; charset=utf-8' }
      });
    }
  })());
});