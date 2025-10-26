const CACHE_NAME = 'swift-pos-cache-v3';
const ASSETS_TO_CACHE = [
	'./',
	'./index.html',
    './manifest.json',
    './icons/icon.svg'
];

self.addEventListener('install', event => {
	event.waitUntil(
		caches.open(CACHE_NAME).then(cache => {
            console.log('Opened cache and adding assets');
            return cache.addAll(ASSETS_TO_CACHE);
        })
	);
});

self.addEventListener('activate', event => {
	event.waitUntil(
		caches.keys().then(keys => Promise.all(
			keys.map(key => {
                if (key !== CACHE_NAME) {
                    return caches.delete(key);
                }
            })
		))
	);
    self.clients.claim();
});

self.addEventListener('fetch', event => {
    // We only want to cache GET requests.
    if (event.request.method !== 'GET') {
        return;
    }

	event.respondWith(
		caches.match(event.request).then(cachedResponse => {
			// Return the cached response if it exists.
            if (cachedResponse) {
                return cachedResponse;
            }

            // If it's not in the cache, fetch it from the network.
            return fetch(event.request).then(networkResponse => {
                // Don't cache opaque responses (e.g. from CDNs without CORS)
                if (networkResponse.type === 'opaque') {
                    return networkResponse;
                }

                // Clone the response stream.
                const responseToCache = networkResponse.clone();

                caches.open(CACHE_NAME).then(cache => {
                    cache.put(event.request, responseToCache);
                });

                return networkResponse;
            }).catch(() => {
                // If the network fetch fails (e.g., offline),
                // return a fallback page if it's a navigation request.
                if (event.request.mode === 'navigate') {
                    return caches.match('./index.html');
                }
                return new Response("You are offline", {
                    status: 503,
                    statusText: "Service Unavailable",
                    headers: new Headers({ "Content-Type": "text/plain" })
                });
            })
		})
	);
});