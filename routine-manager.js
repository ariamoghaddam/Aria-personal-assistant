(function(){
  if(window.__ARIA_ROUTINE_MANAGER_V1)return;window.__ARIA_ROUTINE_MANAGER_V1=true;
  const day=()=>{const d=new Date();d.setMinutes(d.getMinutes()-d.getTimezoneOffset());return d.toISOString().slice(0,10)};
  let busy=false,last='';
  function normalize(){
    if(busy)return;busy=true;
    try{
      const D=(typeof db!=='undefined'&&db)?db:null;if(!D||!Array.isArray(D.tasks))return;
      const td=day();let changed=false;
      for(const t of D.tasks){
        const rep=String(t.repeat||t.repeat_rule||'none').toLowerCase();if(rep!=='daily')continue;
        t.meta=t.meta&&typeof t.meta==='object'?t.meta:{};
        if(!t.meta.routineStartedAt&&t.date)t.meta.routineStartedAt=t.date;
        const dt=String(t.date||'');
        if(t.status==='postponed'){
          if(dt&&dt<=td){t.status='todo';t.date=td;changed=true}
          continue;
        }
        if(t.status==='done'){
          if(dt&&dt<td){t.status='todo';t.date=td;t.meta.lastRoutineReset=td;changed=true}
          continue;
        }
        if(!dt||dt<td){t.date=td;t.meta.lastRoutineRoll=td;changed=true}
      }
      if(changed){
        try{if(typeof save==='function')save();else localStorage.setItem('ARIA_ASSISTANT_PRO_V2',JSON.stringify(D))}catch(_){}
        try{if(typeof render==='function')render()}catch(_){}
      }
      last=td;
    }finally{busy=false}
  }
  function boot(){normalize();setInterval(()=>{const td=day();if(td!==last)normalize()},60000);document.addEventListener('visibilitychange',()=>{if(!document.hidden)normalize()});window.addEventListener('pageshow',normalize)}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(boot,1200));else setTimeout(boot,1200);
  window.ARIA_ROUTINES={refresh:normalize};
})();