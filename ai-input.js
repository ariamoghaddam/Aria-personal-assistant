(function(){
  const cfg=window.ARIA_CLOUD||{};
  let mediaRecorder=null, chunks=[], stream=null, recording=false;

  function $(id){return document.getElementById(id)}
  function setMsg(t,ok=false){const e=$('ariaAskResult');if(e){e.textContent=t;e.style.color=ok?'#91f3cf':''}}
  function sleep(ms){return new Promise(r=>setTimeout(r,ms))}

  async function waitForAsk(){
    for(let i=0;i<80;i++){
      if($('ariaAskDialog')&&$('ariaAskText')&&$('ariaVoiceBtn'))return true;
      await sleep(100);
    }
    return false;
  }

  function findAccessToken(obj,depth=0){
    if(!obj||depth>6)return '';
    if(typeof obj==='object'){
      if(typeof obj.access_token==='string'&&obj.access_token.trim())return obj.access_token.trim();
      for(const k of Object.keys(obj)){
        const v=findAccessToken(obj[k],depth+1);if(v)return v;
      }
    }
    return '';
  }

  function getToken(){
    try{
      const preferred=`sb-${new URL(cfg.supabaseUrl).hostname.split('.')[0]}-auth-token`;
      const keys=[preferred,...Object.keys(localStorage).filter(k=>k.startsWith('sb-')&&k.includes('auth-token'))];
      for(const k of [...new Set(keys)]){
        const raw=localStorage.getItem(k);if(!raw)continue;
        try{const token=findAccessToken(JSON.parse(raw));if(token)return token}catch(_){ }
      }
    }catch(_){ }
    throw new Error('برای استفاده از هوش مصنوعی باید یک‌بار از حساب ARIA خارج و دوباره وارد شوی.');
  }

  async function callAI(mode,body){
    const token=getToken();
    const url=`/api/aria-ai?mode=${encodeURIComponent(mode)}&t=${encodeURIComponent(token)}`;
    const r=await fetch(url,{method:'POST',body,cache:'no-store',credentials:'same-origin'});
    const text=await r.text();
    let out={};try{out=text?JSON.parse(text):{}}catch{out={detail:text||'پاسخ نامعتبر از سرور'}}
    if(!r.ok){
      if(out?.error==='OPENAI_API_KEY_MISSING')throw new Error('کلید هوش مصنوعی هنوز روی سرور تنظیم نشده.');
      if(out?.error==='unauthorized')throw new Error('ورود ARIA منقضی شده؛ یک‌بار از حساب خارج و دوباره وارد شو.');
      throw new Error(out?.detail||out?.error||`خطای سرور (${r.status})`);
    }
    return out;
  }

  function installHandwritingDialog(){
    if($('ariaHandwritingDialog'))return;
    const d=document.createElement('dialog');d.id='ariaHandwritingDialog';
    d.innerHTML=`<div style="min-width:min(720px,86vw)">
      <div class="sectionHead"><b>✍️ دست‌خط فارسی</b><button class="ghost" type="button" id="ariaHandClose">بستن</button></div>
      <div class="sub" style="margin:8px 0">با Apple Pencil یا انگشت داخل کادر بنویس؛ ARIA خودش متن فارسی را می‌خواند.</div>
      <canvas id="ariaHandCanvas" style="display:block;width:100%;height:300px;background:#fff;border-radius:14px;touch-action:none"></canvas>
      <div class="ariaMenu"><button type="button" id="ariaHandClear">پاک کردن</button><button type="button" class="primary" id="ariaHandRead">خواندن دست‌خط</button></div>
      <div id="ariaHandMsg" class="sub"></div>
    </div>`;
    document.body.appendChild(d);
    const c=$('ariaHandCanvas'),ctx=c.getContext('2d');let drawing=false,last=null;
    function resize(){const r=c.getBoundingClientRect(),q=Math.max(1,window.devicePixelRatio||1);c.width=Math.round(r.width*q);c.height=Math.round(300*q);ctx.setTransform(q,0,0,q,0,0);ctx.fillStyle='#fff';ctx.fillRect(0,0,r.width,300);ctx.strokeStyle='#111';ctx.lineWidth=3;ctx.lineCap='round';ctx.lineJoin='round'}
    function pos(e){const r=c.getBoundingClientRect();return{x:e.clientX-r.left,y:e.clientY-r.top}}
    c.addEventListener('pointerdown',e=>{drawing=true;last=pos(e);c.setPointerCapture?.(e.pointerId);e.preventDefault()});
    c.addEventListener('pointermove',e=>{if(!drawing)return;const p=pos(e);ctx.beginPath();ctx.moveTo(last.x,last.y);ctx.lineTo(p.x,p.y);ctx.stroke();last=p;e.preventDefault()});
    const up=e=>{drawing=false;last=null;e?.preventDefault?.()};c.addEventListener('pointerup',up);c.addEventListener('pointercancel',up);
    $('ariaHandClear').onclick=resize;$('ariaHandClose').onclick=()=>d.close();
    $('ariaHandRead').onclick=async()=>{const btn=$('ariaHandRead'),msg=$('ariaHandMsg');try{btn.disabled=true;msg.textContent='در حال خواندن دست‌خط فارسی...';const out=await callAI('handwriting',JSON.stringify({image:c.toDataURL('image/png')}));const text=(out.text||'').trim();if(!text)throw new Error('متنی تشخیص داده نشد.');$('ariaAskText').value=text;$('ariaAskText').dir='rtl';$('ariaAskText').lang='fa';msg.textContent='خوانده شد ✓';setMsg('دست‌خط به متن فارسی تبدیل شد.',true);d.close()}catch(e){msg.textContent=e.message||String(e)}finally{btn.disabled=false}};
    window.ARIA_openHandwriting=()=>{d.showModal();setTimeout(resize,60)};
  }

  async function startRecording(){
    if(recording)return;
    if(!navigator.mediaDevices?.getUserMedia||!window.MediaRecorder)throw new Error('ضبط صدا در این مرورگر پشتیبانی نمی‌شود.');
    stream=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:true,noiseSuppression:true}});
    const preferred=['audio/mp4','audio/webm;codecs=opus','audio/webm'];
    const mime=preferred.find(x=>MediaRecorder.isTypeSupported?.(x))||'';
    mediaRecorder=new MediaRecorder(stream,mime?{mimeType:mime}:undefined);chunks=[];
    mediaRecorder.ondataavailable=e=>{if(e.data&&e.data.size)chunks.push(e.data)};
    mediaRecorder.onstop=async()=>{const btn=$('ariaVoiceBtn');try{const type=mediaRecorder.mimeType||chunks[0]?.type||'audio/mp4';const blob=new Blob(chunks,{type});if(blob.size<500)throw new Error('صدای کافی ضبط نشد.');btn.disabled=true;btn.textContent='⏳ تبدیل به متن...';setMsg('در حال تبدیل صدای فارسی به متن...');const out=await callAI('transcribe',blob);const text=(out.text||'').trim();if(!text)throw new Error('متنی از صدا تشخیص داده نشد.');$('ariaAskText').value=text;$('ariaAskText').dir='rtl';$('ariaAskText').lang='fa';setMsg('صدای فارسی به متن تبدیل شد ✓',true)}catch(e){setMsg(e.message||String(e))}finally{stream?.getTracks?.().forEach(t=>t.stop());stream=null;mediaRecorder=null;chunks=[];recording=false;btn.disabled=false;btn.textContent='🎙 گفتن'}};
    mediaRecorder.start();recording=true;$('ariaVoiceBtn').textContent='⏹ پایان گفتن';setMsg('دارم گوش می‌دم؛ فارسی صحبت کن و بعد «پایان گفتن» رو بزن.');
  }
  function stopRecording(){if(recording&&mediaRecorder&&mediaRecorder.state!=='inactive')mediaRecorder.stop()}

  async function install(){
    if(!await waitForAsk())return;
    const ta=$('ariaAskText'),vb=$('ariaVoiceBtn');
    ta.setAttribute('lang','fa');ta.setAttribute('dir','rtl');ta.setAttribute('inputmode','text');ta.style.textAlign='right';ta.placeholder='اینجا فارسی تایپ کن؛ یا از «گفتن» و «دست‌خط فارسی» استفاده کن.';
    vb.style.display='';vb.disabled=false;vb.textContent='🎙 گفتن';
    vb.onclick=async()=>{try{if(recording)stopRecording();else await startRecording()}catch(e){setMsg(e.message||String(e));recording=false;vb.textContent='🎙 گفتن'}};
    installHandwritingDialog();
    if(!$('ariaHandwritingBtn')){const b=document.createElement('button');b.id='ariaHandwritingBtn';b.type='button';b.textContent='✍️ دست‌خط فارسی';b.onclick=()=>window.ARIA_openHandwriting();vb.parentElement?.insertBefore(b,vb.nextSibling)}
    setMsg('ورودی فارسی آماده است: صدا را ضبط کن یا از کادر دست‌خط فارسی استفاده کن.');
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(install,300));else setTimeout(install,300);
})();