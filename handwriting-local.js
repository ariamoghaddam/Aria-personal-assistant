(function(){
  if(window.__ARIA_HAND_LOCAL)return;window.__ARIA_HAND_LOCAL=true;
  const $=id=>document.getElementById(id);
  let dlg=null,canvas=null,ctx=null,drawing=false,last=null,dirty=false;

  function ensureDialog(){
    if(dlg)return dlg;
    dlg=document.createElement('dialog');
    dlg.id='ariaHandwritingLocalDialog';
    dlg.innerHTML=`<div style="min-width:min(720px,88vw)"><div class="sectionHead"><b>✍️ دست‌خط فارسی</b><button class="ghost" type="button" id="ariaHandLocalClose">بستن</button></div><div class="sub" style="margin:8px 0">با انگشت یا Apple Pencil بنویس. تبدیل متن روی خود مرورگر انجام می‌شود و به کلید OpenAI وابسته نیست.</div><canvas id="ariaHandLocalCanvas" style="display:block;width:100%;height:320px;background:#fff;border-radius:14px;touch-action:none"></canvas><div class="ariaMenu"><button type="button" id="ariaHandLocalClear">پاک کردن</button><button type="button" class="primary" id="ariaHandLocalRead">تبدیل به متن فارسی</button></div><div id="ariaHandLocalMsg" class="sub"></div></div>`;
    document.body.appendChild(dlg);
    canvas=$('ariaHandLocalCanvas');ctx=canvas.getContext('2d');
    const resize=()=>{const r=canvas.getBoundingClientRect(),q=Math.max(2,window.devicePixelRatio||1);canvas.width=Math.round(r.width*q);canvas.height=Math.round(320*q);ctx.setTransform(q,0,0,q,0,0);ctx.fillStyle='#fff';ctx.fillRect(0,0,r.width,320);ctx.strokeStyle='#111';ctx.lineWidth=4;ctx.lineCap='round';ctx.lineJoin='round';dirty=false};
    const pos=e=>{const r=canvas.getBoundingClientRect();return{x:e.clientX-r.left,y:e.clientY-r.top}};
    canvas.addEventListener('pointerdown',e=>{drawing=true;dirty=true;last=pos(e);canvas.setPointerCapture?.(e.pointerId);e.preventDefault()});
    canvas.addEventListener('pointermove',e=>{if(!drawing)return;const p=pos(e);ctx.beginPath();ctx.moveTo(last.x,last.y);ctx.lineTo(p.x,p.y);ctx.stroke();last=p;e.preventDefault()});
    const up=e=>{drawing=false;last=null;e?.preventDefault?.()};canvas.addEventListener('pointerup',up);canvas.addEventListener('pointercancel',up);
    $('ariaHandLocalClose').onclick=()=>dlg.close();
    $('ariaHandLocalClear').onclick=resize;
    $('ariaHandLocalRead').onclick=async()=>{
      const m=$('ariaHandLocalMsg'),b=$('ariaHandLocalRead');
      if(!dirty){m.textContent='اول داخل کادر چیزی بنویس.';return}
      try{
        b.disabled=true;m.textContent='در حال آماده‌سازی تشخیص دست‌خط فارسی…';
        if(!window.Tesseract){
          await new Promise((res,rej)=>{const s=document.createElement('script');s.src='https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js';s.onload=res;s.onerror=()=>rej(new Error('کتابخانه تشخیص متن بارگذاری نشد.'));document.head.appendChild(s)});
        }
        const out=await Tesseract.recognize(canvas.toDataURL('image/png'),'fas',{logger:x=>{if(x.status==='recognizing text')m.textContent='در حال خواندن دست‌خط… '+Math.round((x.progress||0)*100)+'٪'}});
        const text=(out?.data?.text||'').replace(/\s+/g,' ').trim();
        if(!text)throw new Error('متنی تشخیص داده نشد؛ کمی درشت‌تر و با فاصله بنویس.');
        const ta=$('ariaAskText');if(ta){ta.value=text;ta.dir='rtl';ta.lang='fa';ta.dispatchEvent(new Event('input',{bubbles:true}))}
        m.textContent='تبدیل شد ✓';const r=$('ariaAskResult');if(r)r.textContent='دست‌خط فارسی به متن تبدیل شد ✓';
        setTimeout(()=>dlg.close(),350);
      }catch(e){m.textContent=e?.message||String(e)}finally{b.disabled=false}
    };
    dlg._resize=resize;
    return dlg;
  }

  function wire(){
    const old=$('ariaHandwritingBtn'),voice=$('ariaVoiceBtn');
    if(!voice)return;
    let b=old;
    if(!b){b=document.createElement('button');b.id='ariaHandwritingBtn';b.type='button';b.textContent='✍️ دست‌خط فارسی';voice.parentElement?.insertBefore(b,voice.nextSibling)}
    if(b.dataset.localHand==='1')return;
    b.dataset.localHand='1';b.style.display='';b.disabled=false;b.textContent='✍️ دست‌خط فارسی';
    b.onclick=e=>{e.preventDefault();e.stopPropagation();const d=ensureDialog();d.showModal();setTimeout(()=>d._resize(),60)};
  }
  new MutationObserver(wire).observe(document.documentElement,{childList:true,subtree:true});
  setInterval(wire,700);wire();
})();