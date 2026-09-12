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

  const cleanup=()=>{
    document.getElementById('ariaBrainFab')?.remove();
    document.getElementById('ariaBrainEntryBtn')?.remove();
  };
  const make=()=>{
    cleanup();
    if(document.getElementById('ariaPermanentAiBtn')) return;
    const b=document.createElement('button');
    b.id='ariaPermanentAiBtn';
    b.type='button';
    b.textContent='✦ AI';
    b.setAttribute('aria-label','باز کردن مغز هوشمند ARIA');
    b.style.cssText='position:fixed;left:14px;bottom:calc(138px + env(safe-area-inset-bottom));z-index:2147483647;min-width:64px;height:54px;padding:0 16px;border:0;border-radius:18px;background:linear-gradient(135deg,#4f7cff,#2dd4bf);color:#fff;font-weight:900;font-size:16px;box-shadow:0 12px 32px rgba(0,0,0,.55);display:block!important;visibility:visible!important;opacity:1!important';
    b.onclick=()=>{
      const d=document.getElementById('ariaBrainDialog');
      if(d){try{d.showModal()}catch{d.setAttribute('open','')}return;}
      if(window.ARIA_BRAIN&&typeof window.ARIA_BRAIN.open==='function'){try{window.ARIA_BRAIN.open()}catch{}return;}
      const s=document.createElement('script');
      s.src='./aria-brain.js?force='+Date.now();
      s.onload=()=>setTimeout(()=>{cleanup();const dd=document.getElementById('ariaBrainDialog');if(dd){try{dd.showModal()}catch{dd.setAttribute('open','')}}},700);
      document.head.appendChild(s);
    };
    (document.body||document.documentElement).appendChild(b);
  };
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',make); else make();
  setInterval(make,700);
  window.addEventListener('pageshow',make);
})();

(async()=>{
  const marker='ARIA_SW_PURGED_AI_SINGLE_ENTRY_V7';
  try{
    if(!localStorage.getItem(marker)){
      localStorage.setItem(marker,'1');
      if('serviceWorker' in navigator){
        const regs=await navigator.serviceWorker.getRegistrations();
        await Promise.all(regs.map(r=>r.unregister().catch(()=>false)));
      }
      if(window.caches){
        const keys=await caches.keys();
        await Promise.all(keys.map(k=>caches.delete(k).catch(()=>false)));
      }
    }
  }catch(e){console.warn('ARIA reset',e)}

  const load=(src,key)=>new Promise((resolve,reject)=>{
    const s=document.createElement('script');
    s.src=src;
    s.defer=true;
    if(key)s.dataset[key]='1';
    s.onload=resolve;s.onerror=reject;
    document.head.appendChild(s);
  });

  window.addEventListener('load',()=>setTimeout(async()=>{
    document.querySelectorAll('script[data-aria-ai-input],script[data-aria-voice-guard],script[data-aria-hand-local],script[data-aria-brain],script[data-aria-brain-entry],script[data-aria-theme],script[data-aria-settings],script[data-aria-focus],script[data-aria-focus-distraction],script[data-aria-focus-entry],script[data-aria-productivity],script[data-aria-price-book],script[data-aria-music-pro],script[data-aria-metronome]').forEach(x=>x.remove());

    await load('./theme-ui.js?v=1','ariaTheme').catch(e=>console.error('ARIA theme load failed',e));
    load('./settings-ui.js?v=2','ariaSettings').catch(e=>console.error('ARIA settings load failed',e));
    load('./aria-brain.js?v=7','ariaBrain').catch(e=>console.error('ARIA brain load failed',e));
    await load('./focus-center.js?v=entry4','ariaFocus').catch(e=>console.error('ARIA focus load failed',e));
    load('./focus-distraction-enhance.js?v=entry4','ariaFocusDistraction').catch(e=>console.error('ARIA focus distraction load failed',e));
    load('./focus-entry-fix.js?v=1','ariaFocusEntry').catch(e=>console.error('ARIA focus entry failed',e));
    load('./productivity-suite.js?v=1','ariaProductivity').catch(e=>console.error('ARIA productivity load failed',e));
    load('./project-price-book.js?v=1','ariaPriceBook').catch(e=>console.error('ARIA price book load failed',e));
    await load('./music-suite.js?v=1','ariaMusicPro').catch(e=>console.error('ARIA music pro load failed',e));
    load('./music-metronome.js?v=2','ariaMetronome').catch(e=>console.error('ARIA metronome load failed',e));
    load('./handwriting-local.js?v=2','ariaHandLocal').catch(e=>console.error('ARIA handwriting load failed',e));

    try{
      await load('./ai-input.js?v=26','ariaAiInput');
    }catch(e){
      console.error('ARIA ai input load failed',e);
    }

    load('./voice-guard.js?v=26','ariaVoiceGuard').catch(e=>console.error('ARIA voice load failed',e));
  },250));
})();