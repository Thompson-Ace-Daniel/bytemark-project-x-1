// service-worker.js

const CACHE_VERSION = 'v2';
const CACHE_NAME = `project-x1-static-${CACHE_VERSION}`;
const ASSETS_TO_CACHE = [
    '/index.html',
    '/offline.html',
    '/css/style.css',
    '/js/app.js',
    'signup.html',
    'login.html',
    'dashboard.html',
    'test.html',
    'result.html',
    'admin.html',
    'css/themes.css',
    'css/animations.css',
    'css/responsive.css',
    'js/utils.js',
    'js/admin.js',
    'js/dashboard.js',
    'js/auth.js',
    'js/test.js',
    'js/result.js',

];

// Log helper
const log = (...args) => console.log('[SW]', ...args);

// Install event: cache essential assets
self.addEventListener('install', event => {
    log('Install event');
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => {
            log('Caching essential assets');
            return cache.addAll(ASSETS_TO_CACHE);
        })
    );
    self.skipWaiting();
});

// Activate event: clean up old caches
self.addEventListener('activate', event => {
    log('Activate event');
    event.waitUntil(
        caches.keys().then(keys =>
            Promise.all(
                keys
                    .filter(key => key !== CACHE_NAME)
                    .map(key => {
                        log('Deleting old cache:', key);
                        return caches.delete(key);
                    })
            )
        )
    );
    self.clients.claim();
});

// Fetch event: handle requests
self.addEventListener('fetch', event => {
    const request = event.request;
    const url = new URL(request.url);

    // API requests: cache-first, fallback to offline page
    if (url.pathname.startsWith('/api/')) {
        event.respondWith(
            caches.match(request).then(response => {
                if (response) {
                    log('Serving API from cache:', url.pathname);
                    return response;
                }
                return fetch(request)
                    .then(networkResponse => {
                        // Only cache successful responses
                        if (networkResponse && networkResponse.status === 200) {
                            return caches.open(CACHE_NAME).then(cache => {
                                cache.put(request, networkResponse.clone());
                                log('Fetched & cached API:', url.pathname);
                                return networkResponse;
                            });
                        }
                        return networkResponse;
                    })
                    .catch(() => {
                        log('API fetch failed, serving offline page');
                        return caches.match('/offline.html');
                    });
            })
        );
        return;
    }

    // Images: cache on demand, fallback to offline page
    if (url.pathname.startsWith('/images/')) {
        event.respondWith(
            caches.open(CACHE_NAME).then(cache =>
                cache.match(request).then(response => {
                    if (response) {
                        log('Serving image from cache:', url.pathname);
                        return response;
                    }
                    return fetch(request)
                        .then(networkResponse => {
                            if (networkResponse && networkResponse.status === 200) {
                                cache.put(request, networkResponse.clone());
                                log('Fetched & cached image:', url.pathname);
                            }
                            return networkResponse;
                        })
                        .catch(() => {
                            log('Image fetch failed, serving offline page');
                            return caches.match('/offline.html');
                        });
                })
            )
        );
        return;
    }

    // Static assets: cache-first, fallback to offline page
    if (ASSETS_TO_CACHE.includes(url.pathname)) {
        event.respondWith(
            caches.match(request).then(response => {
                if (response) {
                    log('Serving asset from cache:', url.pathname);
                    return response;
                }
                return fetch(request)
                    .then(networkResponse => {
                        if (networkResponse && networkResponse.status === 200) {
                            return caches.open(CACHE_NAME).then(cache => {
                                cache.put(request, networkResponse.clone());
                                log('Fetched & cached asset:', url.pathname);
                                return networkResponse;
                            });
                        }
                        return networkResponse;
                    })
                    .catch(() => {
                        log('Asset fetch failed, serving offline page');
                        return caches.match('/offline.html');
                    });
            })
        );
        return;
    }

    // Other requests: network-first, fallback to offline page
    event.respondWith(
        fetch(request)
            .catch(() => {
                log('Network fetch failed, serving offline page');
                return caches.match('/offline.html');
            })
    );
});