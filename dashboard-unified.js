(function(){
  if(window.__ARIA_UNIFIED_DASH_V1)return;window.__ARIA_UNIFIED_DASH_V1=true;
  const $=s=>document.querySelector(s);
  function E(s){return String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]))}
  function todayISO2(){const d=new Date();d.setMinutes(d.getMinutes()-d.getTimezoneOffset());return d.toISOString().slice(0,10)}
  function addDays2(iso,n){const d=new Date(iso+'T12:00:00');d.setDate(d.getDate()+n);return d.toISOString().slice(0,10)}
  function D(){try{return typeof db!=='undefined'?db:null}catch{return null}}
  function projectFor(id){const d=D();return (d?.projects||[]).find(p=>p.id===id)}
  function kindMeeting(m){return /قرار/.test(String(m.title||''))?'قرار':'جلسه'}
  function itemTask(t){
    const p=projectFor(t.project),pc=p?.color||'#2dd4bf';
    const time=t.time?'<span class="udsTime">🕒 '+E(t.time)+'</span>':'';
    const proj=p?'<span class="udsProject" style="--pc:'+pc+'">▰ '+E(p.name)+'</span>':'';
    return '<button class="udsItem udsTask" type="button" onclick="openTaskById(\''+String(t.id).replace(/'/g,'')+'\')"><span class="udsRail" style="background:'+pc+'"></span><span class="udsMain"><span class="udsTop"><b>'+E(t.title||'بدون عنوان')+'</b><span class="udsType task">کار</span></span><span class="udsMeta">'+time+proj+'</span></span></button>';
  }
  function itemMeeting(m){
    const isAp=kindMeeting(m)==='قرار', c=isAp?'#9b7cff':'#ff9f43', ic=isAp?'◉':'◫', label=isAp?'قرار':'جلسه';
    const time=m.time?'<span class="udsTime">🕒 '+E(m.time)+'</span>':'';
    const loc=m.location?'<span class="udsProject">⌖ '+E(m.location)+'</span>':'';
    return '<button class="udsItem udsMeeting" type="button" onclick="window.ARIA_editMeeting&&ARIA_editMeeting(\''+String(m.id).replace(/'/g,'')+'\')"><span class="udsRail" style="background:'+c+'"></span><span class="udsMain"><span class="udsTop"><b>'+ic+' '+E(m.title||label)+'</b><span class="udsType" style="background:'+c+'22;color:'+c+';border-color:'+c+'55">'+label+'</span></span><span class="udsMeta">'+time+loc+'</span></span></button>';
  }
  function itemsFor(date){
    const d=D()||{}, a=[];
    (d.tasks||[]).filter(t=>t.date===date&&t.status!=='done').forEach(t=>a.push({time:t.time||'99:99',html:itemTask(t),ord:1}));
    (d.meetings||[]).filter(m=>m.date===date).forEach(m=>a.push({time:m.time||'99:99',html:itemMeeting(m),ord:0}));
    return a.sort((x,y)=>x.time.localeCompare(y.time)||x.ord-y.ord);
  }
  function section(title,date){
    const a=itemsFor(date);
    return '<section class="card section udsSection" data-uds-date="'+date+'"><div class="sectionHead"><b>'+title+'</b><span class="sub">'+a.length+' مورد</span></div><div class="udsList">'+(a.length?a.map(x=>x.html).join(''):'<div class="empty">برنامه‌ای ثبت نشده.</div>')+'</div></section>';
  }
  function style(){
    if(document.getElementById('ariaUnifiedDashStyle'))return;
    const s=document.createElement('style');s.id='ariaUnifiedDashStyle';s.textContent=`
      .udsList{display:grid;gap:9px;margin-top:10px}.udsItem{position:relative;width:100%;display:flex;align-items:stretch;text-align:right;padding:0;overflow:hidden;border:1px solid var(--line);background:linear-gradient(145deg,rgba(20,32,42,.96),rgba(12,22,30,.96));border-radius:16px;color:var(--text);box-shadow:0 8px 24px rgba(0,0,0,.16)}
      .udsItem:active{transform:scale(.992)}.udsRail{width:5px;flex:0 0 5px}.udsMain{display:grid;gap:8px;padding:12px 13px;width:100%}.udsTop{display:flex;align-items:center;justify-content:space-between;gap:10px}.udsTop b{font-size:14px}.udsType{font-size:10px;font-weight:900;border-radius:999px;padding:4px 8px;border:1px solid transparent;white-space:nowrap}.udsType.task{background:#2dd4bf18;color:#5fe8d5;border-color:#2dd4bf44}.udsMeta{display:flex;gap:7px;flex-wrap:wrap}.udsTime,.udsProject{font-size:10px;color:var(--muted);padding:4px 7px;border-radius:999px;background:#0c151d;border:1px solid #243743}.udsProject[style]{border-color:color-mix(in srgb,var(--pc) 45%,#243743)}.udsSection{border-color:#304354}
    `;document.head.appendChild(s)
  }
  function hideLegacyToday(){
    document.querySelectorAll('#main section').forEach(sec=>{
      if(sec.classList.contains('udsSection'))return;
      const txt=(sec.querySelector('.sectionHead b')?.textContent||sec.textContent||'').trim();
      if(txt.includes('تابلو اعلانات امروز')||txt.includes('تابلو اعلانات فردا'))sec.style.display='none';
    });
  }
  function renderUnified(){
    style();
    let v='';try{v=typeof view!=='undefined'?view:''}catch{}
    if(v!=='today')return;
    const main=document.getElementById('main');if(!main)return;
    hideLegacyToday();
    const td=todayISO2(),tm=addDays2(td,1);
    const old=main.querySelector('[data-aria-unified-dashboard]');if(old)old.remove();
    const box=document.createElement('div');box.dataset.ariaUnifiedDashboard='1';
    box.innerHTML=section('برنامه امروز',td)+section('برنامه فردا',tm);
    const first=main.firstElementChild;
    if(first)first.after(box);else main.appendChild(box);
  }
  let raf=0,patched=false;
  function schedule(){cancelAnimationFrame(raf);raf=requestAnimationFrame(renderUnified)}
  function patchRender(){
    if(patched)return;
    try{
      if(typeof render==='function'){
        const base=render;
        render=function(){const out=base.apply(this,arguments);setTimeout(schedule,0);return out};
        try{window.render=render}catch(_){}
        patched=true;
      }
    }catch(_){}
  }
  window.addEventListener('load',()=>{setTimeout(()=>{patchRender();schedule()},700)});
  window.addEventListener('pageshow',schedule);
  setTimeout(()=>{patchRender();schedule()},1000);
})();