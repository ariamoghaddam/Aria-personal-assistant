(function(){
  if(window.__ARIA_NOTIFY_V1)return;window.__ARIA_NOTIFY_V1=true;
  const cfg=window.ARIA_CLOUD||{};
  const $=id=>document.getElementById(id);
  const endpoint=(path)=>`${String(cfg.supabaseUrl||'').replace(/\/$/,'')}${path}`;

  function findToken(obj,depth=0){if(!obj||depth>6)return'';if(typeof obj==='object'){if(typeof obj.access_token==='string'&&obj.access_token.trim())return obj.access_token.trim();for(const k of Object.keys(obj)){const v=findToken(obj[k],depth+1);if(v)return v}}return''}
  function getToken(){try{const ref=new URL(cfg.supabaseUrl).hostname.split('.')[0];const keys=[`sb-${ref}-auth-token`,...Object.keys(localStorage).filter(k=>k.startsWith('sb-')&&k.includes('auth-token'))];for(const k of [...new Set(keys)]){const raw=localStorage.getItem(k);if(!raw)continue;try{const t=findToken(JSON.parse(raw));if(t)return t}catch(_){}}}catch(_){}return''}
  function deviceName(){const ua=navigator.userAgent||'';if(/iPad/.test(ua)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1))return'ARIA iPad';if(/iPhone/.test(ua))return'ARIA iPhone';return'ARIA device'}
  function standalone(){return window.matchMedia?.('(display-mode: standalone)').matches||navigator.standalone===true}
  function b64ToUint8(s){const p='='.repeat((4-s.length%4)%4);const b=atob((s+p).replace(/-/g,'+').replace(/_/g,'/'));return Uint8Array.from([...b].map(c=>c.charCodeAt(0)))}
  async function getPublicKey(){const r=await fetch(endpoint('/functions/v1/aria-notify?public_key=1'),{cache:'no-store'});const o=await r.json();if(!r.ok||!o.publicKey)throw new Error('کلید اعلان دریافت نشد');return o.publicKey}
  async function saveSubscription(sub){const token=getToken();if(!token)throw new Error('اول باید وارد حساب ARIA باشی.');const body={owner_id:null,device_name:deviceName(),endpoint:sub.endpoint,subscription:sub.toJSON(),updated_at:new Date().toISOString()};
    const ref=new URL(cfg.supabaseUrl).hostname.split('.')[0];const sessionRaw=localStorage.getItem(`sb-${ref}-auth-token`);let owner='';try{const x=JSON.parse(sessionRaw||'{}');owner=x?.user?.id||x?.currentSession?.user?.id||x?.session?.user?.id||''}catch(_){ }
    if(!owner){const p=JSON.parse(atob(token.split('.')[1].replace(/-/g,'+').replace(/_/g,'/')));owner=p.sub||''}
    body.owner_id=owner;
    const r=await fetch(endpoint('/rest/v1/aria_push_subscriptions?on_conflict=owner_id,endpoint'),{method:'POST',headers:{apikey:cfg.supabaseAnonKey,Authorization:`Bearer ${token}`,'Content-Type':'application/json',Prefer:'resolution=merge-duplicates,return=minimal'},body:JSON.stringify(body)});if(!r.ok)throw new Error('ثبت این دستگاه انجام نشد.');
  }
  async function remoteTest(){const token=getToken();if(!token)return;try{await fetch(endpoint('/functions/v1/aria-notify?mode=test'),{method:'POST',headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json'},body:'{}'})}catch(_){}}
  async function subscribe(){
    if(!('serviceWorker'in navigator)||!('PushManager'in window)||!('Notification'in window))throw new Error('این دستگاه اعلان پوش را پشتیبانی نمی‌کند.');
    if(/iPhone|iPad/.test(navigator.userAgent||'')&&!standalone())throw new Error('برای اعلان آیفون/آیپد، ARIA را از Add to Home Screen نصب کن و از آیکن خودش بازش کن.');
    let perm=Notification.permission;if(perm==='default')perm=await Notification.requestPermission();if(perm!=='granted')throw new Error('اجازه اعلان داده نشده. از Settings آیفون/آیپد، Notifications را برای ARIA روشن کن.');
    const reg=await navigator.serviceWorker.register('./sw.js');await navigator.serviceWorker.ready;
    let sub=await reg.pushManager.getSubscription();if(!sub){const key=await getPublicKey();sub=await reg.pushManager.subscribe({userVisibleOnly:true,applicationServerKey:b64ToUint8(key)})}
    await saveSubscription(sub);localStorage.setItem('ARIA_PUSH_READY','1');await remoteTest();return true;
  }
  async function ensureGranted(){if(Notification?.permission==='granted'){try{await subscribe()}catch(e){console.warn('ARIA push restore',e)}}}
  function removePrompt(){document.getElementById('ariaNotifyPrompt')?.remove()}
  function makePrompt(){if($('ariaNotifyPrompt')||localStorage.getItem('ARIA_PUSH_READY')==='1')return;const box=document.createElement('div');box.id='ariaNotifyPrompt';box.style.cssText='position:fixed;left:12px;right:12px;top:calc(12px + env(safe-area-inset-top));z-index:2147483000;background:#111a22;border:1px solid #2dd4bf;border-radius:16px;padding:12px 13px;box-shadow:0 14px 40px #0009;color:#f3f7f9;direction:rtl';box.innerHTML='<div style="font-weight:900;margin-bottom:5px">🔔 اعلان‌های ARIA</div><div style="font-size:12px;line-height:1.8;color:#c8d5db">برای یادآورها و سرزدن‌های روزانه، اعلان را روی همین دستگاه فعال کن.</div><div style="display:flex;gap:8px;margin-top:9px"><button id="ariaNotifyEnable" class="primary" style="flex:1">فعال‌سازی اعلان</button><button id="ariaNotifyLater" class="ghost">بعداً</button></div><div id="ariaNotifyMsg" style="font-size:11px;margin-top:7px;color:#ffbd4a"></div>';document.body.appendChild(box);
    $('ariaNotifyEnable').onclick=async()=>{const b=$('ariaNotifyEnable'),m=$('ariaNotifyMsg');b.disabled=true;m.textContent='در حال فعال‌سازی…';try{await subscribe();m.style.color='#42d392';m.textContent='فعال شد ✓ یک اعلان آزمایشی هم باید برات بیاد.';setTimeout(removePrompt,2200)}catch(e){m.textContent=e?.message||'فعال‌سازی انجام نشد.'}finally{b.disabled=false}};
    $('ariaNotifyLater').onclick=()=>removePrompt();
  }
  function boot(){if(!('Notification'in window))return;if(Notification.permission==='granted')ensureGranted();else if(Notification.permission==='default')setTimeout(makePrompt,900)}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
  window.addEventListener('pageshow',boot);
  window.ARIA_NOTIFICATIONS={subscribe,refresh:ensureGranted};
})();