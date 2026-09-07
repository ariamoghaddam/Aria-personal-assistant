(function(){
  if(window.__ARIA_FOCUS_ENTRY_FIX_V1)return;window.__ARIA_FOCUS_ENTRY_FIX_V1=true;
  const $=id=>document.getElementById(id);
  let opening=false;
  function isFocusView(){
    try{return typeof view!=='undefined'&&view==='focus'}catch{return false}
  }
  function ensureInline(){
    const main=$('main');if(!main||!isFocusView())return;
    const fc=main.querySelector('.focusCard');if(!fc)return;
    if(!fc.querySelector('#ariaFocusAdvancedBtn')){
      const wrap=document.createElement('div');
      wrap.style.cssText='margin-top:14px;padding:14px;border:1px solid var(--line);border-radius:16px;background:linear-gradient(135deg,color-mix(in srgb,var(--accent) 10%,var(--panel2)),var(--panel));text-align:right';
      wrap.innerHTML='<b>🎯 مرکز تمرکز هوشمند</b><div class="sub" style="margin-top:5px">انتخاب Task، هدف جلسه، تایمرهای 25/50/90، آمار، تاریخچه، پیشنهاد AI و بازیابی حواس‌پرتی</div><button id="ariaFocusAdvancedBtn" class="primary" style="margin-top:10px;width:100%">باز کردن مرکز تمرکز پیشرفته</button>';
      fc.appendChild(wrap);
      $('#ariaFocusAdvancedBtn').onclick=()=>window.ARIA_FOCUS_OPEN?.();
    }
  }
  function maybeOpen(){
    ensureInline();
    if(!isFocusView()||opening)return;
    const d=$('ariaFocusDialog');if(!d||d.open)return;
    if(typeof window.ARIA_FOCUS_OPEN!=='function')return;
    opening=true;setTimeout(()=>{try{window.ARIA_FOCUS_OPEN()}catch(e){console.warn('ARIA focus open',e)}finally{opening=false}},80);
  }
  const obs=new MutationObserver(maybeOpen);obs.observe(document.documentElement,{childList:true,subtree:true});
  document.addEventListener('click',e=>{
    const b=e.target.closest?.('[data-view="focus"]');if(!b)return;
    setTimeout(maybeOpen,80);
  },true);
  setInterval(maybeOpen,800);
  maybeOpen();
})();