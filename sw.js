
const cacheName = 'fortune-conf-v1';
const staticAssets = [
  './',
  './index.html',
  './app.js',
  './favicon.png',
  './manifest.json',
  './quotes.json',
  './font.css',
  './styles.css',
  './sw.js',
  './jquery-3.4.1.min.js',
  './watermark-512x512.png'
];


self.addEventListener('install', async event => {
    const cache = await caches.open(cacheName);
    await cache.addAll(staticAssets);
});


self.addEventListener('fetch', event => {
    const req = event.request;
    event.respondWith(networkFirst(req));
});


async function networkFirst(req) {
    const cache = await caches.open(cacheName);
    try {
        const fresh = await fetch(req);
        cache.put(req, fresh);
        return fresh;
    } catch (e) {
        const cachedResponse = await cache.match(req);
        return cachedResponse || new Response('Fallback content', { status: 200, statusText: 'OK' });
    }
}

async function cacheFirst(req) {
    const cache = await caches.open(cacheName);
    const cachedResponse = await cache.match(req);
    return cachedResponse || fetch(req);
}