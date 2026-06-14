const CACHE_NAME = 'trackbook-v1';
const STATIC_ASSETS = ['/', '/index.html'];
const IS_LOCALHOST = ['localhost', '127.0.0.1', '::1'].includes(self.location.hostname);

if (IS_LOCALHOST) {
  self.addEventListener('install', () => {
    self.skipWaiting();
  });

  self.addEventListener('activate', (event) => {
    event.waitUntil((async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((key) => key.startsWith('trackbook-'))
          .map((key) => caches.delete(key)),
      );

      await self.registration.unregister();

      const clients = await self.clients.matchAll({ type: 'window' });
      await Promise.all(clients.map((client) => client.navigate(client.url)));
    })());
  });
} else {
  self.addEventListener('install', (event) => {
    event.waitUntil(
      caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS)),
    );
    self.skipWaiting();
  });

  self.addEventListener('activate', (event) => {
    event.waitUntil(
      caches.keys().then((keys) =>
        Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))),
      ),
    );
    self.clients.claim();
  });

  self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    if (request.method !== 'GET') return;
    if (url.hostname.includes('firebase') || url.hostname.includes('google')) return;
    if (url.protocol === 'chrome-extension:') return;

    const allowedOrigins = [self.location.origin];
    if (!allowedOrigins.some((origin) => url.href.startsWith(origin))) return;

    event.respondWith(
      caches.match(request).then((cached) => {
        const fetchPromise = fetch(request)
          .then((response) => {
            if (response && response.status === 200 && response.type === 'basic') {
              const clone = response.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
            }
            return response;
          })
          .catch(() => cached);

        return cached || fetchPromise;
      }),
    );
  });
}
