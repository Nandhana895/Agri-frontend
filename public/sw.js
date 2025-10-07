/* Basic service worker to enable notification display */
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('push', (event) => {
  try {
    const data = event.data ? event.data.json() : {};
    const title = data.title || 'AgriSense';
    const body = data.body || 'New message';
    event.waitUntil(self.registration.showNotification(title, { body }));
  } catch (e) {
    event.waitUntil(self.registration.showNotification('AgriSense', { body: 'New notification' }));
  }
});


