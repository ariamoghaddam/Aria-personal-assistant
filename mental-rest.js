(function(){
  if(window.__ARIA_MENTAL_REST_V1)return;window.__ARIA_MENTAL_REST_V1=true;
  const KEY='ARIA_MENTAL_REST_V1';
  const $=id=>document.getElementById(id);
  let timer=null,endAt=0,audioCtx=null,noiseNode=null,gainNode=null;

  const brainIcon=`
  <svg viewBox="0 0 120 120" width="74" height="74" aria-hidden="true">
    <defs>
      <linearGradient id="mbg" x1="0" x2="1"><stop stop-color="#0b2a5a"/><stop offset="1" stop-color="#08243d"/></linearGradient>
      <linearGradient id="mbr" x1="0" x2="1"><stop stop-color="#55e3ff"/><stop offset=".55" stop-color="#4b8dff"/><stop offset="1" stop-color="#7d66ff"/></linearGradient>
      <filter id="mg"><feGaussianBlur stdDeviation="2.2" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
    </defs>
    <rect x="4" y="4" width="112" height="112" rx="28" fill="url(#mbg)" stroke="#39d7ff" stroke-width="2"/>
    <path d="M33 70c-10-2-16-12-12-22 2-6 7-10 14-11 2-10 11-17 21-16 7-8 22-7 28 2 10-1 19 6 20 16 9 3 13 14 8 22-2 11-13 17-23 13-7 8-20 10-29 4-10 4-22 0-27-8Z" fill="url(#mbr)" filter="url(#mg)"/>
    <path d="M39 42c9 3 13 10 11 20m11-33c-5 8-3 15 4 19m17-18c-8 7-8 17-1 24m17-7c-9 1-15 8-15 17M45 75c6-7 13-9 21-6m4-12c8-4 16-3 23 3" fill="none" stroke="#b7f7ff" stroke-width="4" stroke-linecap="round" opacity=".8"/>
    <path d="M38 67c5 4 10 4 15 0M66 69c5 4 10 4 15 0" fill="none" stroke="#071b3f" stroke-width="4" stroke-linecap="round"/>
    <path d="M18 25c15 8 25 3 31-4M74 18c14 0 25 5 31 14" fill="none" stroke="#7ff6ff" stroke-width="2" opacity=".65"/>
  </svg>`;

  function build(){
    if($('ariaMentalRestDialog'))return;
    const style=document.createElement('style');style.textContent=`
      #ariaMentalRestDialog{width:min(760px,96vw);max-height:94vh;padding:0;border-radius:24px;overflow:auto}
      .mrHead{padding:18px;background:linear-gradient(135deg,#082247,#0b2d47 55%,#0b4b4c);border-bottom:1px solid var(--line)}
      .mrHero{display:flex;gap:14px;align-items:center}.mrHero h2{margin:0;font-size:24px}.mrHero p{margin:5px 0 0;color:#c6d6df}
      .mrBody{padding:14px;display:grid;gap:12px}.mrGrid{display:grid;grid-template-columns:1fr 1fr;gap:10px}
      .mrCard{background:var(--panel2);border:1px solid var(--line);border-radius:18px;padding:14px}.mrCard h3{margin:0 0 5px;font-size:15px}.mrCard p{margin:0;color:var(--muted);font-size:12px}
      .mrBtns{display:flex;gap:7px;flex-wrap:wrap;margin-top:10px}.mrBtns button{padding:8px 10px}
      .mrPrimary{background:linear-gradient(135deg,#4f7cff,#2dd4bf)!important;font-weight:900}.mrTimer{font-size:34px;font-weight:900;text-align:center;margin:8px 0}
      .mrBreathOrb{width:120px;height:120px;border-radius:50%;margin:10px auto;background:radial-gradient(circle at 35% 35%,#78f7ff,#4f7cff 55%,#233056);box-shadow:0 0 40px rgba(65,215,255,.32);transition:transform 4s ease-in-out}
      .mrBreathOrb.in{transform:scale(1.25)}.mrBreathOrb.out{transform:scale(.86)}
      .mrMood{display:flex;gap:7px;flex-wrap:wrap}.mrMood button.active{outline:2px solid var(--accent)}
      .mrDump{min-height:120px}.mrNote{padding:10px;border-radius:12px;background:#0d151c;color:#dce7ed;font-size:12px;margin-top:8px}
      @media(max-width:700px){.mrGrid{grid-template-columns:1fr}.mrHero h2{font-size:21px}}
    `;document.head.appendChild(style);

    const d=document.createElement('dialog');d.id='ariaMentalRestDialog';
    d.innerHTML=`
      <div class="mrHead">
        <div class="sectionHead"><b>استراحت ذهن</b><button class="ghost" id="mrClose">بستن</button></div>
        <div class="mrHero">
          <div>${brainIcon}</div>
          <div><h2>ذهنت خسته شده؟</h2><p>چند دقیقه از فشار کار فاصله بگیر، ذهنت را خالی کن و بعد با انرژی بهتر برگرد.</p></div>
        </div>
      </div>
      <div class="mrBody">
        <div class="mrCard">
          <h3>الان حالت چطوره؟</h3>
          <div class="mrMood" id="mrMood">
            <button data-mood="tired">😮‍💨 خسته‌ام</button><button data-mood="bored">😐 بی‌حوصله‌ام</button><button data-mood="busy">😵‍💫 ذهنم شلوغه</button><button data-mood="ok">🙂 اوکی شدم</button>
          </div>
        </div>

        <div class="mrGrid">
          <div class="mrCard">
            <h3>🫁 تنفس آرام</h3><p>برای چند دقیقه ریتم ذهن را پایین بیاور.</p>
            <div class="mrBreathOrb" id="mrBreathOrb"></div>
            <div class="mrTimer" id="mrBreathTime">00:00</div>
            <div class="mrBtns"><button onclick="ARIA_MENTAL_REST.startBreathing(60)">۱ دقیقه</button><button onclick="ARIA_MENTAL_REST.startBreathing(180)">۳ دقیقه</button><button onclick="ARIA_MENTAL_REST.startBreathing(300)">۵ دقیقه</button></div>
          </div>

          <div class="mrCard">
            <h3>🧠 تخلیه ذهن</h3><p>هرچی تو ذهنت می‌چرخه، بدون مرتب‌کردن بریز اینجا.</p>
            <textarea class="mrDump" id="mrDump" placeholder="هرچی هست بنویس... کار، نگرانی، ایده، پیگیری..."></textarea>
            <div class="mrBtns"><button class="mrPrimary" id="mrSort">✦ مرتبش کن</button><button id="mrSaveDump">ذخیره</button><button id="mrClearDump">پاک</button></div>
            <div class="mrNote" id="mrDumpResult" style="display:none"></div>
          </div>

          <div class="mrCard">
            <h3>👁 استراحت چشم</h3><p>۲۰ ثانیه به نقطه‌ای دور نگاه کن؛ صفحه را کنار بگذار.</p>
            <div class="mrBtns"><button onclick="ARIA_MENTAL_REST.startBreak(20,'چشم‌ها')">شروع ۲۰ ثانیه</button></div>
          </div>

          <div class="mrCard">
            <h3>🎧 صدای آرام</h3><p>یک صدای نرم و یکنواخت برای چند دقیقه فاصله گرفتن.</p>
            <div class="mrBtns"><button id="mrSound">شروع صدا</button><button id="mrStopSound">قطع</button></div>
          </div>

          <div class="mrCard">
            <h3>⏱ وقفه کوتاه</h3><p>برای ۵، ۱۰ یا ۱۵ دقیقه هیچ کاری لازم نیست انجام بدهی.</p>
            <div class="mrTimer" id="mrBreakTime">00:00</div>
            <div class="mrBtns"><button onclick="ARIA_MENTAL_REST.startBreak(300,'استراحت')">۵ دقیقه</button><button onclick="ARIA_MENTAL_REST.startBreak(600,'استراحت')">۱۰ دقیقه</button><button onclick="ARIA_MENTAL_REST.startBreak(900,'استراحت')">۱۵ دقیقه</button></div>
          </div>

          <div class="mrCard">
            <h3>🎯 برگشت به کار</h3><p>وقتی آماده شدی، ARIA یک کار باز را برای شروع دوباره جلویت می‌گذارد.</p>
            <div class="mrBtns"><button class="mrPrimary" id="mrBack">برگشت با یک کار</button></div>
            <div class="mrNote" id="mrBackNote" style="display:none"></div>
          </div>
        </div>

        <div class="mrCard">
          <h3>💡 چه زمانی از این بخش استفاده کنم؟</h3>
          <p>وقتی چند کار هم‌زمان توی ذهنت می‌چرخد، خسته‌ای، تمرکزت افت کرده، یا حس می‌کنی داری فقط بین کارها جابه‌جا می‌شوی بدون اینکه چیزی جلو برود.</p>
        </div>
      </div>`;
    document.body.appendChild(d);

    $('mrClose').onclick=()=>d.close();
    $('mrMood').onclick=e=>{const b=e.target.closest('button[data-mood]');if(!b)return;[...$('mrMood').children].forEach(x=>x.classList.remove('active'));b.classList.add('active');localStorage.setItem(KEY+'_MOOD',b.dataset.mood)};
    $('mrSaveDump').onclick=()=>{const v=$('mrDump').value.trim();localStorage.setItem(KEY+'_DUMP',v);$('mrDumpResult').style.display='block';$('mrDumpResult').textContent=v?'ذخیره شد. لازم نیست الان همه‌چیز را حل کنی.':'چیزی برای ذخیره نبود.'};
    $('mrClearDump').onclick=()=>{$('mrDump').value='';localStorage.removeItem(KEY+'_DUMP');$('mrDumpResult').style.display='none'};
    $('mrSort').onclick=sortDump;
    $('mrSound').onclick=startSound;$('mrStopSound').onclick=stopSound;
    $('mrBack').onclick=backToWork;
  }

  function stopTimer(){if(timer){clearInterval(timer);timer=null}}
  function countdown(sec,el,label,done){stopTimer();endAt=Date.now()+sec*1000;const tick=()=>{const left=Math.max(0,Math.ceil((endAt-Date.now())/1000));if(el)el.textContent=String(Math.floor(left/60)).padStart(2,'0')+':'+String(left%60).padStart(2,'0');if(!left){stopTimer();done?.();}};tick();timer=setInterval(tick,250)}
  function startBreathing(sec){const orb=$('mrBreathOrb');let inhale=true;const cycle=()=>{if(!orb)return;orb.classList.toggle('in',inhale);orb.classList.toggle('out',!inhale);inhale=!inhale};cycle();const iv=setInterval(cycle,4000);countdown(sec,$('mrBreathTime'),'تنفس',()=>{clearInterval(iv);orb?.classList.remove('in','out');try{navigator.vibrate?.(80)}catch(_){};alert('استراحت تنفسی تمام شد. اگر بهتر شدی، آرام برگرد سر کار.')})}
  function startBreak(sec,label){countdown(sec,$('mrBreakTime'),label,()=>{try{navigator.vibrate?.([80,80,80])}catch(_){};alert(label+' تمام شد. عجله نکن؛ اگر آماده‌ای برگرد.')})}

  async function sortDump(){
    const text=$('mrDump').value.trim(),box=$('mrDumpResult');box.style.display='block';
    if(!text){box.textContent='اول هرچی تو ذهنت هست بنویس.';return}
    box.textContent='دارم سبک و مرتبش می‌کنم…';
    try{
      if(window.ARIA_BRAIN?.ask){
        const r=await window.ARIA_BRAIN.ask('این تخلیه ذهن من است. خیلی کوتاه و بدون نصیحت، فقط در سه بخش مرتبش کن: الان / بعداً / رها کن. متن: '+text);
        box.textContent=r?.text||String(r);
      }else{
        const bits=text.split(/[\n،,؛;]/).map(x=>x.trim()).filter(Boolean);
        box.textContent='الان: '+(bits[0]||'—')+'\nبعداً: '+(bits.slice(1,3).join('، ')||'—')+'\nرها کن: لازم نیست همین الان بقیه چیزها را حل کنی.';
      }
    }catch(_){box.textContent='فعلاً مرتب‌سازی هوشمند در دسترس نیست؛ نوشته‌ات همین‌جا ذخیره می‌ماند.'}
  }

  function startSound(){
    try{
      stopSound();audioCtx=new (window.AudioContext||window.webkitAudioContext)();
      const sr=audioCtx.sampleRate,buf=audioCtx.createBuffer(1,sr*2,sr),data=buf.getChannelData(0);let last=0;
      for(let i=0;i<data.length;i++){const white=Math.random()*2-1;last=(last+0.02*white)/1.02;data[i]=last*3.2}
      noiseNode=audioCtx.createBufferSource();noiseNode.buffer=buf;noiseNode.loop=true;
      gainNode=audioCtx.createGain();gainNode.gain.value=.045;noiseNode.connect(gainNode).connect(audioCtx.destination);noiseNode.start();
    }catch(_){alert('صدا روی این دستگاه شروع نشد.')}
  }
  function stopSound(){try{noiseNode?.stop()}catch(_){}try{audioCtx?.close()}catch(_){}noiseNode=null;audioCtx=null;gainNode=null}

  function backToWork(){
    const box=$('mrBackNote');
    let candidate=null;
    try{
      if(typeof db!=='undefined'){
        const rank={urgent:0,important:1,normal:2};
        candidate=[...(db.tasks||[])].filter(t=>t.status!=='done').sort((a,b)=>(rank[a.priority]??9)-(rank[b.priority]??9)||String(a.date||'9999').localeCompare(String(b.date||'9999')))[0]||null;
      }
    }catch(_){}
    if(!candidate){box.style.display='block';box.textContent='فعلاً کار بازی برای پیشنهاد پیدا نکردم.';return}
    box.style.display='block';box.textContent='پیشنهاد برای شروع: '+candidate.title;
    setTimeout(()=>{try{$('ariaMentalRestDialog')?.close()}catch(_){};if(window.ARIA_FOCUS_TASK)window.ARIA_FOCUS_TASK(candidate.id);else if(window.openTaskById)window.openTaskById(candidate.id)},450)
  }

  function open(){build();$('mrDump').value=localStorage.getItem(KEY+'_DUMP')||'';try{$('ariaMentalRestDialog').showModal()}catch(_){$('ariaMentalRestDialog').setAttribute('open','')}}
  function inject(){ /* Entry point is provided by the unified ARIA hub. */ }

  build();
  window.ARIA_MENTAL_REST={open,startBreathing,startBreak,stopSound};
})();