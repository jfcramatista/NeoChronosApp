const CACHE_NAME = 'neo-chronos-v1';
const ASSETS = [
    './',
    './index.html',
    './cosmic-dashboard.css',
    './cosmic-dashboard.js',
    './manifest.json',
    './icons/icon-192x192.png',
    './icons/icon-512x512.png'
];

// 1. Fase de Instalación: Guardar archivos en la caché
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log('Neo-Chronos: Archivos almacenados en búnker (caché).');
            return cache.addAll(ASSETS);
        })
    );
});

// 2. Fase de Fetch: Servir desde caché si no hay red
self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request).then((response) => {
            return response || fetch(event.request);
        })
    );
});
