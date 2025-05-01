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
    './watermark-512x512.png'
];

self.addEventListener('install', async event => {
    self.skipWaiting(); // Attiva immediatamente il nuovo SW
    event.waitUntil(
        (async () => {
            const cache = await caches.open(cacheName);
            await cache.addAll(staticAssets);
        })()
    );
});

self.addEventListener('activate', event => {
    event.waitUntil(
        (async () => {
            const cacheKeys = await caches.keys();
            await Promise.all(
                cacheKeys.map(key => {
                    if (key !== cacheName) {
                        return caches.delete(key); // Rimuove le vecchie cache
                    }
                })
            );
            self.clients.claim(); // Prende il controllo delle pagine aperte
        })()
    );
});

self.addEventListener('fetch', event => {
    const req = event.request;
    if (req.method !== 'GET') return; // Evita di mettere in cache richieste non GET
    event.respondWith(networkFirst(req));
});

async function networkFirst(req) {
    const cache = await caches.open(cacheName);
    try {
        const fresh = await fetch(req);
        if (fresh.ok && req.url.startsWith('http')) { // Only cache HTTP/HTTPS requests
            cache.put(req, fresh.clone());
        }
        return fresh;
    } catch (e) {
        const cachedResponse = await cache.match(req);
        return cachedResponse || new Response('Fallback content', {
            status: 200,
            statusText: 'OK',
            headers: { 'Content-Type': 'text/plain' }
        });
    }
}

async function cacheFirst(req) {
    const cache = await caches.open(cacheName);
    const cachedResponse = await cache.match(req);
    return cachedResponse || fetch(req);
}