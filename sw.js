const CACHE='aria-cloud-v8';
const ASSETS=['./','./index.html','./manifest.webmanifest','./icon.svg','./cloud-config.js','./cloud-sync.js'];
self.addEventListener('install',e=>{
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)));
});
self.addEventListener('activate',e=>{
  e.waitUntil(Promise.all([
    caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))),
    self.clients.claim()
  ]));
});
self.addEventListener('fetch',e=>{
  const u=new URL(e.request.url);
  const fresh = u.pathname.endsWith('/index.html') || u.pathname.endsWith('/cloud-sync.js') || u.pathname==='/' || u.pathname==='';
  if(fresh){
    e.respondWith(fetch(e.request).then(r=>{
      const copy=r.clone();
      caches.open(CACHE).then(c=>c.put(e.request,copy));
      return r;
    }).catch(()=>caches.match(e.request)));
    return;
  }
  e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request)));
});
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
