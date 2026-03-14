self.addEventListener('install', (event) => {
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
    // Provide a basic fetch handler to satisfy PWA install requirements
    event.respondWith(fetch(event.request).catch(() => new Response("Network error")));
});

self.addEventListener('push', function(event) {
    if (event.data) {
        try {
            const payload = event.data.json();
            event.waitUntil(
                self.registration.showNotification(payload.title, {
                    body: payload.body,
                    icon: '/vite.svg',
                    data: payload.url || '/#/alarms',
                    requireInteraction: true
                })
            );
        } catch(e) {
            console.error('Push event payload parsing error:', e);
        }
    }
});

self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
            const urlToOpen = event.notification.data || '/#/alarms';
            // If a window is already open, focus it
            if (clientList.length > 0) {
                let client = clientList[0];
                for (let i = 0; i < clientList.length; i++) {
                    if (clientList[i].focused) {
                        client = clientList[i];
                    }
                }
                client.navigate(urlToOpen);
                return client.focus();
            }
            // Otherwise open a new window
            return clients.openWindow(urlToOpen);
        })
    );
});
