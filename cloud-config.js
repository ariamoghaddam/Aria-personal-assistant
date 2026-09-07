window.ARIA_CLOUD = {
  supabaseUrl: "https://kbwyysfkvprvetninabb.supabase.co",
  supabaseAnonKey: "sb_publishable_fQ5frelO2cr7bFCjoFXvng_0SmCwsG4",
  pushPublicKey: "",
  apiBase: "/api",
  cloudEnabled: true
};

// iOS/PWA hard reset for stale Service Workers that were constructing invalid Request headers.
(async()=>{
  const marker='ARIA_SW_PURGED_V24';
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
      const u=new URL(location.href);
      u.searchParams.set('ariafresh','24');
      location.replace(u.toString());
      return;
    }
  }catch(e){ console.warn('ARIA cache reset',e); }

  window.addEventListener('load',()=>setTimeout(()=>{
    document.querySelectorAll('script[data-aria-ai-input]').forEach(x=>x.remove());
    const s=document.createElement('script');
    s.src='./ai-input.js?v=24';
    s.defer=true;
    s.dataset.ariaAiInput='1';
    document.head.appendChild(s);
  },350));
})();
