(function(){
  if(window.__ARIA_VOICE_ENGINE_V7)return;window.__ARIA_VOICE_ENGINE_V7=true;

  const SR=window.SpeechRecognition||window.webkitSpeechRecognition;

  async function openMic(){
    if(!navigator.mediaDevices?.getUserMedia) return null;
    try{
      return await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:true,noiseSuppression:true,autoGainControl:true,channelCount:1}});
    }catch(e){
      const name=String(e?.name||'');
      if(name==='NotAllowedError'||name==='PermissionDeniedError'){
        throw new Error('اجازه میکروفون برای این پنجره فعال نمانده. ARIA را در Safari اصلی یا از آیکن Home Screen باز کن و یک‌بار Allow بزن.');
      }
      if(name==='NotFoundError'||name==='DevicesNotFoundError') throw new Error('میکروفونی روی این دستگاه پیدا نشد.');
      throw new Error('میکروفون باز نشد؛ دوباره امتحان کن.');
    }
  }

  async function startRecorder(opts={}){
    if(!SR) throw new Error('تشخیص زنده صدا روی این مرورگر در دسترس نیست.');

    opts.onState?.('در حال فعال‌کردن میکروفون…');
    const micStream=await openMic();
    const releaseMic=()=>{try{micStream?.getTracks?.().forEach(t=>t.stop())}catch(_){ }};

    let rec=new SR();
    rec.lang='fa-IR';
    rec.interimResults=false;
    rec.continuous=true;
    rec.maxAlternatives=3;

    let stopped=false, settled=false;
    let parts=[];
    let resolveResult, rejectResult;
    const result=new Promise((resolve,reject)=>{resolveResult=resolve;rejectResult=reject});

    const finish=(err)=>{
      if(settled)return;settled=true;
      releaseMic();
      const text=parts.join(' ').replace(/\s+/g,' ').trim();
      if(err) rejectResult(err);
      else if(text) resolveResult(text);
      else rejectResult(new Error('چیزی از صدات متوجه نشدم؛ دوباره بگو.'));
    };

    rec.onresult=e=>{
      for(let i=e.resultIndex;i<e.results.length;i++){
        const r=e.results[i];
        if(r.isFinal){
          const t=String(r[0]?.transcript||'').trim();
          if(t) parts.push(t);
        }
      }
      if(parts.length) opts.onState?.('دارم گوش می‌دم… برای پایان دوباره بزن.');
    };

    rec.onerror=e=>{
      const code=String(e?.error||'');
      if(stopped && ['aborted','no-speech'].includes(code)) return;
      if(code==='not-allowed'||code==='service-not-allowed') finish(new Error('این پنجره اجازه پایدار میکروفون نداره. ARIA را با Safari اصلی یا از آیکن نصب‌شده باز کن، نه مرورگر داخل ChatGPT.'));
      else if(code==='audio-capture') finish(new Error('میکروفون در دسترس نیست.'));
      else if(code==='network') finish(new Error('سرویس تشخیص صدا در دسترس نیست؛ دوباره امتحان کن.'));
      else if(code && code!=='no-speech') finish(new Error('خطا در تشخیص صدا: '+code));
    };

    rec.onend=()=>{
      if(stopped){finish();return;}
      try{rec.start()}catch(_){setTimeout(()=>{try{if(!stopped)rec.start()}catch{}},180)}
    };

    opts.onState?.('دارم گوش می‌دم… طبیعی صحبت کن و برای پایان دوباره بزن.');
    try{rec.start()}catch(e){releaseMic();throw new Error('تشخیص صدا شروع نشد؛ ARIA را در Safari اصلی باز کن و دوباره امتحان کن.');}

    return {
      stop:()=>{
        if(stopped)return;stopped=true;
        opts.onState?.('در حال نهایی‌کردن متن…');
        try{rec.stop()}catch(_){finish()}
        setTimeout(()=>finish(),700);
      },
      cancel:()=>{
        if(stopped)return;stopped=true;
        try{rec.abort()}catch(_){ }
        releaseMic();
        if(!settled){settled=true;rejectResult(new Error('لغو شد.'));}
      },
      result
    };
  }

  window.ARIA_VOICE_ENGINE={startRecorder};
})();