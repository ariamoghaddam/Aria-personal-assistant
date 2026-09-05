const CACHE='aria-cloud-v6';
const ASSETS=['./','./index.html','./manifest.webmanifest','./icon.svg','./cloud-config.js','./cloud-sync.js'];
self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS))));
self.addEventListener('fetch',e=>e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request))));
self.addEventListener('push', event => {
  let data = {};
  try { data = event.data ? event.data.json() : {}; } catch(e) {
    data = { title: 'ARIA', body: event.data ? event.data.text() : 'یادآوری جدید' };
  }
  const options = {
    body: data.body || 'یک یادآوری داری',
    icon: './icon.svg',
    badge: './icon.svg',
    tag: data.tag || 'aria-reminder',
    renotify: true,
    data: data.url || './'
  };
  event.waitUntil(self.registration.showNotification(data.title || 'ARIA', options));
});
self.addEventListener('notificationclick', event => {
  event.notification.close();
  const url = event.notification.data || './';
  event.waitUntil(clients.matchAll({type:'window',includeUncontrolled:true}).then(list => {
    for (const client of list) if ('focus' in client) return client.focus();
    if (clients.openWindow) return clients.openWindow(url);
  }));
});
