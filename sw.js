/* SERVICE WORKER - DEVSKILL UP PWA */

const CACHE_NAME = 'devskillup-v1';
const ASSETS_TO_CACHE = [
    'index.html',
    'manifest.json'
];

// Evento de instalación: Caché de los recursos críticos iniciales
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log('PWA: Almacenando archivos estáticos en caché');
            return cache.addAll(ASSETS_TO_CACHE);
        }).then(() => self.skipWaiting())
    );
});

// Evento de activación: Limpieza de versiones viejas de caché
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cache) => {
                    if (cache !== CACHE_NAME) {
                        console.log('PWA: Limpiando caché obsoleta:', cache);
                        return caches.delete(cache);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

// Evento fetch: Responde desde el caché si está sin conexión (Offline)
self.addEventListener('fetch', (event) => {
    // Solo manejamos peticiones GET estándar para evitar problemas con APIs externas (Formspree)
    if (event.request.method !== 'GET') return;

    event.respondWith(
        caches.match(event.request).then((cachedResponse) => {
            if (cachedResponse) {
                return cachedResponse; // Devuelve del caché si está disponible
            }
            
            // Si no está en caché, lo busca en internet de forma normal
            return fetch(event.request).then((networkResponse) => {
                // Guardamos en caché las peticiones exitosas nuevas que sean de nuestro origen
                if (networkResponse.status === 200 && event.request.url.startsWith(self.location.origin)) {
                    const responseClone = networkResponse.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(event.request, responseClone);
                    });
                }
                return networkResponse;
            }).catch(() => {
                // Opcional: Aquí podrías retornar una página offline por defecto si nada funciona
            });
        })
    );
});