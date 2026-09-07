window.ARIA_CLOUD = {
  supabaseUrl: "https://kbwyysfkvprvetninabb.supabase.co",
  supabaseAnonKey: "sb_publishable_fQ5frelO2cr7bFCjoFXvng_0SmCwsG4",
  pushPublicKey: "",
  apiBase: "/api",
  cloudEnabled: true
};

(async()=>{
  const marker='ARIA_SW_PURGED_FOCUS_V1';
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
    document.querySelectorAll('script[data-aria-ai-input],script[data-aria-voice-guard],script[data-aria-hand-local],script[data-aria-brain],script[data-aria-theme],script[data-aria-settings],script[data-aria-focus]').forEach(x=>x.remove());

    await load('./theme-ui.js?v=1','ariaTheme').catch(e=>console.error('ARIA theme load failed',e));
    load('./settings-ui.js?v=2','ariaSettings').catch(e=>console.error('ARIA settings load failed',e));
    load('./aria-brain.js?v=3','ariaBrain').catch(e=>console.error('ARIA brain load failed',e));
    load('./focus-center.js?v=1','ariaFocus').catch(e=>console.error('ARIA focus load failed',e));
    load('./handwriting-local.js?v=2','ariaHandLocal').catch(e=>console.error('ARIA handwriting load failed',e));

    try{
      await load('./ai-input.js?v=26','ariaAiInput');
    }catch(e){
      console.error('ARIA ai input load failed',e);
    }

    load('./voice-guard.js?v=26','ariaVoiceGuard').catch(e=>console.error('ARIA voice load failed',e));
  },250));
})();
