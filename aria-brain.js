(function(){
  const load=src=>new Promise((resolve,reject)=>{const s=document.createElement('script');s.src=src;s.onload=resolve;s.onerror=reject;document.head.appendChild(s)});
  const loadCss=href=>new Promise((resolve,reject)=>{const l=document.createElement('link');l.rel='stylesheet';l.href=href;l.onload=resolve;l.onerror=reject;document.head.appendChild(l)});
  async function boot(force=false){
    try{
      if(document.getElementById('ariaBrainFab')&&document.getElementById('ariaBrainDialog'))return;
      if(force){try{delete window.__ARIA_BRAIN_V2}catch(_){window.__ARIA_BRAIN_V2=false}}
      if(!window.__ARIA_AI_SAFE_BRIDGE_V1)await load('./aria-ai-safe-bridge.js?v=1');
      await load('./aria-brain-core-v3.js?v=4');
      if(!document.querySelector('link[href*="aria-brain-position.css"]'))await loadCss('./aria-brain-position.css?v=1');
      setTimeout(()=>{
        if(!document.getElementById('ariaBrainFab')||!document.getElementById('ariaBrainDialog')){
          try{delete window.__ARIA_BRAIN_V2}catch(_){window.__ARIA_BRAIN_V2=false}
          load('./aria-brain-core-v3.js?v=4-retry').catch(()=>{});
        }
      },700);
    }catch(e){console.error('ARIA AI boot failed',e)}
  }
  window.__ARIA_BRAIN_AUTO_BOOT=true;
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>boot(true));else boot(true);
  setTimeout(()=>boot(true),1400);
  window.addEventListener('pageshow',()=>boot(true));
})();