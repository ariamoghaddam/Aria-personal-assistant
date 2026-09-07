(function(){
  let stream=null,audioCtx=null,source=null,processor=null,recording=false,parts=[],startedAt=0,timer=null;
  const $=id=>document.getElementById(id);
  const msg=t=>{const e=$('ariaAskResult');if(e)e.textContent=t};

  function token(){
    const keys=Object.keys(localStorage).filter(k=>k.startsWith('sb-')&&k.includes('auth-token'));
    for(const k of keys){
      try{
        const o=JSON.parse(localStorage.getItem(k)||'null');
        const walk=x=>{if(!x||typeof x!=='object')return'';if(typeof x.access_token==='string')return x.access_token;for(const v of Object.values(x)){const t=walk(v);if(t)return t}return''};
        const t=walk(o);if(t)return t;
      }catch(_){ }
    }
    throw new Error('برای استفاده از هوش مصنوعی یک‌بار از حساب ARIA خارج و دوباره وارد شو.');
  }

  function post(mode,body){
    return new Promise((resolve,reject)=>{
      const x=new XMLHttpRequest();
      x.open('POST',`/api/aria-ai?mode=${encodeURIComponent(mode)}&t=${encodeURIComponent(token())}&guard=26`,true);
      x.timeout=90000;
      x.onload=()=>{let o={};try{o=JSON.parse(x.responseText||'{}')}catch(_){o={detail:x.responseText}};if(x.status>=200&&x.status<300)resolve(o);else reject(new Error(o.detail||o.error||`خطای سرور ${x.status}`))};
      x.onerror=()=>reject(new Error('ارتباط با سرور برقرار نشد.'));
      x.ontimeout=()=>reject(new Error('پاسخ سرور طول کشید.'));
      try{x.send(body)}catch(e){reject(e)}
    });
  }

  function wavBlob(chunks,sampleRate){
    const n=chunks.reduce((s,a)=>s+a.length,0), samples=new Float32Array(n);let p=0;
    for(const a of chunks){samples.set(a,p);p+=a.length}
    const buf=new ArrayBuffer(44+samples.length*2),v=new DataView(buf);
    const str=(o,s)=>{for(let i=0;i<s.length;i++)v.setUint8(o+i,s.charCodeAt(i))};
    str(0,'RIFF');v.setUint32(4,36+samples.length*2,true);str(8,'WAVE');str(12,'fmt ');v.setUint32(16,16,true);v.setUint16(20,1,true);v.setUint16(22,1,true);v.setUint32(24,sampleRate,true);v.setUint32(28,sampleRate*2,true);v.setUint16(32,2,true);v.setUint16(34,16,true);str(36,'data');v.setUint32(40,samples.length*2,true);
    let o=44;for(let i=0;i<samples.length;i++){let s=Math.max(-1,Math.min(1,samples[i]));v.setInt16(o,s<0?s*0x8000:s*0x7fff,true);o+=2}
    return new Blob([buf],{type:'audio/wav'});
  }

  function cleanup(){
    clearInterval(timer);timer=null;
    try{processor?.disconnect()}catch(_){} try{source?.disconnect()}catch(_){}
    try{stream?.getTracks()?.forEach(t=>t.stop())}catch(_){}
    try{audioCtx?.close()}catch(_){}
    stream=null;audioCtx=null;source=null;processor=null;
  }

  async function stopAndSend(){
    if(!recording)return;
    recording=false;
    const b=$('ariaVoiceBtn');
    try{
      const sr=audioCtx?.sampleRate||44100;
      cleanup();
      const blob=wavBlob(parts,sr);parts=[];
      if(blob.size<2500)throw new Error('صدای کافی ضبط نشد؛ چند ثانیه صحبت کن.');
      b.disabled=true;b.textContent='⏳ تبدیل...';msg('در حال تبدیل صدای فارسی به متن...');
      const o=await post('transcribe',blob),text=(o.text||'').trim();
      if(!text)throw new Error('متنی از صدا تشخیص داده نشد.');
      $('ariaAskText').value=text;$('ariaAskText').dir='rtl';$('ariaAskText').lang='fa';
      msg('✓ صدای فارسی تبدیل شد — Voice v26');
    }catch(e){msg(e.message||String(e))}
    finally{b.disabled=false;b.textContent='🎙 گفتن';}
  }

  async function start(){
    if(recording)return stopAndSend();
    try{
      if(!navigator.mediaDevices?.getUserMedia)throw new Error('مرورگر به میکروفون دسترسی ندارد.');
      stream=await navigator.mediaDevices.getUserMedia({audio:{channelCount:1,echoCancellation:true,noiseSuppression:true,autoGainControl:true}});
      const AC=window.AudioContext||window.webkitAudioContext;
      if(!AC)throw new Error('ضبط صوت WebAudio روی این دستگاه پشتیبانی نمی‌شود.');
      audioCtx=new AC();await audioCtx.resume();
      source=audioCtx.createMediaStreamSource(stream);
      processor=audioCtx.createScriptProcessor(4096,1,1);
      parts=[];
      processor.onaudioprocess=e=>{if(recording)parts.push(new Float32Array(e.inputBuffer.getChannelData(0)))};
      source.connect(processor);processor.connect(audioCtx.destination);
      recording=true;startedAt=Date.now();
      const b=$('ariaVoiceBtn');b.textContent='⏹ پایان گفتن';
      const tick=()=>msg(`🔴 در حال ضبط ${Math.floor((Date.now()-startedAt)/1000)} ثانیه — برای پایان دوباره بزن`);
      tick();timer=setInterval(tick,500);
    }catch(e){
      cleanup();recording=false;
      if(e?.name==='NotAllowedError'||e?.name==='SecurityError')msg('دسترسی میکروفون بسته است. در Safari روی aA / تنظیمات وب‌سایت → Microphone → Allow بزن.');
      else if(e?.name==='NotFoundError')msg('میکروفونی روی دستگاه پیدا نشد.');
      else msg(e.message||String(e));
      const b=$('ariaVoiceBtn');if(b)b.textContent='🎙 گفتن';
    }
  }

  function bind(){
    const old=$('ariaVoiceBtn');if(!old)return false;
    if(old.dataset.voiceGuard==='26')return true;
    const b=old.cloneNode(true);old.replaceWith(b);
    b.id='ariaVoiceBtn';b.dataset.voiceGuard='26';b.style.display='';b.disabled=false;b.textContent='🎙 گفتن';
    b.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();start()},true);
    msg('Voice v26 آماده است');
    return true;
  }

  let n=0;const iv=setInterval(()=>{if(bind()||++n>120)clearInterval(iv)},100);
})();
