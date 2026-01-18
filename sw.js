const CACHE_NAME = 'neo-chronos-v3';
const ASSETS = [
    './',
    './index.html',
    './cosmic-dashboard.css',
    './cosmic-dashboard.js',
    './manifest.json',
    './icons/icon-192x192.png',
    './icons/icon-512x512.png'
];

// 1. Fase de Instalación: Guardar archivos en el nuevo búnker
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log('Neo-Chronos: Búnker v2 actualizado.');
            return cache.addAll(ASSETS);
        })
    );
});

// 2. Fase de Activación: Eliminar búnkers viejos
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cache) => {
                    if (cache !== CACHE_NAME) {
                        console.log('Neo-Chronos: Borrando búnker antiguo:', cache);
                        return caches.delete(cache);
                    }
                })
            );
        })
    );
});

// 3. Fase de Fetch: Servir desde caché o red
self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request).then((response) => {
            return response || fetch(event.request);
        })
    );
});
