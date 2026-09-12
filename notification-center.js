(function(){
  if(window.__ARIA_NOTIFY_V2)return;window.__ARIA_NOTIFY_V2=true;
  const cfg=window.ARIA_CLOUD||{};
  const $=id=>document.getElementById(id);
  const endpoint=(path)=>`${String(cfg.supabaseUrl||'').replace(/\/$/,'')}${path}`;

  function findToken(obj,depth=0){if(!obj||depth>6)return'';if(typeof obj==='object'){if(typeof obj.access_token==='string'&&obj.access_token.trim())return obj.access_token.trim();for(const k of Object.keys(obj)){const v=findToken(obj[k],depth+1);if(v)return v}}return''}
  function getToken(){try{const ref=new URL(cfg.supabaseUrl).hostname.split('.')[0];const keys=[`sb-${ref}-auth-token`,...Object.keys(localStorage).filter(k=>k.startsWith('sb-')&&k.includes('auth-token'))];for(const k of [...new Set(keys)]){const raw=localStorage.getItem(k);if(!raw)continue;try{const t=findToken(JSON.parse(raw));if(t)return t}catch(_){}}}catch(_){}return''}
  function deviceName(){const ua=navigator.userAgent||'';if(/iPad/.test(ua)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1))return'ARIA iPad';if(/iPhone/.test(ua))return'ARIA iPhone';return'ARIA device'}
  function standalone(){return window.matchMedia?.('(display-mode: standalone)').matches||navigator.standalone===true}
  function b64ToUint8(s){const p='='.repeat((4-s.length%4)%4);const b=atob((s+p).replace(/-/g,'+').replace(/_/g,'/'));return Uint8Array.from([...b].map(c=>c.charCodeAt(0)))}
  async function getPublicKey(){const r=await fetch(endpoint('/functions/v1/aria-notify?public_key=1'),{cache:'no-store'});const o=await r.json().catch(()=>({}));if(!r.ok||!o.publicKey)throw new Error('کلید اعلان دریافت نشد');return o.publicKey}
  async function serverCall(mode,body={}){const token=getToken();if(!token)throw new Error('اول باید وارد حساب ARIA باشی.');const r=await fetch(endpoint(`/functions/v1/aria-notify?mode=${encodeURIComponent(mode)}`),{method:'POST',headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json'},body:JSON.stringify(body),cache:'no-store'});const o=await r.json().catch(()=>({}));if(!r.ok)throw new Error(o?.detail||o?.error||'ارتباط اعلان با سرور انجام نشد.');return o}
  async function registerOnServer(sub){return serverCall('register',{device_name:deviceName(),subscription:sub.toJSON()})}
  async function remoteTest(){return serverCall('test',{})}

  async function subscribe(){
    if(!('serviceWorker'in navigator)||!('PushManager'in window)||!('Notification'in window))throw new Error('این دستگاه اعلان پوش را پشتیبانی نمی‌کند.');
    if((/iPhone|iPad/.test(navigator.userAgent||'')||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1))&&!standalone())throw new Error('برای اعلان آیفون/آیپد، ARIA را از Add to Home Screen نصب کن و از آیکن خودش بازش کن.');
    let perm=Notification.permission;if(perm==='default')perm=await Notification.requestPermission();if(perm!=='granted')throw new Error('اجازه اعلان داده نشده. از Settings آیفون/آیپد، Notifications را برای ARIA روشن کن.');
    const reg=await navigator.serviceWorker.register('./sw.js',{scope:'./',updateViaCache:'none'});await navigator.serviceWorker.ready;
    try{await reg.update()}catch(_){ }
    let sub=await reg.pushManager.getSubscription();
    if(!sub){const key=await getPublicKey();sub=await reg.pushManager.subscribe({userVisibleOnly:true,applicationServerKey:b64ToUint8(key)})}
    await registerOnServer(sub);
    localStorage.setItem('ARIA_PUSH_READY','1');
    localStorage.setItem('ARIA_PUSH_ENDPOINT',sub.endpoint||'');
    return sub;
  }
  async function subscribeAndTest(){await subscribe();const r=await remoteTest();if(!r?.sent)throw new Error('دستگاه ثبت شد ولی Push آزمایشی ارسال نشد. دوباره امتحان کن.');return true}
  async function ensureGranted(){if(!('Notification'in window)||Notification.permission!=='granted')return false;try{await subscribe();return true}catch(e){console.warn('ARIA push restore',e);localStorage.removeItem('ARIA_PUSH_READY');showRetry(e?.message||'ثبت Push کامل نشد.');return false}}
  function removePrompt(){document.getElementById('ariaNotifyPrompt')?.remove()}
  function showRetry(msg){removePrompt();const box=document.createElement('div');box.id='ariaNotifyPrompt';box.style.cssText='position:fixed;left:12px;right:12px;top:calc(12px + env(safe-area-inset-top));z-index:2147483000;background:#111a22;border:1px solid #2dd4bf;border-radius:16px;padding:12px 13px;box-shadow:0 14px 40px #0009;color:#f3f7f9;direction:rtl';box.innerHTML=`<div style="font-weight:900;margin-bottom:5px">🔔 اعلان واقعی ARIA</div><div style="font-size:12px;line-height:1.8;color:#c8d5db">${msg||'برای اینکه اعلان با برنامه بسته هم بیاد، این دستگاه باید برای Push ثبت بشه.'}</div><div style="display:flex;gap:8px;margin-top:9px"><button id="ariaNotifyEnable" class="primary" style="flex:1">ثبت و تست Push</button><button id="ariaNotifyLater" class="ghost">بعداً</button></div><div id="ariaNotifyMsg" style="font-size:11px;margin-top:7px;color:#ffbd4a"></div>`;document.body.appendChild(box);
    $('ariaNotifyEnable').onclick=async()=>{const b=$('ariaNotifyEnable'),m=$('ariaNotifyMsg');b.disabled=true;m.textContent='در حال ثبت Push واقعی…';try{await subscribeAndTest();m.style.color='#42d392';m.textContent='ثبت شد ✓ اعلان آزمایشی باید همین الان بیاد.';setTimeout(removePrompt,2500)}catch(e){m.style.color='#ffbd4a';m.textContent=e?.message||'فعال‌سازی انجام نشد.'}finally{b.disabled=false}};
    $('ariaNotifyLater').onclick=()=>removePrompt();
  }
  function boot(){if(!('Notification'in window))return;if(Notification.permission==='granted'){ensureGranted()}else if(Notification.permission==='default')setTimeout(()=>showRetry('برای یادآورها و سرزدن‌های روزانه، Push را روی همین دستگاه فعال کن.'),900)}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
  window.addEventListener('pageshow',boot);
  window.ARIA_NOTIFICATIONS={subscribe,subscribeAndTest,refresh:ensureGranted,test:remoteTest};
})();