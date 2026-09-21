(function(){
  if(window.ARIA_SERVER_TRANSCRIBE)return;
  const cfg=window.ARIA_CLOUD||{};
  function findToken(obj,depth=0){
    if(!obj||depth>6)return '';
    if(typeof obj==='object'){
      if(typeof obj.access_token==='string'&&obj.access_token.trim())return obj.access_token.trim();
      for(const k of Object.keys(obj)){const v=findToken(obj[k],depth+1);if(v)return v}
    }
    return '';
  }
  function token(){
    try{
      const lite=localStorage.getItem('ARIA_SUPABASE_LITE_SESSION_V1');
      if(lite){try{const t=findToken(JSON.parse(lite));if(t)return t}catch(_){}}
      const project=new URL(cfg.supabaseUrl).hostname.split('.')[0];
      const preferred='sb-'+project+'-auth-token';
      const keys=[preferred,...Object.keys(localStorage).filter(k=>k.startsWith('sb-')&&k.includes('auth-token'))];
      for(const k of [...new Set(keys)]){
        const raw=localStorage.getItem(k);if(!raw)continue;
        try{const t=findToken(JSON.parse(raw));if(t)return t}catch(_){}
      }
    }catch(_){}
    throw new Error('برای ثبت صوتی باید وارد حساب ARIA باشی.');
  }
  window.ARIA_SERVER_TRANSCRIBE=async function(blob){
    const t=token();
    const r=await fetch('/api/aria-ai?mode=transcribe&t='+encodeURIComponent(t)+'&v=31',{
      method:'POST',headers:{'Content-Type':blob.type||'audio/mp4'},body:blob
    });
    const out=await r.json().catch(()=>({}));
    if(!r.ok)throw new Error(out?.detail||out?.error||('خطای تبدیل صدا ('+r.status+')'));
    const text=String(out?.text||'').replace(/\s+/g,' ').trim();
    if(!text)throw new Error('چیزی از صدات متوجه نشدم؛ دوباره بگو.');
    return text;
  };
})();