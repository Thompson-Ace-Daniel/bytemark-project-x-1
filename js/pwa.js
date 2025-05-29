// pwa.js

if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        registerServiceWorker();
    });
}

function registerServiceWorker() {
    navigator.serviceWorker.register('/service-worker.js')
        .then(registration => {
            console.log('[PWA] Service Worker registration successful:', registration);

            // Listen for updates to the Service Worker.
            registration.onupdatefound = () => {
                const installingWorker = registration.installing;
                if (installingWorker) {
                    console.log('[PWA] New Service Worker found, installing...');
                    installingWorker.onstatechange = () => {
                        switch (installingWorker.state) {
                            case 'installed':
                                if (navigator.serviceWorker.controller) {
                                    // New update available
                                    console.log('[PWA] New content is available; please refresh.');
                                    if (registration.waiting) {
                                        promptUserToRefresh(registration);
                                    }
                                } else {
                                    // First install
                                    console.log('[PWA] Content is cached for offline use.');
                                }
                                break;
                            case 'activating':
                                console.log('[PWA] Activating new Service Worker...');
                                break;
                            case 'activated':
                                console.log('[PWA] Service Worker activated.');
                                break;
                            case 'redundant':
                                console.log('[PWA] Service Worker became redundant.');
                                break;
                            default:
                                // Other states: 'installing', 'installed'
                                break;
                        }
                    };
                }
            };

            // Check if there's an updated SW waiting to activate
            if (registration.waiting) {
                promptUserToRefresh(registration);
            }

            // Listen for controlling SW changing (when the new SW activates)
            navigator.serviceWorker.addEventListener('controllerchange', () => {
                console.log('[PWA] Controller changed, reloading page...');
                window.location.reload();
            });
        })
        .catch(error => {
            console.error('[PWA] Service Worker registration failed:', error);
        });
}

function promptUserToRefresh(registration) {
    const userConfirmed = window.confirm('A new version is available. Reload to update?');
    if (userConfirmed && registration.waiting) {
        // Send skipWaiting message to the waiting SW
        registration.waiting.postMessage({ type: 'SKIP_WAITING' });
    }
}

// Listen for messages from the Service Worker
navigator.serviceWorker && navigator.serviceWorker.addEventListener('message', event => {
    if (event.data && event.data.type === 'RELOAD_PAGE') {
        window.location.reload();
    }
});