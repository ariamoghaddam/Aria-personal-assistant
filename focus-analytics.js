(function(){
  if(window.__ARIA_FOCUS_ANALYTICS_V1)return;window.__ARIA_FOCUS_ANALYTICS_V1=true;
  const EVT='ARIA_FOCUS_ACTIVITY_V1', HIST='ARIA_FOCUS_HISTORY_V1', SNAP='ARIA_FOCUS_TASK_SNAPSHOT_V1', DAY='ARIA_FOCUS_DAILY_V1';
  const $=id=>document.getElementById(id);
  const getDB=()=>{try{return typeof db!=='undefined'?db:null}catch{return null}};
  const read=(k,d)=>{try{return JSON.parse(localStorage.getItem(k)||JSON.stringify(d))}catch{return d}};
  const write=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v))}catch(_){}};
  const dayKey=(ts=Date.now())=>{const d=new Date(ts);d.setMinutes(d.getMinutes()-d.getTimezoneOffset());return d.toISOString().slice(0,10)};
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function focusState(){
    const running=$('afStart')?.textContent?.includes('در حال تمرکز');
    const sel=$('afTask');
    return {running:!!running,taskId:sel?.value||'',taskTitle:sel?.selectedOptions?.[0]?.textContent||''};
  }
  function logEvent(e){const a=read(EVT,[]);a.push({...e,ts:Date.now(),date:dayKey()});write(EVT,a.slice(-1200))}
  function pollTasks(){
    const D=getDB();if(!D)return;
    const old=read(SNAP,{}),now={};
    for(const t of D.tasks||[]){if(!t?.id)continue;now[t.id]={status:t.status||'todo',title:t.title||'',project:t.project||''};const p=old[t.id];
      if(p&&p.status!=='done'&&now[t.id].status==='done'){
        const f=focusState();logEvent({type:'task_done',taskId:t.id,title:t.title||'',project:t.project||'',withFocus:!!f.running,focusTaskId:f.taskId||''});
      }
      if(p&&p.status==='done'&&now[t.id].status!=='done')logEvent({type:'task_reopened',taskId:t.id,title:t.title||''});
    }
    write(SNAP,now);
  }
  function sessions(date){return read(HIST,[]).filter(x=>x.date===date)}
  function events(date){return read(EVT,[]).filter(x=>x.date===date)}
  function summary(date=dayKey()){
    const ss=sessions(date),ee=events(date),done=ee.filter(x=>x.type==='task_done'),withF=done.filter(x=>x.withFocus),withoutF=done.filter(x=>!x.withFocus);
    const mins=ss.reduce((s,x)=>s+(+x.minutes||0),0),dist=ss.reduce((s,x)=>s+(+x.distractions||0),0),pauses=ss.reduce((s,x)=>s+(+x.pauses||0),0);
    const focusRate=mins?+(withF.length/(mins/60)).toFixed(2):0;
    const score=Math.max(0,Math.min(100,Math.round((mins?45:0)+Math.min(35,withF.length*12)+Math.min(15,withoutF.length*5)-Math.min(20,dist*3)-Math.min(10,pauses*2))));
    return{date,focusMinutes:mins,sessions:ss.length,doneWithFocus:withF.length,doneWithoutFocus:withoutF.length,doneTotal:done.length,distractions:dist,pauses,focusRate,score,focusTasks:[...new Set(withF.map(x=>x.title).filter(Boolean))]};
  }
  function chartBars(s){
    const max=Math.max(1,s.focusMinutes,s.doneWithFocus*25,s.doneWithoutFocus*25,s.distractions*10);
    const bar=(label,val,unit='')=>`<div class="afaRow"><span>${label}</span><div class="afaTrack"><i style="width:${Math.max(4,Math.min(100,val/max*100))}%"></i></div><b>${val}${unit}</b></div>`;
    return bar('تمرکز',s.focusMinutes,'دقیقه')+bar('کار با تمرکز',s.doneWithFocus)+bar('کار بدون تمرکز',s.doneWithoutFocus)+bar('حواس‌پرتی',s.distractions);
  }
  function localAnalysis(s){
    if(!s.focusMinutes&&!s.doneTotal)return'امروز هنوز داده کافی برای تحلیل ندارم.';
    if(s.focusMinutes&&s.doneWithFocus>s.doneWithoutFocus)return`امروز تمرکزت اثر مثبت داشته؛ ${s.doneWithFocus} کار هنگام تمرکز تمام شده و ${s.doneWithoutFocus} کار خارج از تمرکز. امتیاز تمرکز ${s.score} از ۱۰۰ است.`;
    if(s.focusMinutes&&!s.doneWithFocus&&s.doneWithoutFocus)return`امروز ${s.focusMinutes} دقیقه تمرکز ثبت شده، اما کارهای انجام‌شده بیشتر خارج از جلسه تمرکز بوده‌اند. بهتر است دفعه بعد همان Task انتخاب‌شده را تا یک خروجی مشخص پیش ببری.`;
    if(!s.focusMinutes&&s.doneTotal)return`امروز بدون فعال کردن تمرکز ${s.doneTotal} کار را تمام کردی. از فردا چند کار مشابه را داخل Focus انجام بده تا ARIA بتواند بهره‌وری دو حالت را دقیق‌تر مقایسه کند.`;
    return`امروز ${s.focusMinutes} دقیقه تمرکز داشتی، ${s.doneTotal} کار تمام شد و ${s.distractions} حواس‌پرتی ثبت شد. امتیاز تمرکز ${s.score} از ۱۰۰ است.`;
  }
  async function aiAnalysis(s){
    if(!window.ARIA_BRAIN?.ask)return localAnalysis(s);
    try{
      const q=`این آمار امروز من است: ${JSON.stringify(s)}. خیلی کوتاه و کاربردی تحلیل کن: 1) با تمرکز چقدر خروجی داشتم 2) بدون تمرکز چقدر خروجی داشتم 3) کدام حالت برایم بهتر بوده 4) فردا یک پیشنهاد مشخص بده. فقط فارسی.`;
      const r=await window.ARIA_BRAIN.ask(q);return r?.text||localAnalysis(s);
    }catch(_){return localAnalysis(s)}
  }
  function ensureReport(){
    if($('ariaFocusAnalyticsDialog'))return;
    const css=document.createElement('style');css.textContent=`
      #ariaFocusAnalyticsDialog{width:min(680px,94vw);max-height:90vh}.afaGrid{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin:12px 0}.afaStat{padding:12px;border-radius:15px;background:var(--panel2);border:1px solid var(--line);text-align:center}.afaStat b{display:block;font-size:22px}.afaRow{display:grid;grid-template-columns:110px 1fr 70px;align-items:center;gap:8px;margin:10px 0;font-size:12px}.afaTrack{height:12px;border-radius:999px;background:color-mix(in srgb,var(--line) 70%,transparent);overflow:hidden}.afaTrack i{display:block;height:100%;border-radius:999px;background:linear-gradient(90deg,var(--accent2),var(--accent))}.afaInsight{padding:13px;border-radius:15px;background:linear-gradient(135deg,color-mix(in srgb,var(--accent) 13%,var(--panel2)),var(--panel));border:1px solid var(--line);white-space:pre-wrap;line-height:1.8}@media(max-width:700px){.afaGrid{grid-template-columns:1fr 1fr}.afaRow{grid-template-columns:90px 1fr 58px}}
    `;document.head.appendChild(css);
    const d=document.createElement('dialog');d.id='ariaFocusAnalyticsDialog';d.innerHTML=`<div><div class="sectionHead"><b>📊 تحلیل هوشمند امروز</b><button class="ghost" id="afaClose">بستن</button></div><div class="afaGrid"><div class="afaStat"><b id="afaMin">0</b><span>دقیقه تمرکز</span></div><div class="afaStat"><b id="afaWith">0</b><span>کار با تمرکز</span></div><div class="afaStat"><b id="afaWithout">0</b><span>کار بدون تمرکز</span></div><div class="afaStat"><b id="afaScore">0</b><span>امتیاز تمرکز</span></div></div><div id="afaChart"></div><div class="ariaSettingsTitle" style="margin-top:14px">تحلیل ARIA</div><div id="afaInsight" class="afaInsight">در حال آماده‌سازی…</div></div>`;document.body.appendChild(d);$('afaClose').onclick=()=>d.close();
  }
  async function openReport(){
    ensureReport();const s=summary();$('afaMin').textContent=s.focusMinutes;$('afaWith').textContent=s.doneWithFocus;$('afaWithout').textContent=s.doneWithoutFocus;$('afaScore').textContent=s.score;$('afaChart').innerHTML=chartBars(s);$('afaInsight').textContent='در حال تحلیل هوشمند…';$('ariaFocusAnalyticsDialog').showModal();$('afaInsight').textContent=await aiAnalysis(s);write(DAY,{date:s.date,summary:s,analysis:$('afaInsight').textContent,ts:Date.now()});
  }
  function inject(){
    const dlg=$('ariaFocusDialog');if(!dlg)return;
    if(!$('afProductivity')){
      const host=dlg.querySelector('.afCard:nth-child(2)')||dlg.querySelector('.afCard');
      if(host){const box=document.createElement('div');box.id='afProductivity';box.style.marginTop='16px';box.innerHTML=`<div class="ariaSettingsTitle">بهره‌وری امروز</div><div class="afAI" id="afProdMini"></div><button id="afDailyReport" style="margin-top:8px">📊 نمودار و تحلیل هوشمند امروز</button>`;host.appendChild(box);$('afDailyReport').onclick=openReport;}
    }
    const s=summary(),m=$('afProdMini');if(m)m.textContent=`${s.focusMinutes} دقیقه تمرکز · ${s.doneWithFocus} کار با تمرکز · ${s.doneWithoutFocus} کار بدون تمرکز · امتیاز ${s.score}/100`;
  }
  function endDayHint(){
    const h=new Date().getHours(),s=summary(),saved=read(DAY,{});if(h<20||saved.date===s.date)return;
    inject();const m=$('afProdMini');if(m)m.textContent=`گزارش پایان روز آماده است — ${s.focusMinutes} دقیقه تمرکز و ${s.doneTotal} کار انجام‌شده. برای تحلیل کامل نمودار را باز کن.`;
  }
  setInterval(()=>{pollTasks();inject();endDayHint()},1800);
  setTimeout(()=>{pollTasks();inject();endDayHint()},1200);
  new MutationObserver(()=>inject()).observe(document.documentElement,{childList:true,subtree:true});
  window.ARIA_FOCUS_ANALYTICS={summary,openReport};
})();