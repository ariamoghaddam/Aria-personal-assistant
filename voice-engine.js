(function(){
  if(window.__ARIA_VOICE_ENGINE_V8)return;window.__ARIA_VOICE_ENGINE_V8=true;

  let pipePromise=null;

  function bestMime(){
    if(!window.MediaRecorder)return'';
    for(const t of ['audio/mp4','audio/webm;codecs=opus','audio/webm']){
      try{if(MediaRecorder.isTypeSupported?.(t))return t}catch(_){ }
    }
    return'';
  }

  async function getPipe(onState){
    if(!pipePromise){
      pipePromise=(async()=>{
        onState?.('در حال آماده‌کردن تشخیص دقیق فارسی…');
        const mod=await import('https://cdn.jsdelivr.net/npm/@xenova/transformers@2.17.2');
        try{mod.env.useBrowserCache=true}catch(_){ }
        return await mod.pipeline('automatic-speech-recognition','Xenova/whisper-base',{quantized:true,progress_callback:p=>{
          try{if(p?.status==='progress'&&Number.isFinite(p.progress))onState?.(`آماده‌سازی موتور فارسی ${Math.round(p.progress)}٪…`)}catch(_){ }
        }});
      })();
    }
    return pipePromise;
  }

  async function transcribe(blob,onState){
    if(window.ARIA_SERVER_TRANSCRIBE){
      try{
        onState?.('دارم صدات رو دقیق به فارسی تبدیل می‌کنم…');
        return await window.ARIA_SERVER_TRANSCRIBE(blob);
      }catch(e){
        const m=String(e?.message||e||'');
        if(/ورود ARIA|401|unauthorized/i.test(m))throw e;
        onState?.('سرویس آنلاین پاسخ نداد؛ موتور جایگزین فارسی را امتحان می‌کنم…');
      }
    }
    const pipe=await getPipe(onState);
    const url=URL.createObjectURL(blob);
    try{
      const out=await pipe(url,{language:'fa',task:'transcribe',chunk_length_s:18,stride_length_s:3,return_timestamps:false});
      const text=String(out?.text||'').replace(/\s+/g,' ').trim();
      if(!text)throw new Error('چیزی از صدات متوجه نشدم؛ دوباره بگو.');
      return text;
    }finally{
      try{URL.revokeObjectURL(url)}catch(_){ }
    }
  }

  async function startRecorder(opts={}){
    if(!navigator.mediaDevices?.getUserMedia||!window.MediaRecorder)throw new Error('ضبط صدا روی این دستگاه در دسترس نیست.');

    let stream;
    try{
      stream=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:true,noiseSuppression:true,autoGainControl:true,channelCount:1}});
    }catch(e){
      const n=String(e?.name||'');
      if(n==='NotAllowedError'||n==='PermissionDeniedError')throw new Error('اجازه میکروفون بسته است. در تنظیمات ARIA/Safari میکروفون را روی Allow بگذار.');
      throw new Error('میکروفون باز نشد؛ دوباره امتحان کن.');
    }

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
          if(blob.size<1600)throw new Error('صدا خیلی کوتاه بود؛ دوباره بگو.');
          const text=await transcribe(blob,opts.onState);
          resolve(text);
        }catch(e){reject(e)}
      };
    });

    mr.start(250);
    opts.onState?.('دارم گوش می‌دم… طبیعی صحبت کن و برای پایان دوباره بزن.');
    return{
      stop:()=>{if(mr.state!=='inactive')mr.stop()},
      cancel:()=>{done=true;try{mr.stop()}catch(_){ }cleanup()},
      result
    };
  }

  window.ARIA_VOICE_ENGINE={startRecorder,transcribe};
})();