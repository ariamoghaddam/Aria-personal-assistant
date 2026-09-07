(function(){
  const cfg=window.ARIA_CLOUD||{};
  let rec=null,stream=null,chunks=[],recording=false;
  const $=id=>document.getElementById(id);
  const msg=t=>{const e=$('ariaAskResult');if(e)e.textContent=t};
  function token(){
    const keys=Object.keys(localStorage).filter(k=>k.startsWith('sb-')&&k.includes('auth-token'));
    for(const k of keys){try{const o=JSON.parse(localStorage.getItem(k)||'null');const walk=x=>{if(!x||typeof x!=='object')return'';if(typeof x.access_token==='string')return x.access_token;for(const v of Object.values(x)){const t=walk(v);if(t)return t}return''};const t=walk(o);if(t)return t}catch(_){}}
    throw new Error('برای استفاده از هوش مصنوعی یک‌بار از حساب ARIA خارج و دوباره وارد شو.');
  }
  function post(mode,body){return new Promise((resolve,reject)=>{const x=new XMLHttpRequest();x.open('POST',`/api/aria-ai?mode=${encodeURIComponent(mode)}&t=${encodeURIComponent(token())}&guard=25`,true);x.timeout=90000;x.onload=()=>{let o={};try{o=JSON.parse(x.responseText||'{}')}catch(_){o={detail:x.responseText}};if(x.status>=200&&x.status<300)resolve(o);else reject(new Error(o.detail||o.error||`خطای سرور ${x.status}`))};x.onerror=()=>reject(new Error('ارتباط با سرور برقرار نشد.'));x.ontimeout=()=>reject(new Error('پاسخ سرور طول کشید.'));x.send(body)})}
  async function start(){
    if(recording){rec.stop();return}
    if(!navigator.mediaDevices?.getUserMedia||!window.MediaRecorder)throw new Error('ضبط صدا در این مرورگر پشتیبانی نمی‌شود.');
    stream=await navigator.mediaDevices.getUserMedia({audio:true});
    const types=['audio/mp4','audio/webm;codecs=opus','audio/webm'];
    const mime=types.find(t=>MediaRecorder.isTypeSupported?.(t))||'';
    rec=new MediaRecorder(stream,mime?{mimeType:mime}:undefined);chunks=[];
    rec.ondataavailable=e=>{if(e.data?.size)chunks.push(e.data)};
    rec.onstop=async()=>{const b=$('ariaVoiceBtn');try{b.disabled=true;b.textContent='⏳ تبدیل...';msg('در حال تبدیل صدای فارسی به متن...');const blob=new Blob(chunks,{type:rec.mimeType||'audio/mp4'});const o=await post('transcribe',blob);$('ariaAskText').value=(o.text||'').trim();$('ariaAskText').dir='rtl';msg('✓ صدای فارسی تبدیل شد — Voice v25')}catch(e){msg(e.message||String(e))}finally{stream?.getTracks().forEach(t=>t.stop());recording=false;rec=null;stream=null;chunks=[];b.disabled=false;b.textContent='🎙 گفتن'}};
    rec.start();recording=true;$('ariaVoiceBtn').textContent='⏹ پایان گفتن';msg('دارم گوش می‌دم… فارسی صحبت کن — Voice v25');
  }
  function bind(){const b=$('ariaVoiceBtn');if(!b)return false;b.onclick=null;if(b.dataset.voiceGuard==='25')return true;b.dataset.voiceGuard='25';b.style.display='';b.addEventListener('click',e=>{e.preventDefault();e.stopImmediatePropagation();start().catch(er=>msg(er.message||String(er)))},true);const r=$('ariaAskResult');if(r)r.textContent='Voice v25 آماده است';return true}
  let n=0;const iv=setInterval(()=>{if(bind()||++n>100)clearInterval(iv)},100);
})();
