(function(){
  if(window.__ARIA_NOTIFY_V5)return;window.__ARIA_NOTIFY_V5=true;
  const cfg=window.ARIA_CLOUD||{};
  const VAPID_PUBLIC='BBLpNEz_gYbTWB0GR3hVxTwsHNOOlplYH06E-KraiPJTO1Yz037extmkp7VENUkgD37UvDFPTIpYqidHpF6tNpw';
  const $=id=>document.getElementById(id);
  const endpoint=(path)=>`${String(cfg.supabaseUrl||'').replace(/\/$/,'')}${path}`;

  function findToken(obj,depth=0){if(!obj||depth>6)return'';if(typeof obj==='object'){if(typeof obj.access_token==='string'&&obj.access_token.trim())return obj.access_token.trim();for(const k of Object.keys(obj)){const v=findToken(obj[k],depth+1);if(v)return v}}return''}
  function getToken(){try{const ref=new URL(cfg.supabaseUrl).hostname.split('.')[0];const keys=[`sb-${ref}-auth-token`,...Object.keys(localStorage).filter(k=>k.startsWith('sb-')&&k.includes('auth-token'))];for(const k of [...new Set(keys)]){const raw=localStorage.getItem(k);if(!raw)continue;try{const t=findToken(JSON.parse(raw));if(t)return t}catch(_){}}}catch(_){}return''}
  function deviceName(){const ua=navigator.userAgent||'';if(/iPad/.test(ua)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1))return'ARIA iPad';if(/iPhone/.test(ua))return'ARIA iPhone';return'ARIA device'}
  function standalone(){return window.matchMedia?.('(display-mode: standalone)').matches||navigator.standalone===true}
  function b64ToUint8(s){const p='='.repeat((4-s.length%4)%4);const b=atob((s+p).replace(/-/g,'+').replace(/_/g,'/'));return Uint8Array.from([...b].map(c=>c.charCodeAt(0)))}
  async function getPublicKey(){try{const r=await fetch('/api/aria-notify?public_key=1',{cache:'no-store'});const o=await r.json().catch(()=>({}));if(r.ok&&o.publicKey)return o.publicKey}catch(_){}return VAPID_PUBLIC}

  async function saveSubscription(sub){
    const token=getToken();if(!token)throw new Error('اول باید وارد حساب ARIA باشی.');
    const body={owner_id:null,device_name:deviceName(),endpoint:sub.endpoint,subscription:sub.toJSON(),updated_at:new Date().toISOString()};
    const ref=new URL(cfg.supabaseUrl).hostname.split('.')[0];const sessionRaw=localStorage.getItem(`sb-${ref}-auth-token`);let owner='';
    try{const x=JSON.parse(sessionRaw||'{}');owner=x?.user?.id||x?.currentSession?.user?.id||x?.session?.user?.id||''}catch(_){}
    if(!owner){const p=JSON.parse(atob(token.split('.')[1].replace(/-/g,'+').replace(/_/g,'/')));owner=p.sub||''}
    body.owner_id=owner;
    const r=await fetch(endpoint('/rest/v1/aria_push_subscriptions?on_conflict=owner_id,endpoint'),{method:'POST',headers:{apikey:cfg.supabaseAnonKey,Authorization:`Bearer ${token}`,'Content-Type':'application/json',Prefer:'resolution=merge-duplicates,return=minimal'},body:JSON.stringify(body)});
    if(!r.ok){const t=await r.text().catch(()=>"");throw new Error('ثبت این دستگاه انجام نشد'+(t?` (${t.slice(0,90)})`:''));}
  }

  async function remoteTest(){const token=getToken();if(!token)throw new Error('توکن ورود پیدا نشد.');const r=await fetch('/api/aria-notify?mode=test',{method:'POST',headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json'},body:'{}',cache:'no-store'});const o=await r.json().catch(()=>({}));if(!r.ok)throw new Error(o?.detail||o?.error||'تست پوش ارسال نشد');return o}

  async function getPushSubscription(){
    const key=b64ToUint8(await getPublicKey());
    // iOS/iPadOS 18.4+ supports window.pushManager. This keeps the subscription
    // independent from service-worker lifetime and is the preferred Apple path.
    if(window.pushManager&&typeof window.pushManager.getSubscription==='function'&&typeof window.pushManager.subscribe==='function'){
      let sub=await window.pushManager.getSubscription();
      if(!sub)sub=await window.pushManager.subscribe({userVisibleOnly:true,applicationServerKey:key});
      return {sub,mode:'declarative'};
    }
    if(!('serviceWorker'in navigator))throw new Error('این دستگاه Push واقعی را پشتیبانی نمی‌کند.');
    const reg=await navigator.serviceWorker.register('./sw.js?v=25');await navigator.serviceWorker.ready;
    let sub=await reg.pushManager.getSubscription();
    if(!sub)sub=await reg.pushManager.subscribe({userVisibleOnly:true,applicationServerKey:key});
    return {sub,mode:'service-worker'};
  }

  async function subscribe(){
    if(!('Notification'in window))throw new Error('این دستگاه اعلان پوش را پشتیبانی نمی‌کند.');
    if(/iPhone|iPad/.test(navigator.userAgent||'')&&!standalone())throw new Error('برای Push واقعی، ARIA را به Home Screen اضافه کن و از آیکن خودش بازش کن.');
    let perm=Notification.permission;if(perm==='default')perm=await Notification.requestPermission();if(perm!=='granted')throw new Error('اجازه اعلان خاموش است. از Settings > Notifications، اعلان ARIA را روشن کن.');
    // Keep a worker as backwards-compatible fallback, but do not depend on it on modern iOS.
    if('serviceWorker'in navigator){try{await navigator.serviceWorker.register('./sw.js?v=25')}catch(_){}}
    const {sub,mode}=await getPushSubscription();
    await saveSubscription(sub);localStorage.setItem('ARIA_PUSH_READY','1');localStorage.setItem('ARIA_PUSH_MODE',mode);
    const result=await remoteTest();if(!result?.sent)throw new Error('دستگاه ثبت شد ولی Push آزمایشی ارسال نشد. دوباره تست کن.');
    updateBell(true);return true;
  }

  async function ensureGranted(){if(!('Notification'in window)||Notification.permission!=='granted')return false;try{const {sub}=await getPushSubscription();await saveSubscription(sub);localStorage.setItem('ARIA_PUSH_READY','1');updateBell(true);return true}catch(e){console.warn('ARIA push restore',e);localStorage.removeItem('ARIA_PUSH_READY');updateBell(false);return false}}

  function updateBell(ok){const b=$('ariaNotifyBell');if(!b)return;b.textContent=ok?'🔔':'🔕';b.title=ok?'اعلان‌ها فعال است':'اعلان‌ها نیاز به بررسی دارد';b.style.borderColor=ok?'#2dd4bf':'#ffb84a'}
  function makeBell(){if($('ariaNotifyBell'))return;const b=document.createElement('button');b.id='ariaNotifyBell';b.type='button';b.textContent=localStorage.getItem('ARIA_PUSH_READY')==='1'?'🔔':'🔕';b.setAttribute('aria-label','تنظیمات اعلان‌های ARIA');b.style.cssText='position:fixed;right:14px;bottom:calc(138px + env(safe-area-inset-bottom));z-index:2147482990;width:54px;height:54px;border-radius:18px;border:2px solid #2dd4bf;background:#101820;color:#fff;font-size:23px;box-shadow:0 10px 28px rgba(0,0,0,.42);display:block!important;visibility:visible!important;opacity:1!important';b.onclick=()=>makePrompt(true);(document.body||document.documentElement).appendChild(b)}
  function removePrompt(){document.getElementById('ariaNotifyPrompt')?.remove()}
  function statusText(){if(!('Notification'in window))return'اعلان روی این دستگاه پشتیبانی نمی‌شود.';if(/iPhone|iPad/.test(navigator.userAgent||'')&&!standalone())return'برای Push واقعی، ARIA را به Home Screen اضافه کن و از آیکن خودش بازش کن.';if(Notification.permission==='denied')return'اجازه اعلان در تنظیمات دستگاه خاموش است.';if(localStorage.getItem('ARIA_PUSH_READY')==='1')return'اعلان روی این دستگاه ثبت شده؛ می‌توانی دوباره تستش کنی.';return'اعلان هنوز روی این دستگاه کامل ثبت نشده.'}
  function makePrompt(force=false,err=''){if($('ariaNotifyPrompt'))return;if(!force&&localStorage.getItem('ARIA_PUSH_READY')==='1')return;const box=document.createElement('div');box.id='ariaNotifyPrompt';box.style.cssText='position:fixed;left:12px;right:12px;top:calc(12px + env(safe-area-inset-top));z-index:2147483000;background:#111a22;border:1px solid #2dd4bf;border-radius:16px;padding:12px 13px;box-shadow:0 14px 40px #0009;color:#f3f7f9;direction:rtl';box.innerHTML=`<div style="font-weight:900;margin-bottom:5px">🔔 اعلان‌های ARIA</div><div style="font-size:12px;line-height:1.8;color:#c8d5db">${statusText()}</div><div style="display:flex;gap:8px;margin-top:9px"><button id="ariaNotifyEnable" class="primary" style="flex:1">ثبت و تست Push</button><button id="ariaNotifyLater" class="ghost">بستن</button></div><div id="ariaNotifyMsg" style="font-size:11px;margin-top:7px;color:#ffbd4a">${err||''}</div>`;document.body.appendChild(box);$('ariaNotifyEnable').onclick=async()=>{const b=$('ariaNotifyEnable'),m=$('ariaNotifyMsg');b.disabled=true;m.textContent='در حال ثبت و تست اعلان…';try{await subscribe();m.style.color='#42d392';m.textContent='Push واقعی ثبت شد ✓ حالا ARIA را کامل ببند و تست کن.';setTimeout(removePrompt,2600)}catch(e){localStorage.removeItem('ARIA_PUSH_READY');updateBell(false);m.style.color='#ffbd4a';m.textContent=e?.message||'فعال‌سازی انجام نشد.'}finally{b.disabled=false}};$('ariaNotifyLater').onclick=removePrompt}
  function boot(){makeBell();if(!('Notification'in window))return;if(Notification.permission==='granted'){if(localStorage.getItem('ARIA_PUSH_READY')==='1')ensureGranted();else setTimeout(()=>makePrompt(true),600)}else if(Notification.permission==='default')setTimeout(()=>makePrompt(true),700);else updateBell(false)}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();window.addEventListener('pageshow',boot);window.ARIA_NOTIFICATIONS={subscribe,refresh:ensureGranted,test:remoteTest,open:()=>makePrompt(true)};
})();