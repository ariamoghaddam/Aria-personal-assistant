(function(){
  if(window.__ARIA_FOCUS_DISTRACTION_V1)return;window.__ARIA_FOCUS_DISTRACTION_V1=true;
  const KEY='ARIA_FOCUS_DISTRACTIONS_V1';
  const $=id=>document.getElementById(id);
  function read(){try{return JSON.parse(localStorage.getItem(KEY)||'[]')}catch{return[]}}
  function write(a){localStorage.setItem(KEY,JSON.stringify(a.slice(-500)))}
  function nowLabel(){try{return new Intl.DateTimeFormat('fa-IR',{hour:'2-digit',minute:'2-digit'}).format(new Date())}catch{return new Date().toLocaleTimeString()}}
  function ensureUI(){
    const d=$('ariaFocusDialog');if(!d||$('afRecoverBox'))return;
    const box=document.createElement('div');box.id='afRecoverBox';box.style.cssText='display:none;margin-top:10px;padding:12px 14px;border:1px solid var(--line);border-radius:16px;background:linear-gradient(135deg,color-mix(in srgb,var(--accent) 10%,var(--panel2)),var(--panel));';
    box.innerHTML='<div style="display:flex;align-items:center;justify-content:space-between;gap:10px"><b>↩ برگشت به تمرکز</b><span id="afDistractCount" class="sub">0 بار</span></div><div id="afRecoverText" class="sub" style="margin-top:6px;line-height:1.8"></div><div style="height:7px;background:var(--panel);border-radius:99px;overflow:hidden;margin-top:9px"><i id="afRecoverBar" style="display:block;height:100%;width:100%;background:linear-gradient(90deg,var(--accent2),var(--accent));transition:width 1s linear"></i></div>';
    const btn=$('afDistract');btn?.parentElement?.after(box);
  }
  let recoveryTimer=null;
  function startRecovery(){
    ensureUI();const box=$('afRecoverBox'),txt=$('afRecoverText'),bar=$('afRecoverBar'),count=$('afDistractCount');if(!box)return;
    const history=read();history.push({ts:Date.now()});write(history);
    const recent=history.filter(x=>Date.now()-x.ts<60*60*1000).length;
    count.textContent=recent+' بار این ساعت';
    box.style.display='block';
    let s=10;txt.textContent='۱۰ ثانیه فقط برگرد روی همان کاری که انتخاب کردی؛ هیچ چیز دیگری را باز نکن.';bar.style.width='100%';
    clearInterval(recoveryTimer);
    recoveryTimer=setInterval(()=>{s--;bar.style.width=(s*10)+'%';if(s<=0){clearInterval(recoveryTimer);recoveryTimer=null;txt.textContent='✓ برگشتی. ادامه بده؛ حواس‌پرتی ثبت شد · '+nowLabel();setTimeout(()=>{if(box)box.style.display='none'},3500)}},1000);
    try{navigator.vibrate?.(12)}catch(_){ }
  }
  function hook(){ensureUI();const b=$('afDistract');if(!b||b.dataset.afDistractEnhance)return;b.dataset.afDistractEnhance='1';b.addEventListener('click',startRecovery)}
  hook();new MutationObserver(hook).observe(document.documentElement,{childList:true,subtree:true});
})();