(function(){
  if(window.__ARIA_VOICE_FAST_V8)return;window.__ARIA_VOICE_FAST_V8=true;
  const $=id=>document.getElementById(id);
  const norm=s=>String(s||'').trim().replace(/ي/g,'ی').replace(/ك/g,'ک').replace(/[\u064B-\u065F]/g,'').replace(/\s+/g,' ');
  const en=s=>String(s||'').replace(/[۰-۹]/g,d=>'۰۱۲۳۴۵۶۷۸۹'.indexOf(d)).replace(/[٠-٩]/g,d=>'٠١٢٣٤٥٦٧٨٩'.indexOf(d));
  const today=()=>{const d=new Date();d.setMinutes(d.getMinutes()-d.getTimezoneOffset());return d.toISOString().slice(0,10)};
  const addDays=(iso,n)=>{const d=new Date((iso||today())+'T12:00:00');d.setDate(d.getDate()+n);return d.toISOString().slice(0,10)};
  const uid=()=>crypto?.randomUUID?.()||Math.random().toString(36).slice(2)+Date.now().toString(36);
  const nums={صفر:0,یک:1,یه:1,دو:2,سه:3,چهار:4,پنج:5,شش:6,شیش:6,هفت:7,هشت:8,نه:9,ده:10,یازده:11,دوازده:12,سیزده:13,چهارده:14,پانزده:15,شانزده:16,هفده:17,هجده:18,نوزده:19,بیست:20,بیست‌ویک:21,بیست‌ودو:22,بیست‌وسه:23};
  const wdays={شنبه:6,یکشنبه:0,دوشنبه:1,سه‌شنبه:2,سهشنبه:2,چهارشنبه:3,پنجشنبه:4,جمعه:5};
  let active=null,lastPlan=null;

  function spokenNum(v){v=norm(en(v)).replace(/ /g,'');if(/^\d{1,2}$/.test(v))return +v;if(nums[v]!=null)return nums[v];return null}
  function parseTime(q){
    const s=norm(en(q));
    const m=s.match(/ساعت(?:ی)?\s*(\d{1,2}|[آ-ی]+)(?:\s*[:٫.]\s*(\d{1,2}))?(?:\s*(?:و\s*)?(نیم|ربع))?/);
    if(!m)return'';
    let h=spokenNum(m[1]),min=m[2]?+m[2]:0;
    if(m[3]==='نیم')min=30;else if(m[3]==='ربع')min=15;
    if(h==null||h>23||min>59)return'';
    const around=s.slice(m.index,m.index+m[0].length+12);
    if(/عصر|شب/.test(around)&&h<12)h+=12;
    if(/ظهر/.test(around)&&h<7)h+=12;
    return String(h).padStart(2,'0')+':'+String(min).padStart(2,'0');
  }
  function parseDate(q){
    const s=norm(q);
    if(/پس\s*فردا/.test(s))return addDays(today(),2);
    if(/فردا/.test(s))return addDays(today(),1);
    if(/امروز/.test(s))return today();
    if(/هفته\s*(?:ی)?\s*بعد/.test(s)){const d=new Date();const gap=((6-d.getDay()+7)%7)||7;return addDays(today(),gap+7)}
    for(const [w,target] of Object.entries(wdays)){if(s.includes(w)){const d=new Date();let gap=(target-d.getDay()+7)%7;if(!gap)gap=7;if(/هفته\s*بعد/.test(s))gap+=7;return addDays(today(),gap)}}
    return''
  }
  function projectFor(q){try{const list=Array.isArray(db?.projects)?db.projects:[];const n=norm(q);let hit=null,best=0;for(const p of list){const name=norm(p.name);if(name&&n.includes(name)&&name.length>best){hit=p;best=name.length}}return hit}catch{return null}}
  function parsePeople(text){const m=norm(text).match(/(?:با|همراه)\s+(.+?)(?=\s+(?:در|تو|برای|پروژه|ساعت|امروز|فردا|پس\s*فردا)|$)/);return m?m[1].trim():''}
  function cleanTitle(q){
    let s=norm(q);
    s=s.replace(/ساعت\s*[۰-۹٠-٩0-9]{1,2}(?:\s*[:٫.]\s*[۰-۹٠-٩0-9]{1,2})?(?:\s*(?:و\s*)?(?:نیم|ربع))?/g,' ');
    s=s.replace(/پس\s*فردا|فردا|امروز|شنبه|یکشنبه|دوشنبه|سه.?شنبه|چهارشنبه|پنجشنبه|جمعه/g,' ');
    s=s.replace(/هر\s*روز|روزانه|هرروزه/g,' ');
    s=s.replace(/(?:برام|برای من|واسم|لطفا|لطفاً|میخوام|می‌خوام|می خواهم|می‌خواهم)/g,' ');
    s=s.replace(/(?:اضافه کن|ثبت کن|بساز|قرار بده|بذار|بگذار|یادم بنداز|یادم بینداز)/g,' ');
    s=s.replace(/(?:یه|یک)?\s*(?:کار|تسک)\s*(?:جدید)?/g,' ');
    s=s.replace(/(?:برای\s*)?(?:من\s*)?(?:یک\s*)?(?=جلسه|قرار)/g,' ');
    try{for(const p of db?.projects||[]){const name=norm(p.name);if(name)s=s.replace(new RegExp(name.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'),'g'),' ')}}catch(_){}
    return s.replace(/\s+/g,' ').replace(/^[،,:؛\-\s]+|[،,:؛\-\s]+$/g,'').trim();
  }
  function plan(q){
    const text=norm(q),project=projectFor(text),date=parseDate(text),time=parseTime(text),repeat=/هر\s*روز|روزانه|هرروزه/.test(text)?'daily':'none';
    const priority=/فوری|ضروری|خیلی مهم/.test(text)?'urgent':/مهم/.test(text)?'important':'normal';
    const area=/شخصی/.test(text)?'personal':/شرکت|کاری|کارهای روزمره|پیگیری|تماس/.test(text)?'work':'general';
    const looksMeeting=/(?:جلسه|جلصه|جسله|جلسه‌ای|می팅)/.test(text)||(/مهندس/.test(text)&&!!date&&!!time&&/(?:با|همراه)/.test(text));
    const type=looksMeeting?'meeting':/قرار/.test(text)?'appointment':/(?:یادآوری|یادم\s*(?:بنداز|بینداز)|ریمایندر)/.test(text)?'reminder':'task';
    const people=parsePeople(text);let title=cleanTitle(text)||text;
    if(type==='meeting')title='جلسه'+(people?' با '+people:'');
    if(type==='appointment'&&!/قرار/.test(title))title='قرار'+(people?' با '+people:'');
    if(type==='reminder')title=title.replace(/^(?:یادآوری|ریمایندر)\s*/,'').trim()||'یادآوری';
    return{type,title,people,project:project?.id||'general',projectName:project?.name||'بدون پروژه',area,date,time,repeat,priority,spoken:text};
  }
  function escapeHtml(s){return String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]))}
  function showPlan(p){
    lastPlan=p;$('afvPlan').style.display='block';
    const kind=p.type==='meeting'?'🟠 جلسه':p.type==='appointment'?'🟣 قرار':p.type==='reminder'?'🔵 یادآوری':'🟢 کار';
    $('afvPlan').innerHTML=`<b>${escapeHtml(p.title)}</b><br>${kind}<br>📁 ${escapeHtml(p.projectName)}${p.people?`<br>👤 ${escapeHtml(p.people)}`:''}${p.date?`<br>📅 ${p.date}`:''}${p.time?`<br>⏰ ${p.time}`:''}${p.repeat==='daily'?'<br>🔁 هر روز':''}`;
    $('afvConfirm').style.display='inline-block';$('afvState').textContent='اگر درست است، «اوکی، ثبت کن» را بزن؛ اگر اطلاعات درست است ثبتش کن؛ اگر نه دوباره بگو.';
  }
  function canNativeSpeech(){return !!(window.SpeechRecognition||window.webkitSpeechRecognition)}
  function nativeSpeech(){
    const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
    if(!SR)return Promise.reject(new Error('تشخیص گفتار فارسی روی این مرورگر در دسترس نیست.'));
    return new Promise((resolve,reject)=>{
      const rec=new SR();let finalText='',liveText='',done=false;
      rec.lang='fa-IR';rec.continuous=false;rec.interimResults=true;rec.maxAlternatives=8;
      const finish=(fn,v)=>{if(done)return;done=true;try{rec.stop()}catch(_){};fn(v)};
      const scoreCandidate=t=>{
        const s=norm(t);let sc=0;
        if(/فردا|امروز|پس\s*فردا|شنبه|یکشنبه|دوشنبه|سه.?شنبه|چهارشنبه|پنجشنبه|جمعه/.test(s))sc+=6;
        if(/ساعت/.test(s))sc+=6;
        if(/جلسه|جلصه|جسله|قرار/.test(s))sc+=8;
        if(/مهندس|دکتر|آقای|خانم|با\s/.test(s))sc+=4;
        if(/ثبت کن|بساز|بذار|بگذار|یادم بنداز/.test(s))sc+=3;
        if(/[۰-۹0-9]|دوازده|یازده|ده|نه|هشت|هفت|شش|پنج|چهار|سه|دو|یک/.test(s))sc+=3;
        sc+=Math.min(s.length/40,2);
        return sc;
      };
      rec.onstart=()=>{$('afvState').textContent='🔴 دارم گوش می‌دم… مثلاً بگو: «فردا ساعت ۱۲ جلسه با مهندس احمدی»';$('afvRetry').textContent='🎙 در حال شنیدن…'};
      rec.onresult=e=>{
        for(let i=e.resultIndex;i<e.results.length;i++){
          const res=e.results[i];let best='',bestScore=-1;
          for(let j=0;j<res.length;j++){
            const t=norm(res[j].transcript),sc=scoreCandidate(t);
            if(sc>bestScore){best=t;bestScore=sc}
          }
          if(res.isFinal)finalText+=(finalText?' ':'')+best;else liveText=best;
        }
        $('afvHeard').textContent=norm(finalText||liveText);
      };
      rec.onerror=e=>finish(reject,new Error(e?.error==='not-allowed'?'اجازه میکروفون بسته است.':e?.error==='no-speech'?'صدایی شنیده نشد؛ دوباره بگو.':'تشخیص صدا انجام نشد؛ دوباره امتحان کن.'));
      rec.onend=()=>{const t=norm(finalText||liveText||$('afvHeard').textContent);if(t)finish(resolve,t);else finish(reject,new Error('چیزی از صدات متوجه نشدم؛ دوباره بگو.'))};
      try{rec.start()}catch(e){reject(e)}
    });
  }

  function ensureUI(){
    if(!$('ariaFastVoiceSheet')){
      const d=document.createElement('dialog');d.id='ariaFastVoiceSheet';d.style.cssText='width:min(560px,94vw);border:0;border-radius:22px;background:#fff;color:#14202a;padding:16px;direction:rtl';
      d.innerHTML='<div style="display:flex;justify-content:space-between;align-items:center;gap:8px"><b style="font-size:18px">🎙 فرمان صوتی دقیق ARIA</b><button id="afvClose" class="ghost">بستن</button></div><div id="afvState" style="margin-top:12px;color:#7a8b96;font-size:13px">مثلاً بگو: «فردا ساعت ۱۲ جلسه با مهندس احمدی» — شروع کن، جمله را کامل بگو و برای پایان دوباره بزن</div><div id="afvHeard" style="margin-top:10px;padding:12px;border:1px solid #b8c6cf;border-radius:14px;min-height:54px;line-height:1.9"></div><div id="afvPlan" style="display:none;margin-top:10px;padding:12px;background:#f1f5f7;border-radius:14px;line-height:2"></div><div style="display:flex;gap:8px;margin-top:12px"><button id="afvRetry" style="flex:1">🎙 بگو</button><button id="afvConfirm" class="primary" style="flex:1;display:none">✓ اوکی، ثبت کن</button></div>';
      document.body.appendChild(d);
      $('afvClose').onclick=()=>{active?.cancel?.();active=null;try{d.close()}catch{d.removeAttribute('open')}};
      $('afvRetry').onclick=start;$('afvConfirm').onclick=commit;
    }
  }
  async function startRecorderFallback(){
    try{if(!window.ARIA_VOICE_ENGINE)throw new Error('موتور صدا هنوز آماده نشده.');active=await window.ARIA_VOICE_ENGINE.startRecorder({onState:t=>{$('afvState').textContent='🔴 '+t}});$('afvRetry').textContent='⏹ پایان صحبت'}catch(e){active=null;$('afvState').textContent=e?.message||'میکروفون شروع نشد.'}
  }
  async function ensureVoiceEngine(){
    if(window.ARIA_VOICE_ENGINE)return true;
    try{
      if(!document.querySelector('script[data-aria-voice-fast-engine]')){
        const s=document.createElement('script');s.src='./voice-engine.js?voicefast='+Date.now();s.dataset.ariaVoiceFastEngine='1';document.head.appendChild(s);
      }
      for(let i=0;i<40&&!window.ARIA_VOICE_ENGINE;i++)await new Promise(r=>setTimeout(r,100));
    }catch(_){}
    return !!window.ARIA_VOICE_ENGINE;
  }
  async function finishRecorder(){
    $('afvState').textContent='در حال تبدیل دقیق صدای فارسی…';
    active.stop();$('afvRetry').textContent='⏳ در حال تبدیل…';
    try{
      const text=await active.result;
      $('afvHeard').textContent=norm(text);
      const p=plan(text);showPlan(p);
      const missing=[];
      if((p.type==='meeting'||p.type==='appointment'||p.type==='reminder')&&!p.date)missing.push('روز');
      if((p.type==='meeting'||p.type==='appointment'||p.type==='reminder')&&!p.time)missing.push('ساعت');
      if(missing.length){$('afvConfirm').style.display='none';$('afvState').textContent=missing.length===1?(missing[0]==='ساعت'?'ساعت چند؟':'چه روزی؟'):('روز و ساعت مشخص نیست؛ چه روزی و ساعت چند؟')}else $('afvState').textContent='عالی، فهمیدم. اطلاعات را چک کن و «اوکی، ثبت کن» را بزن.';
    }catch(e){
      $('afvState').textContent=(e?.message||'صدا تشخیص داده نشد.')+' دوباره آرام و واضح بگو.';
    }finally{active=null;$('afvRetry').textContent='🎙 دوباره بگو'}
  }
  async function start(){
    ensureUI();const d=$('ariaFastVoiceSheet');try{if(!d.open)d.showModal()}catch{d.setAttribute('open','')}
    if(active&&active.result){await finishRecorder();return}
    if(active){active.stop?.();active=null;return}
    $('afvPlan').style.display='none';$('afvConfirm').style.display='none';$('afvHeard').textContent='';lastPlan=null;

    // Accurate path first: record real audio, then transcribe in Persian.
    const ready=await ensureVoiceEngine();
    if(ready&&navigator.mediaDevices?.getUserMedia&&window.MediaRecorder){
      $('afvState').textContent='🎙 آماده‌ام. جمله را طبیعی بگو؛ مثلاً «فردا ساعت ۱۲ جلسه با مهندس احمدی». برای پایان دوباره روی دکمه بزن.';
      await startRecorderFallback();
      return;
    }

    // Browser speech recognition is only a last fallback because Persian accuracy varies a lot.
    if(canNativeSpeech()){
      try{
        $('afvState').textContent='دارم فرمان فارسی را می‌شنوم…';
        const text=await nativeSpeech();
        $('afvHeard').textContent=norm(text);
        showPlan(plan(text));
        $('afvState').textContent='شنیدم. اطلاعات را چک کن و اگر درست است «اوکی، ثبت کن» را بزن.';
        $('afvRetry').textContent='🎙 دوباره بگو';
        return;
      }catch(e){$('afvState').textContent=e?.message||'تشخیص صدا انجام نشد.'}
    }
    $('afvState').textContent='موتور تشخیص صدا روی این دستگاه آماده نشد.';
    $('afvRetry').textContent='🎙 دوباره امتحان کن';
  }
  function commit(){
    if(!lastPlan)return;
    try{
      if(typeof db==='undefined'||!db)throw new Error('داده‌های ARIA هنوز آماده نیست.');
      if(lastPlan.type==='meeting'||lastPlan.type==='appointment'){
        db.meetings=db.meetings||[];
        db.meetings.push({id:uid(),title:lastPlan.title,date:lastPlan.date||today(),time:lastPlan.time,location:'',people:lastPlan.people||'',notes:lastPlan.type==='appointment'?'قرار ثبت‌شده با صدا':'جلسه ثبت‌شده با صدا',actions:[],createdAt:new Date().toISOString()});
      }else{
        db.tasks=db.tasks||[];
        db.tasks.push({id:uid(),title:lastPlan.title,project:lastPlan.project,area:lastPlan.area,description:lastPlan.type==='reminder'?'یادآوری ثبت‌شده با صدا':'',date:lastPlan.date,time:lastPlan.time,priority:lastPlan.priority,status:'todo',repeat:lastPlan.repeat,subtasks:[],attachments:[],drawing:null,createdAt:Date.now(),meta:{voiceCreated:true,voiceSource:lastPlan.spoken,voiceType:lastPlan.type}});
      
      }
      if(typeof save==='function')save();else localStorage.setItem('ARIA_ASSISTANT_PRO_V2',JSON.stringify(db));
      $('afvState').textContent='✓ '+(lastPlan.type==='meeting'?'جلسه':lastPlan.type==='appointment'?'قرار':lastPlan.type==='reminder'?'یادآوری':'کار')+' ثبت شد';$('afvConfirm').style.display='none';
      setTimeout(()=>{try{$('ariaFastVoiceSheet').close()}catch(_){};try{if(typeof render==='function')render()}catch(_){}},500);
    }catch(e){$('afvState').textContent=e?.message||'ثبت انجام نشد.'}
  }
  function rebindOldButton(){const old=$('ariaVoiceBtn');if(!old||old.dataset.fastVoice==='5')return;const b=old.cloneNode(true);old.replaceWith(b);b.id='ariaVoiceBtn';b.dataset.fastVoice='5';b.textContent='🎙 گفتن';b.onclick=e=>{e.preventDefault();e.stopPropagation();start()}}
  function boot(){ensureUI();rebindOldButton();setInterval(rebindOldButton,1800)}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
  window.ARIA_FAST_VOICE={start,plan};
})();
