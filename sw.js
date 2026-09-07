const CACHE='aria-cloud-v15';
const CAL_CACHE='aria-calendar-v1';
const ASSETS=['./','./index.html','./manifest.webmanifest','./icon.svg','./cloud-config.js','./cloud-sync.js'];

self.addEventListener('install',e=>{
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)));
});

self.addEventListener('activate',e=>{
  e.waitUntil(Promise.all([
    caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE&&k!==CAL_CACHE).map(k=>caches.delete(k)))),
    self.clients.claim()
  ]));
});

async function fetchWithRetry(request, tries=3){
  let lastErr;
  for(let i=0;i<tries;i++){
    try{
      const r=await fetch(request);
      if(r && r.ok) return r;
      lastErr=new Error('HTTP '+(r?.status||'unknown'));
    }catch(err){lastErr=err}
    if(i<tries-1) await new Promise(res=>setTimeout(res,500*(i+1)));
  }
  throw lastErr||new Error('fetch failed');
}

self.addEventListener('fetch',e=>{
  const u=new URL(e.request.url);
  if(u.hostname==='persian-calendar-api.sajjadth.workers.dev'){
    e.respondWith((async()=>{
      const cache=await caches.open(CAL_CACHE);
      const key=new Request(e.request.url,{method:'GET'});
      try{
        const r=await fetchWithRetry(e.request,3);
        await cache.put(key,r.clone());
        return r;
      }catch(_){
        const cached=await cache.match(key);
        if(cached) return cached;
        return new Response(JSON.stringify({days:[]}),{status:200,headers:{'Content-Type':'application/json'}});
      }
    })());
    return;
  }
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
  try { data = event.data ? event.data.json() : {}; } catch(e) { data = { title: 'ARIA', body: event.data ? event.data.text() : 'یادآوری جدید' }; }
  const options = {body:data.body||'یک یادآوری داری',icon:'./icon.svg',badge:'./icon.svg',tag:data.tag||'aria-reminder',renotify:true,data:data.url||'./'};
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
