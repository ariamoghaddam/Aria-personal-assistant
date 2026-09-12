(function(){
  if(window.__ARIA_AI_FETCH_GUARD_V1)return;window.__ARIA_AI_FETCH_GUARD_V1=true;
  const nativeFetch=window.fetch.bind(window);
  window.fetch=function(input,init){
    try{
      const url=typeof input==='string'?input:(input&&input.url)||'';
      if(url.includes('/api/aria-ai')&&url.includes('mode=assistant')){
        const controller=new AbortController();
        const timer=setTimeout(()=>controller.abort(),18000);
        const opts={...(init||{})};
        if(opts.signal){
          const outer=opts.signal;
          if(outer.aborted)controller.abort();
          else outer.addEventListener('abort',()=>controller.abort(),{once:true});
        }
        opts.signal=controller.signal;
        return nativeFetch(input,opts).catch(err=>{
          if(controller.signal.aborted)throw new Error('پاسخ هوش مصنوعی بیشتر از حد طول کشید. دوباره بزن.');
          throw err;
        }).finally(()=>clearTimeout(timer));
      }
    }catch(_){ }
    return nativeFetch(input,init);
  };
})();
