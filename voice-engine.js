(function(){
  if(window.__ARIA_VOICE_ENGINE_V3)return;window.__ARIA_VOICE_ENGINE_V3=true;
  let localPipePromise=null;

  function bestMime(){
    if(!window.MediaRecorder)return'';
    for(const t of ['audio/mp4','audio/webm;codecs=opus','audio/webm']){
      try{if(MediaRecorder.isTypeSupported?.(t))return t}catch(_){ }
    }
    return'';
  }

  async function getLocalPipe(onState){
    if(!localPipePromise){
      localPipePromise=(async()=>{
        onState?.('برای اولین بار مدل صدا روی گوشی در حال آماده‌شدن است…');
        const mod=await import('https://cdn.jsdelivr.net/npm/@xenova/transformers@2.17.2');
        try{mod.env.useBrowserCache=true}catch(_){ }
        return await mod.pipeline('automatic-speech-recognition','Xenova/whisper-tiny',{quantized:true,progress_callback:p=>{
          try{if(p?.status==='progress'&&Number.isFinite(p.progress))onState?.(`آماده‌سازی مدل صدا ${Math.round(p.progress)}٪…`)}catch(_){ }
        }});
      })();
    }
    return localPipePromise;
  }

  async function transcribeLocal(blob,onState){
    const pipe=await getLocalPipe(onState);
    onState?.('در حال تبدیل صدا روی خود دستگاه…');
    const url=URL.createObjectURL(blob);
    try{
      const out=await pipe(url,{language:'persian',task:'transcribe'});
      const text=String(out?.text||'').trim();
      if(!text)throw new Error('متنی از صدا تشخیص داده نشد؛ دوباره واضح‌تر بگو.');
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
          if(blob.size<1200)throw new Error('صدا خیلی کوتاه بود؛ دوباره بگو.');
          const text=await transcribeLocal(blob,opts.onState);
          resolve(text);
        }catch(e){reject(e)}
      };
    });
    mr.start(250);
    opts.onState?.('دارم گوش می‌دم… برای پایان دوباره بزن.');
    return{stop:()=>{if(mr.state!=='inactive')mr.stop()},cancel:()=>{done=true;try{mr.stop()}catch(_){ }cleanup()},result};
  }

  window.ARIA_VOICE_ENGINE={startRecorder,transcribeLocal};
})();