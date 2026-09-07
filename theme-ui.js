(function(){
  if(window.__ARIA_THEME_UI_V1)return;window.__ARIA_THEME_UI_V1=true;
  const KEY='ARIA_THEME_PREFS_V1';
  const $=id=>document.getElementById(id);
  const mm=window.matchMedia?window.matchMedia('(prefers-color-scheme: dark)'):null;
  const presets={
    teal:{name:'فیروزه‌ای',accent:'#2dd4bf',accent2:'#4f7cff'},
    ocean:{name:'آبی',accent:'#41a7ff',accent2:'#5167ff'},
    violet:{name:'بنفش',accent:'#a46bff',accent2:'#ff72b7'},
    coral:{name:'مرجانی',accent:'#ff8d6d',accent2:'#ff5f7a'},
    green:{name:'سبز',accent:'#65d58a',accent2:'#27b8a6'}
  };
  function prefs(){try{return JSON.parse(localStorage.getItem(KEY)||'{}')}catch{return{}}}
  function save(p){localStorage.setItem(KEY,JSON.stringify(p))}
  function resolvedMode(p=prefs()){return p.mode==='light'?'light':p.mode==='dark'?'dark':(mm?.matches?'dark':'light')}
  function apply(){
    const p=prefs(),mode=resolvedMode(p),pal=presets[p.palette||'teal']||presets.teal;
    const r=document.documentElement;r.dataset.ariaTheme=mode;r.dataset.ariaThemeMode=p.mode||'auto';
    r.style.setProperty('--accent',p.customAccent||pal.accent);r.style.setProperty('--accent2',pal.accent2);
    const meta=document.querySelector('meta[name="theme-color"]');if(meta)meta.setAttribute('content',mode==='dark'?'#0d151d':'#f2f6f8');
    const modeSel=$('ariaThemeMode');if(modeSel)modeSel.value=p.mode||'auto';
    const custom=$('ariaThemeCustom');if(custom)custom.value=p.customAccent||pal.accent;
    document.querySelectorAll('[data-aria-palette]').forEach(b=>b.classList.toggle('active',b.dataset.ariaPalette===(p.palette||'teal')&&!p.customAccent));
  }

  const css=document.createElement('style');
  css.id='ariaThemeStyles';
  css.textContent=`
  :root{--ariaRadius:18px;--ariaBlur:18px;--ariaEase:cubic-bezier(.2,.8,.2,1)}
  :root[data-aria-theme="dark"]{--bg:#0a1118;--panel:#111c25;--panel2:#172630;--line:#29404d;--text:#f4f8fa;--muted:#9eb0bb;--shadow:0 18px 50px rgba(0,0,0,.28)}
  :root[data-aria-theme="light"]{--bg:#eef4f7;--panel:#ffffff;--panel2:#edf4f7;--line:#d3e0e6;--text:#14222b;--muted:#657985;--shadow:0 16px 42px rgba(34,65,82,.12)}
  html,body{transition:background .3s var(--ariaEase),color .3s var(--ariaEase)!important}
  :root[data-aria-theme="dark"] body{background:radial-gradient(circle at 15% -10%,color-mix(in srgb,var(--accent) 12%,transparent),transparent 34%),linear-gradient(180deg,#091017,#0d161d)!important;color:var(--text)!important}
  :root[data-aria-theme="light"] body{background:radial-gradient(circle at 15% -10%,color-mix(in srgb,var(--accent) 10%,transparent),transparent 34%),linear-gradient(180deg,#f7fafb,#edf3f6)!important;color:var(--text)!important}
  header{backdrop-filter:blur(var(--ariaBlur)) saturate(1.15);-webkit-backdrop-filter:blur(var(--ariaBlur)) saturate(1.15)}
  :root[data-aria-theme="dark"] header{background:linear-gradient(180deg,rgba(9,16,23,.93),rgba(9,16,23,.75),transparent)!important}
  :root[data-aria-theme="light"] header{background:linear-gradient(180deg,rgba(247,250,251,.95),rgba(247,250,251,.78),transparent)!important}
  .card,.task,.project,.musicCard,.stat{transition:transform .2s var(--ariaEase),background .25s var(--ariaEase),border-color .25s var(--ariaEase),box-shadow .25s var(--ariaEase)!important}
  .card{background:color-mix(in srgb,var(--panel) 94%,transparent)!important;border-color:var(--line)!important;box-shadow:var(--shadow)!important}
  .task,.project,.musicCard,.stat{background:linear-gradient(145deg,color-mix(in srgb,var(--panel2) 94%,white 2%),color-mix(in srgb,var(--panel) 96%,transparent))!important;border-color:var(--line)!important;color:var(--text)!important}
  @media(hover:hover){.task:hover,.project:hover,.musicCard:hover{transform:translateY(-2px)}}
  button,.btn,input,textarea,select{transition:all .18s var(--ariaEase)!important}
  button,.btn{border-radius:14px!important}.primary{box-shadow:0 8px 24px color-mix(in srgb,var(--accent) 22%,transparent)!important}
  input,textarea,select{background:color-mix(in srgb,var(--panel2) 94%,transparent)!important;color:var(--text)!important;border-color:var(--line)!important}
  .sub,.project small,.stat span{color:var(--muted)!important}
  dialog{background:color-mix(in srgb,var(--panel) 98%,transparent)!important;color:var(--text)!important;border:1px solid var(--line)!important;backdrop-filter:blur(22px);-webkit-backdrop-filter:blur(22px)}
  .iosDock,.bottom{background:color-mix(in srgb,var(--panel) 88%,transparent)!important;border-top-color:var(--line)!important;backdrop-filter:blur(24px) saturate(1.3)!important;-webkit-backdrop-filter:blur(24px) saturate(1.3)!important}
  .badge{border:1px solid color-mix(in srgb,var(--line) 80%,transparent)}
  #ariaThemeBtn{width:42px;height:42px;padding:0!important;display:grid;place-items:center;font-size:18px;border:1px solid var(--line)!important;background:color-mix(in srgb,var(--panel2) 90%,transparent)!important}
  .ariaThemeGrid{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-top:10px}.ariaThemeModeBtn{padding:12px 8px!important;border:1px solid var(--line)!important}.ariaThemeModeBtn.active{outline:2px solid var(--accent);background:color-mix(in srgb,var(--accent) 14%,var(--panel2))!important}
  .ariaPaletteRow{display:flex;gap:10px;flex-wrap:wrap;margin-top:10px}.ariaPalette{width:44px;height:44px;border-radius:14px!important;border:2px solid transparent!important;box-shadow:inset 0 1px 0 rgba(255,255,255,.25)}.ariaPalette.active{outline:3px solid color-mix(in srgb,var(--accent) 45%,transparent)}
  .ariaThemePreview{margin-top:12px;padding:14px;border-radius:16px;background:linear-gradient(135deg,color-mix(in srgb,var(--accent) 18%,var(--panel2)),color-mix(in srgb,var(--accent2) 14%,var(--panel)));border:1px solid color-mix(in srgb,var(--accent) 28%,var(--line))}
  @media(max-width:700px){.ariaThemeGrid{grid-template-columns:1fr 1fr 1fr}#ariaThemeBtn{width:39px;height:39px}.top{gap:6px}.top>div:last-child{gap:6px!important}}
  `;
  document.head.appendChild(css);

  function ensureDialog(){
    if($('ariaThemeDialog'))return $('ariaThemeDialog');
    const d=document.createElement('dialog');d.id='ariaThemeDialog';
    d.innerHTML=`<div style="min-width:min(560px,88vw)"><div class="sectionHead"><b>🎨 ظاهر ARIA</b><button type="button" class="ghost" id="ariaThemeClose">بستن</button></div><div class="sub" style="margin-top:6px">حالت نمایش و رنگ اصلی برنامه را انتخاب کن.</div><div class="ariaThemeGrid"><button type="button" class="ariaThemeModeBtn" data-mode="light">☀️<br>روز</button><button type="button" class="ariaThemeModeBtn" data-mode="dark">🌙<br>شب</button><button type="button" class="ariaThemeModeBtn" data-mode="auto">◐<br>اتومات</button></div><div style="margin-top:16px"><b>رنگ اصلی</b><div class="ariaPaletteRow">${Object.entries(presets).map(([k,v])=>`<button type="button" class="ariaPalette" data-aria-palette="${k}" title="${v.name}" style="background:linear-gradient(135deg,${v.accent},${v.accent2})"></button>`).join('')}</div></div><label style="margin-top:14px">رنگ دلخواه<input id="ariaThemeCustom" type="color" style="height:48px;padding:5px"></label><div class="ariaThemePreview"><b>ARIA</b><div class="sub">پیش‌نمایش تم انتخابی</div></div></div>`;
    document.body.appendChild(d);
    $('ariaThemeClose').onclick=()=>d.close();
    d.querySelectorAll('[data-mode]').forEach(b=>b.onclick=()=>{const p=prefs();p.mode=b.dataset.mode;save(p);apply();markModes()});
    d.querySelectorAll('[data-aria-palette]').forEach(b=>b.onclick=()=>{const p=prefs();p.palette=b.dataset.ariaPalette;delete p.customAccent;save(p);apply()});
    $('ariaThemeCustom').oninput=e=>{const p=prefs();p.customAccent=e.target.value;save(p);apply()};
    return d;
  }
  function markModes(){const p=prefs();document.querySelectorAll('[data-mode]').forEach(b=>b.classList.toggle('active',b.dataset.mode===(p.mode||'auto')))}
  function mountButton(){
    if($('ariaThemeBtn'))return;
    const top=document.querySelector('header .top>div:last-child')||document.querySelector('.top>div:last-child');if(!top)return;
    const b=document.createElement('button');b.id='ariaThemeBtn';b.type='button';b.title='ظاهر و تم';b.textContent='🎨';
    b.onclick=()=>{ensureDialog().showModal();apply();markModes()};
    top.insertBefore(b,top.firstChild);
  }
  apply();ensureDialog();mountButton();
  new MutationObserver(()=>mountButton()).observe(document.documentElement,{childList:true,subtree:true});
  if(mm){const fn=()=>{if((prefs().mode||'auto')==='auto')apply()};mm.addEventListener?mm.addEventListener('change',fn):mm.addListener?.(fn)}
})();