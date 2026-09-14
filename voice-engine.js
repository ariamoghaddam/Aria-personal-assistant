(function(){
  if(window.__ARIA_VOICE_ENGINE_V4)return;window.__ARIA_VOICE_ENGINE_V4=true;
  let localPipePromise=null;

  function bestMime(){
    if(!window.MediaRecorder)return'';
    for(const t of ['audio/mp4','audio/webm;codecs=opus','audio/webm']){
      try{if(MediaRecorder.isTypeSupported?.(t))return t}catch(_){ }
    }
    return'';
  }

  function persianScore(text){
    const s=String(text||'').replace(/\s+/g,'');
    if(!s)return 0;
    const fa=(s.match(/[\u0600-\u06FF]/g)||[]).length;
    return fa/s.length;
  }

  function looksBad(text){
    const t=String(text||'').trim();
    if(!t)return true;
    if(persianScore(t)<0.55)return true;
    const words=t.split(/\s+/).filter(Boolean);
    if(words.length>=5){
      const uniq=new Set(words.map(x=>x.replace(/[،؛,.!?؟]/g,'')));
      if(uniq.size/words.length<0.45)return true;
    }
    return false;
  }

  async function getLocalPipe(onState){
    if(!localPipePromise){
      localPipePromise=(async()=>{
        onState?.('مدل دقیق فارسی در حال آماده‌شدن است…');
        const mod=await import('https://cdn.jsdelivr.net/npm/@xenova/transformers@2.17.2');
        try{mod.env.useBrowserCache=true}catch(_){ }
        return await mod.pipeline('automatic-speech-recognition','Xenova/whisper-small',{quantized:true,progress_callback:p=>{
          try{if(p?.status==='progress'&&Number.isFinite(p.progress))onState?.(`آماده‌سازی تشخیص فارسی ${Math.round(p.progress)}٪…`)}catch(_){ }
        }});
      })();
    }
    return localPipePromise;
  }

  async function transcribeLocal(blob,onState){
    const pipe=await getLocalPipe(onState);
    onState?.('دارم فارسی را دقیق تبدیل می‌کنم…');
    const url=URL.createObjectURL(blob);
    try{
      let out=await pipe(url,{language:'fa',task:'transcribe',chunk_length_s:20,stride_length_s:3,return_timestamps:false});
      let text=String(out?.text||'').trim();
      if(looksBad(text)){
        onState?.('یک بار دیگر با تنظیم دقیق فارسی بررسی می‌کنم…');
        out=await pipe(url,{language:'fa',task:'transcribe',chunk_length_s:15,stride_length_s:4,return_timestamps:false});
        const retry=String(out?.text||'').trim();
        if(retry && persianScore(retry)>=persianScore(text))text=retry;
      }
      if(!text)throw new Error('متنی از صدا تشخیص داده نشد؛ دوباره واضح‌تر بگو.');
      if(looksBad(text))throw new Error('این جمله را مطمئن نفهمیدم؛ لطفاً یک بار دیگر کمی شمرده‌تر بگو.');
      return text;
    }finally{
      try{URL.revokeObjectURL(url)}catch(_){ }
    }
  }

  async function startRecorder(opts={}){
    if(!navigator.mediaDevices?.getUserMedia||!window.MediaRecorder)throw new Error('ضبط صدا روی این دستگاه در دسترس نیست.');
    const stream=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:true,noiseSuppression:true,autoGainControl:true,channelCount:1}});
    const mime=bestMime();
    const mr=new MediaRecorder(stream,mime?{mimeType:mime}:undefined);
    const chunks=[];let done=false;
    const cleanup=()=>{try{stream.getTracks().forEach(t=>t.stop())}catch(_){ }};
    const result=new Promise((resolve,reject)=>{
      mr.ondataavailable=e=>{if(e.data&&e.data.size)chunks.push(e.data)};
      mr.onerror=e=>{cleanup();reject(e.error||new Error('خطا در ضبط صدا'))};
      mr.onstop=async()=>{
        if(done)return;done=true;cleanup();
        try{
          const blob=new Blob(chunks,{type:mr.mimeType||mime||'audio/mp4'});
          if(blob.size<1800)throw new Error('صدا خیلی کوتاه بود؛ دوباره بگو.');
          const text=await transcribeLocal(blob,opts.onState);
          resolve(text);
        }catch(e){reject(e)}
      };
    });
    mr.start(250);
    opts.onState?.('دارم گوش می‌دم… جمله را طبیعی بگو و برای پایان دوباره بزن.');
    return{stop:()=>{if(mr.state!=='inactive')mr.stop()},cancel:()=>{done=true;try{mr.stop()}catch(_){ }cleanup()},result};
  }

  window.ARIA_VOICE_ENGINE={startRecorder,transcribeLocal};
})();