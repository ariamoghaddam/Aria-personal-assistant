window.ARIA_CLOUD = {
  supabaseUrl: "https://kbwyysfkvprvetninabb.supabase.co",
  supabaseAnonKey: "sb_publishable_fQ5frelO2cr7bFCjoFXvng_0SmCwsG4",
  pushPublicKey: "",
  apiBase: "/api",
  cloudEnabled: true
};

(function ensurePermanentAIEntry(){
  const style=document.createElement('style');
  style.id='ariaSingleAiStyle';
  style.textContent='#ariaBrainFab,#ariaBrainEntryBtn{display:none!important;visibility:hidden!important;opacity:0!important;pointer-events:none!important}';
  if(!document.getElementById('ariaSingleAiStyle')) document.head.appendChild(style);
  const cleanup=()=>{document.getElementById('ariaBrainFab')?.remove();document.getElementById('ariaBrainEntryBtn')?.remove();};
  const make=()=>{cleanup();if(document.getElementById('ariaPermanentAiBtn')) return;const b=document.createElement('button');b.id='ariaPermanentAiBtn';b.type='button';b.textContent='✦ AI';b.setAttribute('aria-label','باز کردن مغز هوشمند ARIA');b.style.cssText='position:fixed;left:14px;bottom:calc(138px + env(safe-area-inset-bottom));z-index:2147483647;min-width:64px;height:54px;padding:0 16px;border:0;border-radius:18px;background:linear-gradient(135deg,#4f7cff,#2dd4bf);color:#fff;font-weight:900;font-size:16px;box-shadow:0 12px 32px rgba(0,0,0,.55);display:block!important';b.onclick=()=>{const d=document.getElementById('ariaBrainDialog');if(d){try{d.showModal()}catch{d.setAttribute('open','')}return;}if(window.ARIA_BRAIN&&typeof window.ARIA_BRAIN.open==='function'){try{window.ARIA_BRAIN.open()}catch{}return;}const s=document.createElement('script');s.src='./aria-brain.js?force='+Date.now();s.onload=()=>setTimeout(()=>{cleanup();const dd=document.getElementById('ariaBrainDialog');if(dd){try{dd.showModal()}catch{dd.setAttribute('open','')}}},700);document.head.appendChild(s)};(document.body||document.documentElement).appendChild(b)};
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',make); else make();setInterval(make,1200);window.addEventListener('pageshow',make);
})();

(function ensurePermanentVoiceEntries(){
  const addScript=(src,cb)=>{const s=document.createElement('script');s.src=src+(src.includes('?')?'&':'?')+'force='+Date.now();s.onload=()=>setTimeout(cb,80);s.onerror=()=>alert('بخش صدا لود نشد؛ دوباره امتحان کن.');document.head.appendChild(s)};
  const openConversation=()=>{if(window.ARIA_VOICE_CONVERSATION?.open){window.ARIA_VOICE_CONVERSATION.open();return;}addScript('./voice-conversation.js',()=>window.ARIA_VOICE_CONVERSATION?.open?.())};
  const openQuick=()=>{if(window.ARIA_FAST_VOICE?.start){window.ARIA_FAST_VOICE.start();return;}addScript('./voice-fast.js',()=>window.ARIA_FAST_VOICE?.start?.())};
  const make=()=>{
    if(!document.body)return;
    let talk=document.getElementById('ariaVoiceTalkBtn');
    if(!talk){talk=document.createElement('button');talk.id='ariaVoiceTalkBtn';talk.type='button';talk.textContent='🎧 گفتگو';talk.setAttribute('aria-label','گفت‌وگوی صوتی با ARIA');talk.style.cssText='position:fixed;right:14px;bottom:calc(202px + env(safe-area-inset-bottom));z-index:2147483647;min-width:76px;height:54px;padding:0 14px;border:0;border-radius:18px;background:linear-gradient(135deg,#7c4dff,#3f8cff);color:#fff;font-weight:900;font-size:15px;box-shadow:0 12px 32px rgba(0,0,0,.5);display:block!important;visibility:visible!important;opacity:1!important';document.body.appendChild(talk)}
    talk.onclick=openConversation;
    let quick=document.getElementById('ariaQuickVoice');
    if(!quick){quick=document.createElement('button');quick.id='ariaQuickVoice';quick.type='button';quick.textContent='🎙';quick.setAttribute('aria-label','ثبت سریع با صدا');quick.style.cssText='position:fixed;left:14px;bottom:calc(204px + env(safe-area-inset-bottom));z-index:2147483600;width:54px;height:54px;border-radius:18px;border:1px solid #33495a;background:#101820;color:#fff;font-size:23px;box-shadow:0 10px 28px rgba(0,0,0,.4);display:block!important;visibility:visible!important;opacity:1!important';document.body.appendChild(quick)}
    quick.onclick=openQuick;
  };
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',make);else make();
  setInterval(make,1500);window.addEventListener('pageshow',make);
})();

(async()=>{
  const marker='ARIA_CACHE_REFRESH_LIGHT_VOICE_V27';
  try{if(!localStorage.getItem(marker)){localStorage.setItem(marker,'1');if(window.caches){const keys=await caches.keys();await Promise.all(keys.map(k=>caches.delete(k).catch(()=>false)));}}}catch(e){console.warn('ARIA refresh',e)}
  const load=(src,key)=>new Promise((resolve,reject)=>{const s=document.createElement('script');s.src=src;s.defer=true;if(key)s.dataset[key]='1';s.onload=resolve;s.onerror=reject;document.head.appendChild(s);});
  const fresh=src=>src+(src.includes('?')?'&':'?')+'fresh='+Date.now();
  window.addEventListener('load',()=>setTimeout(async()=>{
    document.querySelectorAll('script[data-aria-ai-input],script[data-aria-voice-engine],script[data-aria-fast-voice],script[data-aria-voice-conversation],script[data-aria-hand-local],script[data-aria-brain],script[data-aria-brain-entry],script[data-aria-ai-fetch-guard],script[data-aria-notifications],script[data-aria-routines],script[data-aria-delete-fix],script[data-aria-theme],script[data-aria-settings],script[data-aria-focus],script[data-aria-focus-distraction],script[data-aria-focus-entry],script[data-aria-productivity],script[data-aria-price-book],script[data-aria-music-pro],script[data-aria-metronome]').forEach(x=>x.remove());
    await load('./theme-ui.js?v=1','ariaTheme').catch(e=>console.error('ARIA theme load failed',e));
    load('./settings-ui.js?v=2','ariaSettings').catch(e=>console.error('ARIA settings load failed',e));
    await load('./ai-fetch-guard.js?v=1','ariaAiFetchGuard').catch(e=>console.error('ARIA AI timeout guard load failed',e));
    load('./aria-brain.js?v=8','ariaBrain').catch(e=>console.error('ARIA brain load failed',e));
    load('./notification-center.js?v=6','ariaNotifications').catch(e=>console.error('ARIA notification load failed',e));
    load('./routine-manager.js?v=1','ariaRoutines').catch(e=>console.error('ARIA routine manager load failed',e));\n    load('./mental-rest.js?v=1','ariaMentalRest').catch(e=>console.error('ARIA mental rest load failed',e));
    load('./delete-fix.js?v=1','ariaDeleteFix').catch(e=>console.error('ARIA delete fix load failed',e));
    await load('./focus-center.js?v=entry5','ariaFocus').catch(e=>console.error('ARIA focus load failed',e));
    load('./focus-distraction-enhance.js?v=entry4','ariaFocusDistraction').catch(e=>console.error('ARIA focus distraction load failed',e));
    load('./focus-entry-fix.js?v=1','ariaFocusEntry').catch(e=>console.error('ARIA focus entry failed',e));
    load('./productivity-suite.js?v=1','ariaProductivity').catch(e=>console.error('ARIA productivity load failed',e));
    load('./project-price-book.js?v=1','ariaPriceBook').catch(e=>console.error('ARIA price book load failed',e));
    await load('./music-suite.js?v=1','ariaMusicPro').catch(e=>console.error('ARIA music pro load failed',e));
    load('./music-metronome.js?v=2','ariaMetronome').catch(e=>console.error('ARIA metronome load failed',e));
    load('./handwriting-local.js?v=2','ariaHandLocal').catch(e=>console.error('ARIA handwriting load failed',e));
    try{await load('./ai-input.js?v=26','ariaAiInput');}catch(e){console.error('ARIA ai input load failed',e);}
    await load(fresh('./voice-engine.js'),'ariaVoiceEngine').catch(e=>console.error('ARIA voice engine load failed',e));
    load(fresh('./voice-fast.js'),'ariaFastVoice').catch(e=>console.error('ARIA fast voice load failed',e));
    load(fresh('./voice-conversation.js'),'ariaVoiceConversation').catch(e=>console.error('ARIA spoken conversation load failed',e));
  },250));
})();