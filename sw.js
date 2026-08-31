const CACHE_NAME = "minhas-paginas-v4";
const BASE = "/pages/";

const FILES_TO_CACHE = [
    BASE,
    BASE + "index.html",
    BASE + "manifest.webmanifest"
];

self.addEventListener("install", event => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => {
            return cache.addAll(FILES_TO_CACHE);
        })
    );

    self.skipWaiting();
});

self.addEventListener("activate", event => {
    event.waitUntil(
        caches.keys().then(keys => {
            return Promise.all(
                keys
                    .filter(key => key !== CACHE_NAME)
                    .map(key => caches.delete(key))
            );
        })
    );

    self.clients.claim();
});

self.addEventListener("fetch", event => {
    if (event.request.method !== "GET") return;

    const url = new URL(event.request.url);

    if (url.origin !== self.location.origin) return;
    if (!url.pathname.startsWith(BASE)) return;

    // Ícones: sempre buscar da rede
    if (url.pathname.startsWith(BASE + "icons/")) {
        event.respondWith(fetch(event.request));
        return;
    }

    // HTML: REDE PRIMEIRO
    if (
        event.request.destination === "document" ||
        url.pathname.endsWith(".html") ||
        url.pathname === BASE
    ) {
        event.respondWith(
            fetch(event.request)
                .then(response => {

                    if (response && response.status === 200) {
                        const responseClone = response.clone();

                        caches.open(CACHE_NAME).then(cache => {
                            cache.put(event.request, responseClone);
                        });
                    }

                    return response;
                })
                .catch(() => {
                    return caches.match(event.request)
                        .then(cachedResponse => {
                            return cachedResponse || caches.match(BASE);
                        });
                })
        );

        return;
    }

    // Outros arquivos: cache primeiro
    event.respondWith(
        caches.match(event.request).then(cachedResponse => {

            if (cachedResponse) {
                return cachedResponse;
            }

            return fetch(event.request)
                .then(response => {

                    if (
                        !response ||
                        response.status !== 200 ||
                        response.type !== "basic"
                    ) {
                        return response;
                    }

                    const responseClone = response.clone();

                    caches.open(CACHE_NAME).then(cache => {
                        cache.put(event.request, responseClone);
                    });

                    return response;
                });
        })
    );
});
