(function(){
 if(window.__ARIA_FOCUS_CENTER_V2)return;window.__ARIA_FOCUS_CENTER_V2=true;
 const KEY='ARIA_FOCUS_HISTORY_V1', $=id=>document.getElementById(id);
 let total=25*60,left=total,timer=null,running=false,startedAt=0,pauses=0,distractions=0,selectedTaskId='';

 function getDB(){try{return typeof db!=='undefined'?db:null}catch{return null}}
 function hist(){try{return JSON.parse(localStorage.getItem(KEY)||'[]')}catch{return[]}}
 function saveHist(a){localStorage.setItem(KEY,JSON.stringify(a.slice(-300)))}
 function fmt(s){s=Math.max(0,Math.round(s));return String(Math.floor(s/60)).padStart(2,'0')+':'+String(s%60).padStart(2,'0')}
 function today(){const d=new Date();d.setMinutes(d.getMinutes()-d.getTimezoneOffset());return d.toISOString().slice(0,10)}

 const css=document.createElement('style');
 css.textContent=`
 #ariaFocusDialog{width:min(720px,94vw);max-height:92vh}.afWrap{display:grid;grid-template-columns:1fr;gap:14px}.afCard{padding:14px;border:1px solid var(--line);border-radius:18px;background:color-mix(in srgb,var(--panel2) 78%,transparent)}.afRing{--p:0;width:210px;height:210px;margin:14px auto;border-radius:50%;display:grid;place-items:center;background:conic-gradient(var(--accent) calc(var(--p)*1%),color-mix(in srgb,var(--line) 75%,transparent) 0);position:relative}.afRing:after{content:'';position:absolute;inset:13px;border-radius:50%;background:var(--panel)}.afTime{position:relative;z-index:1;font-size:42px;font-weight:900}.afPresets,.afBtns{display:flex;gap:8px;flex-wrap:wrap}.afPresets button.active{outline:2px solid var(--accent)}.afStats{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}.afStat{padding:10px;border-radius:14px;background:var(--panel);text-align:center}.afStat b{display:block;font-size:20px}.afGoal{min-height:70px}.ariaInlineFocus{background:linear-gradient(135deg,#2dd4bf,#4f7cff)!important;color:#fff!important;font-weight:800!important}@media(max-width:700px){.afRing{width:180px;height:180px}.afTime{font-size:36px}}`;
 document.head.appendChild(css);

 function build(){
   if($('ariaFocusDialog'))return;
   const d=document.createElement('dialog');d.id='ariaFocusDialog';
   d.innerHTML=`<div><div class="sectionHead"><b>🎯 تمرکز روی کار</b><button class="ghost" id="afClose">بستن</button></div><div class="afWrap"><div class="afCard"><label>کار انتخاب‌شده<select id="afTask"></select></label><label style="margin-top:10px">هدف این جلسه<textarea id="afGoal" class="afGoal" placeholder="مثلاً: فقط همین کار را تا پایان جلسه جلو ببر"></textarea></label><div class="afPresets" style="margin-top:10px"><button data-min="25">25/5</button><button data-min="50">50/10</button><button data-min="90">90 Deep</button><button data-min="30">30 دقیقه</button></div><div class="afRing" id="afRing"><div class="afTime" id="afTime">25:00</div></div><div class="afBtns"><button class="primary" id="afStart">شروع</button><button id="afPause">توقف</button><button id="afReset">ریست</button><button id="afDistract">حواسم پرت شد</button></div><div class="ariaSettingsTitle" style="margin-top:16px">آمار تمرکز</div><div class="afStats"><div class="afStat"><b id="afToday">0</b><span>دقیقه امروز</span></div><div class="afStat"><b id="afWeek">0</b><span>دقیقه هفته</span></div><div class="afStat"><b id="afStreak">0</b><span>روز پیوسته</span></div></div><div id="afHistory" class="sub" style="margin-top:10px"></div></div></div></div>`;
   document.body.appendChild(d);
   $('afClose').onclick=()=>d.close();$('afStart').onclick=start;$('afPause').onclick=pause;$('afReset').onclick=reset;$('afDistract').onclick=()=>{distractions++;window.ARIA_TOUCH_SOUND?.soft?.()};
   d.querySelectorAll('[data-min]').forEach(b=>b.onclick=()=>setMin(+b.dataset.min,b));
 }
 function tasks(){
   const D=getDB()||{},sel=$('afTask');if(!sel)return;
   const cur=selectedTaskId||sel.value;
   sel.innerHTML='<option value="">بدون انتخاب</option>'+((D.tasks||[]).filter(t=>t.status!=='done').map(t=>`<option value="${String(t.id).replace(/"/g,'')}">${String(t.title||'بدون عنوان').replace(/</g,'&lt;')}</option>`).join(''));
   if([...sel.options].some(o=>o.value===cur))sel.value=cur;
 }
 function setMin(m,b){if(running)return;total=left=m*60;document.querySelectorAll('#ariaFocusDialog [data-min]').forEach(x=>x.classList.toggle('active',x===b));renderTimer()}
 function renderTimer(){if($('afTime'))$('afTime').textContent=fmt(left);if($('afRing'))$('afRing').style.setProperty('--p',total?((total-left)/total*100):0)}
 function start(){if(running)return;running=true;startedAt=startedAt||Date.now();const end=Date.now()+left*1000;timer=setInterval(()=>{left=Math.max(0,Math.round((end-Date.now())/1000));renderTimer();if(left<=0)finish()},500);$('afStart').textContent='در حال تمرکز…';window.ARIA_TOUCH_SOUND?.soft?.()}
 function pause(){if(!running)return;running=false;clearInterval(timer);timer=null;pauses++;$('afStart').textContent='ادامه';window.ARIA_TOUCH_SOUND?.tap?.()}
 function reset(){clearInterval(timer);timer=null;running=false;left=total;startedAt=0;pauses=0;distractions=0;if($('afStart'))$('afStart').textContent='شروع';renderTimer()}
 function finish(){clearInterval(timer);timer=null;running=false;const sel=$('afTask'),taskId=sel?.value||'',taskTitle=sel?.selectedOptions?.[0]?.textContent||'',goal=$('afGoal')?.value.trim()||'';const h=hist();h.push({date:today(),ts:Date.now(),minutes:Math.round(total/60),taskId,taskTitle:taskId?taskTitle:'',goal,pauses,distractions});saveHist(h);window.ARIA_TOUCH_SOUND?.soft?.();reset();stats()}
 function stats(){const h=hist(),td=today(),now=new Date(),weekStart=new Date(now);weekStart.setDate(now.getDate()-6);weekStart.setHours(0,0,0,0);const t=h.filter(x=>x.date===td).reduce((s,x)=>s+(x.minutes||0),0),w=h.filter(x=>(x.ts||0)>=weekStart.getTime()).reduce((s,x)=>s+(x.minutes||0),0);let streak=0,d=new Date();for(;;){const k=new Date(d);k.setMinutes(k.getMinutes()-k.getTimezoneOffset());const ds=k.toISOString().slice(0,10);if(h.some(x=>x.date===ds)){streak++;d.setDate(d.getDate()-1)}else break}if($('afToday'))$('afToday').textContent=t;if($('afWeek'))$('afWeek').textContent=w;if($('afStreak'))$('afStreak').textContent=streak;const last=h.slice(-5).reverse();if($('afHistory'))$('afHistory').innerHTML=last.length?last.map(x=>`<div style="padding:7px 0;border-bottom:1px solid var(--line)">${x.minutes} دقیقه${x.taskTitle?' · '+x.taskTitle:''}</div>`).join(''):'هنوز جلسه‌ای ثبت نشده.'}

 function openForTask(id){
   selectedTaskId=String(id||'');
   build();tasks();stats();renderTimer();
   const sel=$('afTask');if(sel&&selectedTaskId)sel.value=selectedTaskId;
   try{$('ariaFocusDialog').showModal()}catch(_){$('ariaFocusDialog')?.setAttribute('open','')}
 }
 function removeStandalone(){
   document.querySelectorAll('[data-view="focus"]').forEach(x=>x.remove());
   document.querySelectorAll('button[onclick]').forEach(b=>{const o=b.getAttribute('onclick')||'';if(/view\s*=\s*['"]focus['"]/.test(o))b.remove()});
   try{if(typeof view!=='undefined'&&view==='focus'){view='today';typeof render==='function'&&render()}}catch(_){}
 }
 function taskIdFromCard(card){
   const e=card.querySelector('[onclick*="openTaskById"]');const s=e?.getAttribute('onclick')||'';
   const m=s.match(/openTaskById\(['"]([^'"]+)['"]\)/);return m?.[1]||'';
 }
 function inject(){
   removeStandalone();
   document.querySelectorAll('.task:not(.done)').forEach(card=>{
     if(card.querySelector('.ariaInlineFocus'))return;
     const id=taskIdFromCard(card);if(!id)return;
     const actions=card.querySelector('.actions');if(!actions)return;
     const b=document.createElement('button');b.type='button';b.className='ariaInlineFocus';b.textContent='🎯 تمرکز';
     b.onclick=e=>{e.preventDefault();e.stopPropagation();openForTask(id)};
     actions.prepend(b);
   });
 }
 build();inject();
 const mo=new MutationObserver(()=>inject());mo.observe(document.documentElement,{childList:true,subtree:true});
 window.addEventListener('pageshow',inject);
 window.ARIA_FOCUS_TASK=openForTask;
 window.ARIA_FOCUS_OPEN=()=>{const D=getDB()||{},t=(D.tasks||[]).find(x=>x.status!=='done');openForTask(t?.id||'')};
})();