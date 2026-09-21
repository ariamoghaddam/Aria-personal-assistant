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
    const a=itemsFor(date),d=D()||{};
    const tasks=(d.tasks||[]).filter(t=>t.date===date&&t.status!=='done').length;
    const meetings=(d.meetings||[]).filter(m=>m.date===date&&kindMeeting(m)==='جلسه').length;
    const appointments=(d.meetings||[]).filter(m=>m.date===date&&kindMeeting(m)==='قرار').length;
    const isToday=date===todayISO2(),cls=isToday?'udsToday':'udsTomorrow',icon=isToday?'☀️':'🌙';
    return '<section class="card section udsSection '+cls+'" data-uds-date="'+date+'">'+
      '<div class="udsSectionGlow"></div>'+
      '<div class="udsHead"><div class="udsHeadTitle"><span class="udsDayIcon">'+icon+'</span><div><b>'+title+'</b><small>'+(isToday?'برنامه روزت یک‌جا':'نگاه سریع به فردا')+'</small></div></div><span class="udsCount">'+a.length+' مورد</span></div>'+
      '<div class="udsSummary">'+
        '<span class="udsChip work">✓ '+tasks+' کار</span>'+
        '<span class="udsChip meeting">◫ '+meetings+' جلسه</span>'+
        '<span class="udsChip appointment">◉ '+appointments+' قرار</span>'+
      '</div>'+
      '<div class="udsList">'+(a.length?a.map(x=>x.html).join(''):'<div class="udsEmpty"><span>✦</span><b>برنامه‌ای ثبت نشده</b><small>فعلاً این روز خلوت است.</small></div>')+'</div></section>';
  }
  function style(){
    if(document.getElementById('ariaUnifiedDashStyle'))return;
    const s=document.createElement('style');s.id='ariaUnifiedDashStyle';s.textContent=`
      .udsSection{position:relative;overflow:hidden;border:1px solid #304354;background:linear-gradient(145deg,rgba(17,29,40,.98),rgba(10,18,26,.98));box-shadow:0 18px 42px rgba(0,0,0,.24)}
      .udsSectionGlow{position:absolute;inset:-80px auto auto -60px;width:210px;height:210px;border-radius:50%;filter:blur(10px);opacity:.16;pointer-events:none}
      .udsToday .udsSectionGlow{background:#2dd4bf}.udsTomorrow .udsSectionGlow{background:#7c6cff}
      .udsHead{position:relative;display:flex;align-items:center;justify-content:space-between;gap:12px}.udsHeadTitle{display:flex;align-items:center;gap:10px}.udsHeadTitle b{display:block;font-size:16px}.udsHeadTitle small{display:block;color:var(--muted);font-size:10px;margin-top:3px}
      .udsDayIcon{width:38px;height:38px;border-radius:13px;display:grid;place-items:center;font-size:18px;border:1px solid rgba(255,255,255,.12);background:linear-gradient(145deg,rgba(255,255,255,.09),rgba(255,255,255,.025));box-shadow:inset 0 1px 0 rgba(255,255,255,.08)}
      .udsCount{font-size:10px;font-weight:900;padding:6px 9px;border-radius:999px;color:#eafaff;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.08)}
      .udsSummary{position:relative;display:flex;gap:6px;flex-wrap:wrap;margin-top:11px}.udsChip{font-size:10px;font-weight:800;padding:5px 8px;border-radius:999px;border:1px solid transparent}
      .udsChip.work{color:#67ead7;background:#2dd4bf12;border-color:#2dd4bf35}.udsChip.meeting{color:#ffc16b;background:#ff9f4312;border-color:#ff9f4338}.udsChip.appointment{color:#bba8ff;background:#9b7cff12;border-color:#9b7cff38}
      .udsList{position:relative;display:grid;gap:9px;margin-top:12px}.udsItem{position:relative;width:100%;display:flex;align-items:stretch;text-align:right;padding:0;overflow:hidden;border:1px solid rgba(255,255,255,.07);background:linear-gradient(145deg,rgba(25,39,51,.98),rgba(13,24,33,.98));border-radius:17px;color:var(--text);box-shadow:0 9px 24px rgba(0,0,0,.16),inset 0 1px 0 rgba(255,255,255,.025);transition:.16s ease}
      .udsItem:hover{border-color:rgba(255,255,255,.13);transform:translateY(-1px)}.udsItem:active{transform:scale(.992)}.udsRail{width:5px;flex:0 0 5px}.udsMain{display:grid;gap:8px;padding:13px 14px;width:100%}.udsTop{display:flex;align-items:center;justify-content:space-between;gap:10px}.udsTop b{font-size:14px}.udsType{font-size:10px;font-weight:900;border-radius:999px;padding:4px 8px;border:1px solid transparent;white-space:nowrap}.udsType.task{background:#2dd4bf18;color:#5fe8d5;border-color:#2dd4bf44}.udsMeta{display:flex;gap:7px;flex-wrap:wrap}.udsTime,.udsProject{font-size:10px;color:#a9bac4;padding:4px 7px;border-radius:999px;background:#0b151e;border:1px solid #243743}.udsProject[style]{border-color:color-mix(in srgb,var(--pc) 45%,#243743)}
      .udsEmpty{display:grid;place-items:center;gap:5px;padding:24px 10px;border:1px dashed rgba(255,255,255,.09);border-radius:16px;background:rgba(255,255,255,.018);color:var(--muted)}.udsEmpty span{font-size:24px;color:#59d9f3}.udsEmpty b{color:#dbe7ed;font-size:12px}.udsEmpty small{font-size:10px}
      @media(max-width:600px){.udsSection{padding:13px}.udsHeadTitle b{font-size:15px}.udsDayIcon{width:36px;height:36px}.udsSummary{gap:5px}.udsChip{font-size:9px}}
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
    const html=section('برنامه امروز',td)+section('برنامه فردا',tm);
    let box=main.querySelector('[data-aria-unified-dashboard]');
    if(!box){box=document.createElement('div');box.dataset.ariaUnifiedDashboard='1';const first=main.firstElementChild;if(first)first.after(box);else main.appendChild(box)}
    if(box.dataset.snapshot!==html){box.innerHTML=html;box.dataset.snapshot=html}
  }
  let raf=0,patched=false;
  function schedule(){cancelAnimationFrame(raf);raf=requestAnimationFrame(renderUnified)}
  function patchRender(){
    if(patched)return;
    try{
      if(typeof render==='function'){
        const base=render;
        render=function(){const out=base.apply(this,arguments);renderUnified();return out};
        try{window.render=render}catch(_){}
        patched=true;
      }
    }catch(_){}
  }
  window.addEventListener('load',()=>{setTimeout(()=>{patchRender();schedule()},700)});
  window.addEventListener('pageshow',schedule);
  setTimeout(()=>{patchRender();schedule()},1000);
})();