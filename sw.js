const CACHE='aria-cloud-v24';

self.addEventListener('install',e=>{self.skipWaiting();});
self.addEventListener('activate',e=>{e.waitUntil(Promise.all([caches.keys().then(keys=>Promise.all(keys.map(k=>caches.delete(k)))),self.clients.claim()]));});

// No fetch handler on purpose; Safari/iOS app, AI and sync traffic go directly to network.

self.addEventListener('push',event=>{
  let data={};
  try{data=event.data?event.data.json():{}}catch(_){data={}}
  const n=data?.notification||data||{};
  const title=n.title||'ARIA';
  const options={
    body:n.body||'یک یادآوری داری',
    icon:n.icon||'./icon.svg',
    badge:n.badge||'./icon.svg',
    tag:n.tag||'aria-reminder',
    renotify:true,
    silent:false,
    data:n.navigate||n.url||data?.navigate||data?.url||'./'
  };
  event.waitUntil(self.registration.showNotification(title,options));
});

self.addEventListener('notificationclick',event=>{
  event.notification.close();
  const url=event.notification.data||'./';
  event.waitUntil(clients.matchAll({type:'window',includeUncontrolled:true}).then(list=>{
    for(const client of list){if('navigate'in client)try{client.navigate(url)}catch(_){};if('focus'in client)return client.focus();}
    if(clients.openWindow)return clients.openWindow(url);
  }));
});
