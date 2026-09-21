(function(){
  if(window.__ARIA_LUX_HUB_V1)return; window.__ARIA_LUX_HUB_V1=true;

  const css=document.createElement('style');
  css.id='ariaLuxHubStyle';
  css.textContent=`
    #ariaPermanentAiBtn,#ariaVoiceTalkBtn,#ariaQuickVoice,#ariaMentalRestFab,#ariaMentalRestTop,#ariaMentalRestNav,.ariaFab{display:none!important;visibility:hidden!important;opacity:0!important;pointer-events:none!important}
    #ariaLuxHub{position:fixed;left:50%;transform:translateX(-50%);bottom:calc(88px + env(safe-area-inset-bottom));z-index:2147483646;font-family:inherit}
    .alhTrigger{height:52px;padding:0 16px;border-radius:18px;border:1px solid rgba(255,255,255,.13);background:linear-gradient(135deg,rgba(10,25,40,.96),rgba(18,42,55,.96));backdrop-filter:blur(22px) saturate(1.2);-webkit-backdrop-filter:blur(22px) saturate(1.2);box-shadow:0 16px 38px rgba(0,0,0,.42),inset 0 1px 0 rgba(255,255,255,.09);display:flex;align-items:center;gap:9px;color:#eefcff;font-weight:900}
    .alhTrigger .orb{width:31px;height:31px;border-radius:11px;display:grid;place-items:center;background:linear-gradient(145deg,#4f7cff,#2dd4bf);box-shadow:0 0 22px rgba(45,212,191,.28)}
    .alhPanel{position:absolute;left:50%;bottom:62px;transform:translateX(-50%) translateY(8px) scale(.98);width:min(520px,94vw);padding:12px;border-radius:24px;border:1px solid rgba(255,255,255,.13);background:linear-gradient(155deg,rgba(10,20,30,.985),rgba(15,31,43,.985));box-shadow:0 24px 60px rgba(0,0,0,.55),inset 0 1px 0 rgba(255,255,255,.08);backdrop-filter:blur(28px) saturate(1.25);-webkit-backdrop-filter:blur(28px) saturate(1.25);opacity:0;pointer-events:none;transition:.18s ease}
    #ariaLuxHub.open .alhPanel{opacity:1;pointer-events:auto;transform:translateX(-50%) translateY(0) scale(1)}
    .alhTitle{display:flex;align-items:center;justify-content:space-between;padding:2px 4px 10px;color:#d8e7ef;font-size:12px}.alhTitle b{font-size:13px;color:#fff}
    .alhGrid{display:grid;grid-template-columns:repeat(5,1fr);gap:8px}
    .alhItem{min-width:0;padding:11px 7px 9px;border-radius:17px;border:1px solid rgba(255,255,255,.08);background:linear-gradient(160deg,rgba(255,255,255,.055),rgba(255,255,255,.025));display:grid;gap:6px;place-items:center;color:#f2f8fb}
    .alhItem:active{transform:scale(.97)}
    .alhIcon{width:42px;height:42px;border-radius:14px;display:grid;place-items:center;font-size:20px;box-shadow:inset 0 1px 0 rgba(255,255,255,.2)}
    .alhItem span:last-child{font-size:10px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:100%}
    .alhAi{background:linear-gradient(145deg,#4f7cff,#2dd4bf)}.alhTalk{background:linear-gradient(145deg,#7657ff,#3f8cff)}.alhMic{background:linear-gradient(145deg,#2b3d50,#17222c)}.alhAsk{background:linear-gradient(145deg,#1f8ea5,#2dd4bf)}.alhRest{background:linear-gradient(145deg,#153b72,#365fe7)}
    @media(min-width:851px){#ariaLuxHub{left:34px;transform:none;bottom:28px}.alhPanel{left:0;transform:translateY(8px);transform-origin:left bottom}#ariaLuxHub.open .alhPanel{transform:translateY(0)}}
    @media(max-width:520px){.alhGrid{grid-template-columns:repeat(3,1fr)}.alhPanel{width:min(360px,94vw)}}
  `;
  document.head.appendChild(css);

  function addScript(src,cb){const s=document.createElement('script');s.src=src+(src.includes('?')?'&':'?')+'hub='+Date.now();s.onload=()=>setTimeout(cb,50);document.head.appendChild(s)}
  function openAI(){
    const d=document.getElementById('ariaBrainDialog'); if(d){try{d.showModal()}catch{d.setAttribute('open','')}return}
    if(window.ARIA_BRAIN?.open){window.ARIA_BRAIN.open();return}
    addScript('./aria-brain.js',()=>window.ARIA_BRAIN?.open?.());
  }
  function openTalk(){
    if(window.ARIA_VOICE_CONVERSATION?.open){window.ARIA_VOICE_CONVERSATION.open();return}
    addScript('./voice-conversation.js',()=>window.ARIA_VOICE_CONVERSATION?.open?.());
  }
  function openMic(){
    if(window.ARIA_FAST_VOICE?.start){window.ARIA_FAST_VOICE.start();return}
    addScript('./voice-fast.js',()=>window.ARIA_FAST_VOICE?.start?.());
  }
  function openAsk(){
    const d=document.getElementById('ariaAskDialog'); if(d){try{d.showModal()}catch{d.setAttribute('open','')}return}
    document.querySelector('.ariaFab')?.click();
  }
  function openRest(){ if(window.ARIA_MENTAL_REST?.open){window.ARIA_MENTAL_REST.open();return} addScript('./mental-rest.js',()=>window.ARIA_MENTAL_REST?.open?.()) }

  function removeStandaloneFocus(){
    document.querySelectorAll('[data-view="focus"]').forEach(x=>x.remove());
    document.querySelectorAll('button[onclick]').forEach(b=>{const o=b.getAttribute('onclick')||'';if(/view\s*=\s*['"]focus['"]/.test(o))b.remove()});
    try{if(typeof view!=='undefined'&&view==='focus'){view='today';typeof render==='function'&&render()}}catch(_){}
  }

  function build(){
    removeStandaloneFocus();
    if(document.getElementById('ariaLuxHub'))return;
    const w=document.createElement('div');w.id='ariaLuxHub';
    w.innerHTML=`
      <div class="alhPanel">
        <div class="alhTitle"><b>ARIA Command Center</b><span>همه ابزارهای هوشمند، یک‌جا</span></div>
        <div class="alhGrid">
          <button class="alhItem" data-a="ai"><span class="alhIcon alhAi">✦</span><span>AI</span></button>
          <button class="alhItem" data-a="talk"><span class="alhIcon alhTalk">🎧</span><span>گفتگو</span></button>
          <button class="alhItem" data-a="mic"><span class="alhIcon alhMic">🎙</span><span>ثبت صوتی</span></button>
          <button class="alhItem" data-a="ask"><span class="alhIcon alhAsk">➜</span><span>به ARIA بگو</span></button>
          <button class="alhItem" data-a="rest"><span class="alhIcon alhRest">🧠</span><span>استراحت ذهن</span></button>
        </div>
      </div>
      <button class="alhTrigger" type="button"><span class="orb">✦</span><span>ARIA</span></button>`;
    document.body.appendChild(w);
    w.querySelector('.alhTrigger').onclick=()=>w.classList.toggle('open');
    w.querySelectorAll('[data-a]').forEach(b=>b.onclick=()=>{
      w.classList.remove('open');
      const a=b.dataset.a;
      if(a==='ai')openAI(); else if(a==='talk')openTalk(); else if(a==='mic')openMic(); else if(a==='ask')openAsk(); else if(a==='rest')openRest();
    });
    document.addEventListener('click',e=>{if(!w.contains(e.target))w.classList.remove('open')});
  }

  function maintain(){removeStandaloneFocus();build()}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',maintain);else maintain();
  new MutationObserver(maintain).observe(document.documentElement,{childList:true,subtree:true});
  window.addEventListener('pageshow',maintain);
})();