const CACHE='aria-cloud-v26';
self.addEventListener('install',e=>{self.skipWaiting();});
self.addEventListener('activate',e=>{e.waitUntil(Promise.all([caches.keys().then(keys=>Promise.all(keys.map(k=>caches.delete(k)))),self.clients.claim()]));});
self.addEventListener('push',event=>{
  let data={};
  try{data=event.data?event.data.json():{}}catch(_){data={title:'ARIA',body:event.data?event.data.text():'یادآوری جدید'}}
  const title=data.title||'ARIA';
  const options={body:data.body||'یک یادآوری داری',icon:'./icon.svg',badge:'./icon.svg',tag:data.tag||'aria-reminder',renotify:true,silent:false,data:data.url||'./'};
  event.waitUntil(self.registration.showNotification(title,options));
});
self.addEventListener('notificationclick',event=>{
  event.notification.close();const url=event.notification.data||'./';
  event.waitUntil(clients.matchAll({type:'window',includeUncontrolled:true}).then(list=>{for(const client of list){if('focus'in client)return client.focus()}if(clients.openWindow)return clients.openWindow(url)}));
});