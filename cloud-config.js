window.ARIA_CLOUD = {
  supabaseUrl: "https://kbwyysfkvprvetninabb.supabase.co",
  supabaseAnonKey: "sb_publishable_fQ5frelO2cr7bFCjoFXvng_0SmCwsG4",
  pushPublicKey: "",
  apiBase: "/api",
  cloudEnabled: true
};

// iPad/Safari fix: sanitize request headers only for ARIA AI calls.
// This avoids WebKit's "headers ... is not a valid ByteString" error.
(function(){
  const nativeFetch=window.fetch.bind(window);
  window.fetch=function(input,init){
    try{
      const url=typeof input==='string'?input:(input&&input.url)||'';
      if(url.includes('/functions/v1/aria-ai')){
        const src=(init&&init.headers)||{};
        const clean={};
        const entries=src instanceof Headers?Array.from(src.entries()):Object.entries(src);
        for(const [k,v] of entries){
          const key=String(k).toLowerCase();
          // The Edge Function only needs Authorization and Content-Type from the browser.
          if(key!=='authorization'&&key!=='content-type') continue;
          const val=String(v??'').replace(/[^\x20-\x7E]/g,'').trim();
          if(val) clean[k]=val;
        }
        init={...(init||{}),headers:clean};
      }
    }catch(_){}
    return nativeFetch(input,init);
  };
})();

// Load the Persian AI input layer after the main app starts.
window.addEventListener('load',()=>setTimeout(()=>{
  if(document.querySelector('script[data-aria-ai-input]')) return;
  const s=document.createElement('script');
  s.src='./ai-input.js?v=19';
  s.defer=true;
  s.dataset.ariaAiInput='1';
  document.head.appendChild(s);
},350));
