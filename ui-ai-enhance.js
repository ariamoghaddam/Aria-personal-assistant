(function(){
  if(window.__ARIA_UI_AI_ENHANCE)return;window.__ARIA_UI_AI_ENHANCE=true;
  const $=id=>document.getElementById(id);
  const KEY='ARIA_UI_PREFS_V1';
  const prefs=()=>{try{return JSON.parse(localStorage.getItem(KEY)||'{}')}catch{return{}}};
  const savePrefs=p=>localStorage.setItem(KEY,JSON.stringify(p));
  const getDB=()=>{try{return typeof db!=='undefined'?db:null}catch{return null}};
  const today=()=>{const d=new Date();d.setMinutes(d.getMinutes()-d.getTimezoneOffset());return d.toISOString().slice(0,10)};
  const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));

  const css=document.createElement('style');
  css.textContent=`
  :root[data-aria-theme="light"]{--bg:#eef4f7;--panel:#ffffff;--panel2:#edf3f6;--line:#cfdae0;--text:#17222a;--muted:#657985;--shadow:0 12px 32px rgba(20,45,60,.12)}
  :root[data-aria-theme="light"] html,:root[data-aria-theme="light"] body{background:linear-gradient(180deg,#f4f8fa,#eaf1f4)!important;color:var(--text)!important}
  :root[data-aria-theme="light"] header{background:linear-gradient(180deg,rgba(244,248,250,.98),rgba(244,248,250,.9),transparent)!important}
  :root[data-aria-theme="light"] dialog{background:#f8fbfc!important;color:#17222a!important}
  .ariaTopTools{display:flex;gap:7px;align-items:center}.ariaIconBtn{position:relative;width:43px;height:43px;padding:0;display:grid;place-items:center;font-size:19px;border:1px solid var(--line);background:var(--panel2)}
  .ariaBellBadge{position:absolute;top:-5px;left:-5px;min-width:19px;height:19px;padding:0 5px;border-radius:999px;background:#ff5c6c;color:white;font-size:10px;display:grid;place-items:center;border:2px solid var(--bg)}
  .ariaSettingsGrid{display:grid;grid-template-columns:1fr 1fr;gap:10px}.ariaSettingCard{border:1px solid var(--line);background:var(--panel2);border-radius:14px;padding:12px}.ariaThemeRow{display:flex;gap:8px;flex-wrap:wrap}.ariaThemeSwatch{width:42px;height:42px;border-radius:12px;border:2px solid transparent}.ariaThemeSwatch.active{outline:2px solid var(--accent)}
  .ariaBrainCard{border:1px solid rgba(45,212,191,.35);background:linear-gradient(145deg,rgba(79,124,255,.14),rgba(45,212,191,.10));border-radius:16px;padding:13px;margin:10px 0}.ariaBrainQuick{display:flex;gap:7px;flex-wrap:wrap;margin-top:9px}.ariaBrainAnswer{white-space:pre-wrap;line-height:1.9;background:var(--panel2);border:1px solid var(--line);border-radius:13px;padding:11px;margin-top:10px;min-height:70px}.ariaNotifItem{border:1px solid var(--line);border-radius:12px;padding:10px;margin-top:8px;background:var(--panel2)}
  @media(max-width:700px){.ariaSettingsGrid{grid-template-columns:1fr}.ariaTopTools{gap:5px}.ariaIconBtn{width:40px;height:40px}}
  `;document.head.appendChild(css);

  const palettes={
    teal:{accent:'#2dd4bf',accent2:'#4f7cff'},
    blue:{accent:'#41a7ff',accent2:'#5167ff'},
    purple:{accent:'#a46bff',accent2:'#ff72b7'},
    orange:{accent:'#ff9b45',accent2:'#ff5c6c'},
    green:{accent:'#69d17d',accent2:'#20b8a7'}
  };
  function applyPrefs(){
    const p=prefs();const theme=p.theme||'dark';document.documentElement.dataset.ariaTheme=theme;
    const pal=palettes[p.palette||'teal']||palettes.teal;
    document.documentElement.style.setProperty('--accent',p.customAccent||pal.accent);
    document.documentElement.style.setProperty('--accent2',pal.accent2);
    const tc=$('ariaThemeMode');if(tc)tc.value=theme;
  }
  applyPrefs();

  function ensureDialogs(){
    if(!$('ariaSettingsDialog')){
      const d=document.createElement('dialog');d.id='ariaSettingsDialog';d.innerHTML=`<div><div class="sectionHead"><b>⚙️ تنظیمات ظاهر ARIA</b><button class="ghost" id="ariaSettingsClose">بستن</button></div><div class="ariaSettingsGrid" style="margin-top:12px"><div class="ariaSettingCard"><b>حالت نمایش</b><div class="sub">شب / روز</div><select id="ariaThemeMode" style="margin-top:8px"><option value="dark">🌙 شب</option><option value="light">☀️ روز</option></select></div><div class="ariaSettingCard"><b>رنگ اصلی برنامه</b><div class="sub">رنگ رابط و دکمه‌ها</div><div class="ariaThemeRow" id="ariaPaletteRow" style="margin-top:9px"><button class="ariaThemeSwatch" data-pal="teal" style="background:#2dd4bf"></button><button class="ariaThemeSwatch" data-pal="blue" style="background:#41a7ff"></button><button class="ariaThemeSwatch" data-pal="purple" style="background:#a46bff"></button><button class="ariaThemeSwatch" data-pal="orange" style="background:#ff9b45"></button><button class="ariaThemeSwatch" data-pal="green" style="background:#69d17d"></button></div><label style="margin-top:10px">رنگ دلخواه<input id="ariaCustomAccent" type="color" style="height:44px"></label></div></div><div class="ariaSettingCard" style="margin-top:10px"><b>هوشمندی ARIA</b><div class="sub">ARIA داده‌های کارها، پروژه‌ها، یادداشت‌ها، جلسه‌ها و موسیقی را یکجا تحلیل می‌کند. بخش آنلاین بعد از معتبر شدن کلید سرور فعال می‌شود؛ تحلیل محلی همین حالا کار می‌کند.</div></div></div>`;document.body.appendChild(d);
      $('ariaSettingsClose').onclick=()=>d.close();
      $('ariaThemeMode').onchange=e=>{const p=prefs();p.theme=e.target.value;savePrefs(p);applyPrefs()};
      d.querySelectorAll('[data-pal]').forEach(b=>b.onclick=()=>{const p=prefs();p.palette=b.dataset.pal;delete p.customAccent;savePrefs(p);applyPrefs();markPalette()});
      $('ariaCustomAccent').oninput=e=>{const p=prefs();p.customAccent=e.target.value;savePrefs(p);applyPrefs()};
    }
    if(!$('ariaNotifDialog')){
      const d=document.createElement('dialog');d.id='ariaNotifDialog';d.innerHTML=`<div><div class="sectionHead"><b>🔔 اعلان‌های ARIA</b><button class="ghost" id="ariaNotifClose">بستن</button></div><div id="ariaNotifList" style="margin-top:10px"></div></div>`;document.body.appendChild(d);$('ariaNotifClose').onclick=()=>d.close();
    }
    if(!$('ariaBrainDialog')){
      const d=document.createElement('dialog');d.id='ariaBrainDialog';d.innerHTML=`<div><div class="sectionHead"><b>✦ مغز ARIA</b><button class="ghost" id="ariaBrainClose">بستن</button></div><div class="sub" style="margin:8px 0">از کل برنامه سؤال بپرس؛ کارها، پروژه‌ها، موسیقی، جلسه‌ها و یادداشت‌ها در تحلیل لحاظ می‌شوند.</div><textarea id="ariaBrainInput" placeholder="مثلاً امروز اول روی چی کار کنم؟ یا پروژه‌های عقب‌افتاده‌ام را بگو"></textarea><div class="ariaBrainQuick"><button data-brain="today">برنامه امروز</button><button data-brain="overdue">عقب‌افتاده‌ها</button><button data-brain="priority">۳ اولویت اصلی</button><button data-brain="projects">وضعیت پروژه‌ها</button></div><button class="primary" id="ariaBrainAsk" style="margin-top:9px">تحلیل کن</button><div id="ariaBrainAnswer" class="ariaBrainAnswer">ARIA آماده تحلیل محلی کل برنامه است.</div></div>`;document.body.appendChild(d);$('ariaBrainClose').onclick=()=>d.close();d.querySelectorAll('[data-brain]').forEach(b=>b.onclick=()=>runBrain(b.dataset.brain));$('ariaBrainAsk').onclick=()=>runBrain('free',$('ariaBrainInput').value.trim());
    }
  }
  function markPalette(){const p=prefs();document.querySelectorAll('[data-pal]').forEach(x=>x.classList.toggle('active',x.dataset.pal===(p.palette||'teal')))};

  function getNotifs(){const D=getDB();if(!D)return[];const t=today();const out=[];(D.tasks||[]).filter(x=>x.status!=='done').forEach(x=>{if(x.date&&x.date<t)out.push({type:'عقب‌افتاده',title:x.title,meta:x.date});else if(x.date===t)out.push({type:'امروز',title:x.title,meta:x.time||''});if(x.meta?.followUpDate&&x.meta.followUpDate<=t&&!x.meta.followUpDone)out.push({type:'پیگیری',title:x.title,meta:x.meta.followUpDate})});return out}
  function renderNotifs(){ensureDialogs();const items=getNotifs();const list=$('ariaNotifList');list.innerHTML=items.length?items.map(x=>`<div class="ariaNotifItem"><b>${esc(x.type)} — ${esc(x.title)}</b>${x.meta?`<div class="sub">${esc(x.meta)}</div>`:''}</div>`).join(''):'<div class="empty">اعلان فعالی نداری.</div>';const badge=$('ariaBellBadge');if(badge){badge.textContent=items.length>99?'99+':items.length;badge.style.display=items.length?'grid':'none'}}

  function taskScore(t){let s=0;const td=today();if(t.status==='done')return-999;if(t.date&&t.date<td)s+=50;if(t.date===td)s+=30;if(t.priority==='urgent')s+=35;else if(t.priority==='important')s+=18;s+=(t.meta?.postponeCount||0)*6;return s}
  function runBrain(mode,q=''){
    const D=getDB(),a=$('ariaBrainAnswer');if(!D){a.textContent='داده‌های ARIA هنوز آماده نیست.';return}const tasks=(D.tasks||[]),open=tasks.filter(x=>x.status!=='done'),td=today();
    if(mode==='today'){const x=open.filter(t=>t.date===td||t.date<td).sort((a,b)=>taskScore(b)-taskScore(a));a.textContent=x.length?'پیشنهاد امروز:\n'+x.slice(0,8).map((t,i)=>`${i+1}) ${t.title}${t.date<td?' — عقب‌افتاده':''}`).join('\n'):'برای امروز کار باز ثبت نشده.';return}
    if(mode==='overdue'){const x=open.filter(t=>t.date&&t.date<td);a.textContent=x.length?`تو ${x.length} کار عقب‌افتاده داری:\n`+x.slice(0,12).map(t=>'• '+t.title).join('\n'):'کار عقب‌افتاده نداری.';return}
    if(mode==='priority'){const x=open.sort((a,b)=>taskScore(b)-taskScore(a)).slice(0,3);a.textContent=x.length?'سه اولویت پیشنهادی ARIA:\n'+x.map((t,i)=>`${i+1}) ${t.title}`).join('\n'):'کار بازی برای اولویت‌بندی نیست.';return}
    if(mode==='projects'){const ps=(D.projects||[]).map(p=>{const all=tasks.filter(t=>t.project===p.id),done=all.filter(t=>t.status==='done').length,openN=all.length-done,over=all.filter(t=>t.status!=='done'&&t.date&&t.date<td).length;return `${p.name}: ${openN} باز، ${over} عقب‌افتاده، ${all.length?Math.round(done*100/all.length):0}٪ پیشرفت`});a.textContent=ps.length?ps.join('\n'):'پروژه‌ای ثبت نشده.';return}
    const text=(q||'').toLowerCase();
    if(/عقب|دیر|گذشته/.test(text))return runBrain('overdue');if(/اولویت|مهم|اول/.test(text))return runBrain('priority');if(/پروژه/.test(text))return runBrain('projects');if(/امروز|برنامه/.test(text))return runBrain('today');
    a.textContent=`وضعیت کلی ARIA:\n• ${open.length} کار باز\n• ${open.filter(t=>t.date&&t.date<td).length} عقب‌افتاده\n• ${(D.projects||[]).length} پروژه\n• ${(D.music||[]).length} ثبت موسیقی\n\nبرای تحلیل عمیق‌تر آنلاین، کلید هوش مصنوعی سرور باید معتبر شود.`;
  }

  function mount(){
    ensureDialogs();applyPrefs();markPalette();
    const top=document.querySelector('.top');if(top&&!$('ariaSettingsBtn')){
      const existing=top.lastElementChild;const wrap=existing?.classList?.contains('ariaTopTools')?existing:document.createElement('div');if(!wrap.parentNode){wrap.className='ariaTopTools';if(existing){while(existing.firstChild)wrap.appendChild(existing.firstChild);existing.replaceWith(wrap)}else top.appendChild(wrap)}
      const brain=document.createElement('button');brain.id='ariaBrainBtn';brain.className='ariaIconBtn';brain.type='button';brain.title='مغز ARIA';brain.textContent='✦';brain.onclick=()=>{$('ariaBrainDialog').showModal();runBrain('today')};
      const bell=document.createElement('button');bell.id='ariaBellBtn';bell.className='ariaIconBtn';bell.type='button';bell.title='اعلان‌ها';bell.innerHTML='🔔<span id="ariaBellBadge" class="ariaBellBadge" style="display:none"></span>';bell.onclick=()=>{renderNotifs();$('ariaNotifDialog').showModal()};
      const set=document.createElement('button');set.id='ariaSettingsBtn';set.className='ariaIconBtn';set.type='button';set.title='تنظیمات';set.textContent='⚙️';set.onclick=()=>{$('ariaSettingsDialog').showModal();markPalette()};
      wrap.insertBefore(brain,wrap.firstChild);wrap.insertBefore(bell,brain.nextSibling);wrap.insertBefore(set,bell.nextSibling);
    }
    renderNotifs();
  }
  new MutationObserver(()=>{if(document.body)mount()}).observe(document.documentElement,{childList:true,subtree:true});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(mount,300));else setTimeout(mount,300);
  setInterval(renderNotifs,30000);
})();