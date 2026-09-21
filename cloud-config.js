window.ARIA_CLOUD = {
  supabaseUrl: "https://kbwyysfkvprvetninabb.supabase.co",
  supabaseAnonKey: "sb_publishable_fQ5frelO2cr7bFCjoFXvng_0SmCwsG4",
  pushPublicKey: "",
  apiBase: "/api",
  cloudEnabled: true
};

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
    load('./routine-manager.js?v=1','ariaRoutines').catch(e=>console.error('ARIA routine manager load failed',e));
    load('./mental-rest.js?v=2','ariaMentalRest').catch(e=>console.error('ARIA mental rest load failed',e));
    load('./ui-hub.js?v=4','ariaUiHub').catch(e=>console.error('ARIA command center load failed',e));
    load('./dashboard-unified.js?v=4','ariaUnifiedDash').catch(e=>console.error('ARIA unified dashboard load failed',e));
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