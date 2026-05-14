const CACHE_NAME = "soundinsee-v1";

const archivosCache = [
    "./",
    "./index.html",
    "./style.css",
    "./app.js",
    "./manifest.json"
];

// install

self.addEventListener("install", (event) => {

    console.log("SW instalado");

    event.waitUntil(

        caches.open(CACHE_NAME)

        .then((cache) => {

            return cache.addAll(
                archivosCache
            );
        })
    );

    self.skipWaiting();
});

// activate

self.addEventListener("activate", (event) => {

    console.log("SW activado");

    event.waitUntil(

        caches.keys()

        .then((keys) => {

            return Promise.all(

                keys.map((key) => {

                    if (
                        key !== CACHE_NAME
                    ) {

                        return caches.delete(
                            key
                        );
                    }
                })
            );
        })
    );

    self.clients.claim();
});

// fetch

self.addEventListener("fetch", (event) => {

    event.respondWith(

        caches.match(event.request)

        .then((response) => {

            return (
                response ||
                fetch(event.request)
            );
        })
    );
});