const CACHE_NAME = 'stroke-cache-v3';
const ASSET_PATHS = [
  './',
  'index.html',
  'css/style.css',
  'js/app.js',
  'locales/en.json',
  'locales/lt.json',
  'manifest.json',
  'icons/activation.svg',
  'icons/analytics.svg',
  'icons/arrival.svg',
  'icons/date-picker.svg',
  'icons/decision.svg',
  'icons/menu.svg',
  'icons/nihss.svg',
  'icons/settings.svg',
  'icons/sun.svg',
  'icons/moon.svg',
  'icons/summary.svg',
  'icons/thrombolysis.svg',
  'icons/warning.svg',
];

const ASSETS = ASSET_PATHS.map((path) =>
  new URL(path, self.registration.scope).toString()
);

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))
    )
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') {
    return;
  }

  const url = new URL(event.request.url);

  if (url.origin !== self.location.origin) {
    return;
  }

  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() =>
        caches.match(new URL('index.html', self.registration.scope))
      )
    );
    return;
  }

  const allowedPaths = ['css/', 'js/', 'locales/', 'icons/', 'manifest.json'].map(
    (path) => new URL(path, self.registration.scope).pathname
  );
  if (!allowedPaths.some((path) => url.pathname.startsWith(path))) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) {
        return cached;
      }
      return fetch(event.request).then((response) => {
        if (!response || response.status !== 200 || response.type === 'opaque') {
          return response;
        }
        const responseClone = response.clone();
        caches
          .open(CACHE_NAME)
          .then((cache) => cache.put(event.request, responseClone));
        return response;
      });
    })
  );
});

