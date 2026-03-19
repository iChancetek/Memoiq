
const CACHE_NAME = 'memoiq-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/dashboard',
  '/memos',
  '/tasks',
  '/calendar',
  '/contacts',
  '/emails',
  '/settings'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});
