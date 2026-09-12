(function(){
  if(window.__ARIA_BRAIN_AUTO_BOOT)return;window.__ARIA_BRAIN_AUTO_BOOT=true;
  const load=src=>new Promise((resolve,reject)=>{const s=document.createElement('script');s.src=src;s.onload=resolve;s.onerror=reject;document.head.appendChild(s)});
  const loadCss=href=>new Promise((resolve,reject)=>{const l=document.createElement('link');l.rel='stylesheet';l.href=href;l.onload=resolve;l.onerror=reject;document.head.appendChild(l)});
  (async()=>{
    try{
      await load('./aria-ai-safe-bridge.js?v=1');
      await load('./aria-brain-core-v3.js?v=2');
      await loadCss('./aria-brain-position.css?v=1');
      const note=document.createElement('div');
      note.id='ariaBrainAutoNote';
      note.textContent='AI کامل ARIA در حالت امن فعال است؛ هیچ تغییری بدون تأیید تو اعمال نمی‌شود.';
      note.style.cssText='position:fixed;left:14px;bottom:calc(148px + env(safe-area-inset-bottom));z-index:69;background:#10231f;border:1px solid #2dd4bf66;color:#cffff5;padding:8px 10px;border-radius:12px;font-size:11px;max-width:260px;box-shadow:0 8px 24px #0006';
      document.body.appendChild(note);
      setTimeout(()=>note.remove(),5000);
    }catch(e){console.error('ARIA safe AI boot failed',e)}
  })();
})();