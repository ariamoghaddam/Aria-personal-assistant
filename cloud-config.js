
window.ARIA_CLOUD = {
  supabaseUrl: "https://kbwyysfkvprvetninabb.supabase.co",
  supabaseAnonKey: "sb_publishable_fQ5frelO2cr7bFCjoFXvng_0SmCwsG4",
  pushPublicKey: "",
  apiBase: "/api",
  cloudEnabled: true
};

// ARIA Persian handwriting + voice input fix for iPhone/iPad/Safari.
window.addEventListener('load',()=>setTimeout(()=>{
  const text=document.getElementById('ariaAskText');
  const voice=document.getElementById('ariaVoiceBtn');
  const result=document.getElementById('ariaAskResult');
  if(!text||!voice)return;

  // Strong Persian hints for Apple Pencil Scribble / keyboard input.
  text.setAttribute('lang','fa-IR');
  text.setAttribute('dir','rtl');
  text.setAttribute('inputmode','text');
  text.setAttribute('autocapitalize','off');
  text.setAttribute('autocomplete','off');
  text.setAttribute('spellcheck','true');
  text.style.direction='rtl';
  text.style.textAlign='right';
  text.style.unicodeBidi='plaintext';
  text.placeholder='فارسی بنویس یا با قلم بنویس؛ مثال: فردا ساعت ۵ تماس با علی';

  const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
  let rec=null,listening=false;
  const setState=(msg,label)=>{if(result)result.textContent=msg||'';voice.textContent=label||'🎙 گفتن'};

  if(SR){
    voice.style.display='inline-block';
    voice.onclick=async()=>{
      if(listening&&rec){try{rec.stop()}catch(_){}return;}
      try{
        // Ask for microphone permission explicitly on iOS/PWA before SpeechRecognition.
        if(navigator.mediaDevices&&navigator.mediaDevices.getUserMedia){
          const stream=await navigator.mediaDevices.getUserMedia({audio:true});
          stream.getTracks().forEach(t=>t.stop());
        }
        rec=new SR();
        rec.lang='fa-IR';
        rec.continuous=false;
        rec.interimResults=true;
        rec.maxAlternatives=1;
        rec.onstart=()=>{listening=true;setState('دارم فارسی گوش می‌دم…','⏹ توقف')};
        rec.onresult=e=>{
          let finalText='',interim='';
          for(let i=e.resultIndex;i<e.results.length;i++){
            const chunk=e.results[i][0]?.transcript||'';
            if(e.results[i].isFinal)finalText+=chunk;else interim+=chunk;
          }
          if(finalText){
            const sep=text.value.trim()?' ':'';
            text.value=(text.value.trim()+sep+finalText.trim()).trim();
            text.dispatchEvent(new Event('input',{bubbles:true}));
          }
          if(result)result.textContent=interim?('شنیدم: '+interim):'فارسی ثبت شد ✓';
        };
        rec.onerror=e=>{
          listening=false;
          const msg={
            'not-allowed':'دسترسی میکروفون داده نشده. از Settings > Safari/ARIA دسترسی Microphone را فعال کن.',
            'audio-capture':'میکروفون در دسترس نیست.',
            'no-speech':'صدایی نشنیدم؛ دوباره «گفتن» را بزن.',
            'network':'تشخیص صدا فعلاً به شبکه دسترسی ندارد؛ دوباره امتحان کن.'
          }[e.error]||('خطای گفتار: '+(e.error||'نامشخص'));
          setState(msg,'🎙 گفتن');
        };
        rec.onend=()=>{listening=false;if(voice.textContent==='⏹ توقف')voice.textContent='🎙 گفتن'};
        rec.start();
      }catch(e){
        listening=false;
        setState('اجازه میکروفون لازم است. اگر پنجره اجازه آمد، Allow را بزن.','🎙 گفتن');
      }
    };
  }else{
    // iOS versions without Web Speech API: keep button useful instead of hiding it.
    voice.style.display='inline-block';
    voice.onclick=()=>{
      text.focus();
      setState('تشخیص گفتار مستقیم در این نسخه Safari فعال نیست؛ میکروفون کیبورد فارسی را بزن و صحبت کن.','🎙 گفتن');
    };
  }
},900));
