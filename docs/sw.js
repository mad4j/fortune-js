const cacheName = 'fortune-conf-v1';
const staticAssets = [
  './',
  './index.html',
  './app.js',
  './favicon.png',
  './manifest.json',
  './quotes.js',
  './styles.css',
  './sw.js',
  './watermark-512x512.png'
];


self.addEventListener('install', async event => {
    const cache = await caches.open(cacheName);
    await cache.addAll(staticAssets);
});

self.addEventListener('fetch', event => {
    const req = event.request;
    event.respondWith(cacheFirst(req));
});

async function cacheFirst(req) {
    const cache = await caches.open(cacheName);
    const cachedResponse = await cache.match(req);
    return cachedResponse || fetch(req);
}