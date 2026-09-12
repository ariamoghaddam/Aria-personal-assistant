(function(){
  if(window.__ARIA_BRAIN_ENTRY_V1)return;window.__ARIA_BRAIN_ENTRY_V1=true;
  const $=id=>document.getElementById(id);
  function ensureButton(){
    if($('ariaBrainEntryBtn'))return;
    const b=document.createElement('button');
    b.id='ariaBrainEntryBtn';
    b.type='button';
    b.textContent='✦ AI';
    b.setAttribute('aria-label','باز کردن مغز هوشمند ARIA');
    b.style.cssText='position:fixed;left:16px;bottom:calc(86px + env(safe-area-inset-bottom));z-index:99999;min-width:58px;height:52px;padding:0 14px;border:0;border-radius:17px;background:linear-gradient(135deg,#4f7cff,#2dd4bf);color:white;font-weight:800;font-size:16px;box-shadow:0 10px 28px #0008';
    b.onclick=()=>{
      const d=$('ariaBrainDialog');
      if(d){try{d.showModal()}catch{d.setAttribute('open','')}return;}
      if(window.ARIA_BRAIN&&typeof window.ARIA_BRAIN.open==='function'){try{window.ARIA_BRAIN.open()}catch{}return;}
      const s=document.createElement('script');
      s.src='./aria-brain.js?force='+Date.now();
      s.onload=()=>setTimeout(()=>{const dd=$('ariaBrainDialog');if(dd){try{dd.showModal()}catch{dd.setAttribute('open','')}}},700);
      document.head.appendChild(s);
    };
    document.body.appendChild(b);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',ensureButton);else ensureButton();
  setInterval(ensureButton,1500);
})();
