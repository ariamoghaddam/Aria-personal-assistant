(function(){
  if(window.__ARIA_VOICE_FAST_V1)return;window.__ARIA_VOICE_FAST_V1=true;
  const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
  const $=id=>document.getElementById(id);
  const norm=s=>String(s||'').trim().replace(/ي/g,'ی').replace(/ك/g,'ک').replace(/[\u064B-\u065F]/g,'').replace(/\s+/g,' ');
  const en=s=>String(s||'').replace(/[۰-۹]/g,d=>'۰۱۲۳۴۵۶۷۸۹'.indexOf(d)).replace(/[٠-٩]/g,d=>'٠١٢٣٤٥٦٧٨٩'.indexOf(d));
  const today=()=>{const d=new Date();d.setMinutes(d.getMinutes()-d.getTimezoneOffset());return d.toISOString().slice(0,10)};
  const addDays=(iso,n)=>{const d=new Date((iso||today())+'T12:00:00');d.setDate(d.getDate()+n);return d.toISOString().slice(0,10)};
  const uid=()=>crypto?.randomUUID?.()||Math.random().toString(36).slice(2)+Date.now().toString(36);
  const nums={صفر:0,یک:1,یه:1,دو:2,سه:3,چهار:4,پنج:5,شش:6,شیش:6,هفت:7,هشت:8,نه:9,ده:10,یازده:11,دوازده:12,سیزده:13,چهارده:14,پانزده:15,شانزده:16,هفده:17,هجده:18,نوزده:19,بیست:20,بیست‌ویک:21,بیست‌ودو:22,بیست‌وسه:23};
  const wdays={شنبه:6,یکشنبه:0,دوشنبه:1,سه‌شنبه:2,سهشنبه:2,چهارشنبه:3,پنجشنبه:4,جمعه:5};
  let rec=null,lastPlan=null;

  function spokenNum(v){v=norm(en(v)).replace(/ /g,'');if(/^\d{1,2}$/.test(v))return +v;if(nums[v]!=null)return nums[v];for(const [k,n] of Object.entries(nums))if(v===k.replace(/ /g,''))return n;return null}
  function parseTime(q){
    const m=norm(q).match(/ساعت\s+([^،,.؛]+?)(?=\s+(?:فردا|امروز|پس\s*فردا|شنبه|یکشنبه|دوشنبه|سه.?شنبه|چهارشنبه|پنجشنبه|جمعه|برای|تو|در|یادم|ریمایندر|یادآور|ثبت|اضافه)|$)/);
    if(!m)return '';
    let s=en(m[1]).trim(),h=null,min=0;
    let dm=s.match(/(\d{1,2})(?:[:٫.]([0-5]?\d))?/);if(dm){h=+dm[1];min=dm[2]?+dm[2]:0}else{
      const toks=s.split(/\s+/);for(const t of toks){const n=spokenNum(t);if(n!=null){h=n;break}}
      if(/نیم/.test(s))min=30;else if(/ربع/.test(s))min=15;
    }
    if(h==null||h>23)return '';
    if(/عصر|شب/.test(s)&&h<12)h+=12;if(/ظهر/.test(s)&&h<7)h+=12;
    return String(h).padStart(2,'0')+':'+String(min).padStart(2,'0');
  }
  function parseDate(q){const s=norm(q);if(/پس\s*فردا/.test(s))return addDays(today(),2);if(/فردا/.test(s))return addDays(today(),1);if(/امروز/.test(s))return today();for(const [w,target] of Object.entries(wdays)){if(s.includes(w)){const d=new Date();let gap=(target-d.getDay()+7)%7;if(!gap)gap=7;return addDays(today(),gap)}}return ''}
  function projectFor(q){try{const list=Array.isArray(db?.projects)?db.projects:[];const n=norm(q);let hit=null,best=0;for(const p of list){const name=norm(p.name);if(name&&n.includes(name)&&name.length>best){hit=p;best=name.length}}return hit}catch{return null}}
  function cleanTitle(q){
    let s=norm(q);s=s.replace(/ساعت\s+[^،,.؛]+?(?=\s+(?:فردا|امروز|پس\s*فردا|شنبه|یکشنبه|دوشنبه|سه.?شنبه|چهارشنبه|پنجشنبه|جمعه|برای|تو|در|یادم|ریمایندر|یادآور|ثبت|اضافه)|$)/g,' ');
    s=s.replace(/پس\s*فردا|فردا|امروز|شنبه|یکشنبه|دوشنبه|سه.?شنبه|چهارشنبه|پنجشنبه|جمعه/g,' ');
    s=s.replace(/هر\s*روز|روزانه|هرروزه/g,' ');
    s=s.replace(/(?:یه|یک)?\s*(?:کار|تسک)\s*(?:جدید)?/g,' ');
    s=s.replace(/(?:برام|برای من)?\s*(?:یادآور|ریمایندر)\s*(?:بذار|بگذار|ثبت کن)?/g,' ');
    s=s.replace(/(?:برو|لطفا|لطفاً|میخوام|می‌خوام|می خواهم|می‌خواهم|واسم|برام)/g,' ');
    s=s.replace(/(?:اضافه کن|ثبت کن|بساز|قرار بده|بذار|بگذار|یادم بنداز|یادم بینداز)/g,' ');
    try{for(const p of db?.projects||[]){const name=norm(p.name);if(name)s=s.replace(new RegExp(name.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'),'g'),' ')}}catch(_){ }
    s=s.replace(/\s+/g,' ').replace(/^[،,:؛\-\s]+|[،,:؛\-\s]+$/g,'').trim();
    return s;
  }
  function plan(q){
    const text=norm(q),project=projectFor(text),date=parseDate(text),time=parseTime(text),repeat=/هر\s*روز|روزانه|هرروزه/.test(text)?'daily':'none';
    const priority=/فوری|ضروری|خیلی مهم/.test(text)?'urgent':/مهم/.test(text)?'important':'normal';
    const area=/شخصی/.test(text)?'personal':/شرکت|کاری|کارهای روزمره|پیگیری|تماس/.test(text)?'work':'general';
    const title=cleanTitle(text)||text;
    return {title,project:project?.id||'general',projectName:project?.name||'بدون پروژه',area,date,time,repeat,priority,spoken:text};
  }
  function ensureUI(){
    if(!$('ariaFastVoiceSheet')){
      const d=document.createElement('dialog');d.id='ariaFastVoiceSheet';d.style.cssText='width:min(560px,94vw);border:0;border-radius:22px;background:#101820;color:#fff;padding:16px;direction:rtl';
      d.innerHTML='<div style="display:flex;justify-content:space-between;align-items:center;gap:8px"><b style="font-size:18px">🎙 ثبت سریع با صدا</b><button id="afvClose" class="ghost">بستن</button></div><div id="afvState" style="margin-top:12px;color:#9fb2bd;font-size:13px">آماده</div><div id="afvHeard" style="margin-top:10px;padding:12px;border:1px solid #2d4050;border-radius:14px;min-height:54px;line-height:1.9"></div><div id="afvPlan" style="display:none;margin-top:10px;padding:12px;background:#0c141b;border-radius:14px;line-height:2"></div><div style="display:flex;gap:8px;margin-top:12px"><button id="afvRetry" style="flex:1">🎙 دوباره بگو</button><button id="afvConfirm" class="primary" style="flex:1;display:none">✓ اوکی، ثبت کن</button></div>';
      document.body.appendChild(d);$('afvClose').onclick=()=>{try{rec?.abort()}catch(_){};d.close()};$('afvRetry').onclick=start;$('afvConfirm').onclick=commit;
    }
    if(!$('ariaQuickVoice')){const b=document.createElement('button');b.id='ariaQuickVoice';b.type='button';b.textContent='🎙';b.title='ثبت سریع با صدا';b.style.cssText='position:fixed;left:14px;bottom:calc(204px + env(safe-area-inset-bottom));z-index:2147483600;width:54px;height:54px;border-radius:18px;border:1px solid #33495a;background:#101820;color:#fff;font-size:23px;box-shadow:0 10px 28px rgba(0,0,0,.4)';b.onclick=start;(document.body||document.documentElement).appendChild(b)}
  }
  function showPlan(p){lastPlan=p;$('afvPlan').style.display='block';$('afvPlan').innerHTML=`<b>${escapeHtml(p.title)}</b><br>📁 ${escapeHtml(p.projectName)}${p.date?`<br>📅 ${p.date}`:''}${p.time?`<br>⏰ ${p.time}`:''}${p.repeat==='daily'?'<br>🔁 هر روز':''}`;$('afvConfirm').style.display='inline-block';$('afvState').textContent='اگر همین درست است، فقط «اوکی، ثبت کن» را بزن.'}
  function escapeHtml(s){return String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]))}
  function start(){
    ensureUI();const d=$('ariaFastVoiceSheet');try{if(!d.open)d.showModal()}catch{d.setAttribute('open','')}
    $('afvPlan').style.display='none';$('afvConfirm').style.display='none';$('afvHeard').textContent='';$('afvState').textContent='🔴 گوش می‌دم… طبیعی حرف بزن.';lastPlan=null;
    if(!SR){$('afvState').textContent='روی این دستگاه تشخیص سریع گفتار در دسترس نیست.';return}
    try{rec?.abort()}catch(_){};rec=new SR();rec.lang='fa-IR';rec.interimResults=true;rec.continuous=false;rec.maxAlternatives=3;
    let finalText='';rec.onresult=e=>{let interim='';for(let i=e.resultIndex;i<e.results.length;i++){const t=e.results[i][0]?.transcript||'';if(e.results[i].isFinal)finalText+=t;else interim+=t}$('afvHeard').textContent=norm(finalText||interim);if(finalText){const p=plan(finalText);showPlan(p)}};
    rec.onerror=e=>{if(e.error==='no-speech')$('afvState').textContent='صدایی نگرفتم؛ دوباره بزن و صحبت کن.';else if(e.error==='not-allowed')$('afvState').textContent='اجازه میکروفون خاموش است. Microphone را برای ARIA روی Allow بگذار.';else $('afvState').textContent='تشخیص صدا قطع شد؛ دوباره بزن.'};
    rec.onend=()=>{if(!lastPlan&&$('afvHeard').textContent.trim()){showPlan(plan($('afvHeard').textContent))}else if(!lastPlan&&!$('afvHeard').textContent.trim())$('afvState').textContent='چیزی نشنیدم؛ دوباره بزن.'};
    try{rec.start()}catch(e){$('afvState').textContent='میکروفون آماده نشد؛ دوباره بزن.'}
  }
  function commit(){
    if(!lastPlan)return;try{if(typeof db==='undefined'||!db)throw new Error('داده‌های ARIA هنوز آماده نیست.');db.tasks=db.tasks||[];db.tasks.push({id:uid(),title:lastPlan.title,project:lastPlan.project,area:lastPlan.area,description:'',date:lastPlan.date,time:lastPlan.time,priority:lastPlan.priority,status:'todo',repeat:lastPlan.repeat,subtasks:[],attachments:[],drawing:null,createdAt:Date.now(),meta:{voiceCreated:true,voiceSource:lastPlan.spoken}});if(typeof save==='function')save();else localStorage.setItem('ARIA_ASSISTANT_PRO_V2',JSON.stringify(db));$('afvState').textContent='✓ ثبت شد';$('afvConfirm').style.display='none';setTimeout(()=>{try{$('ariaFastVoiceSheet').close()}catch(_){};try{if(typeof render==='function')render()}catch(_){}},700)}catch(e){$('afvState').textContent=e?.message||'ثبت انجام نشد.'}
  }
  function rebindOldButton(){const old=$('ariaVoiceBtn');if(!old||old.dataset.fastVoice==='1')return;const b=old.cloneNode(true);old.replaceWith(b);b.id='ariaVoiceBtn';b.dataset.fastVoice='1';b.textContent='🎙 گفتن سریع';b.onclick=e=>{e.preventDefault();e.stopPropagation();start()}}
  function boot(){ensureUI();rebindOldButton();let n=0;const iv=setInterval(()=>{rebindOldButton();if(++n>120)clearInterval(iv)},250)}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();window.ARIA_FAST_VOICE={start,plan};
})();