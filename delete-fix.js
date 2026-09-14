(function(){
  if(window.__ARIA_DELETE_FIX_V2)return;window.__ARIA_DELETE_FIX_V2=true;
  const cfg=window.ARIA_CLOUD||{};
  const TOMBSTONES='ARIA_TASK_DELETE_TOMBSTONES_V1';
  const STORE='ARIA_ASSISTANT_PRO_V2';
  const valid=x=>/^[0-9a-f-]{36}$/i.test(String(x||''));
  const readTs=()=>{try{return [...new Set((JSON.parse(localStorage.getItem(TOMBSTONES)||'[]')||[]).map(String).filter(Boolean))]}catch{return[]}};
  const writeTs=a=>{try{localStorage.setItem(TOMBSTONES,JSON.stringify([...new Set((a||[]).map(String).filter(Boolean))]))}catch(_){}};
  const hasTs=id=>readTs().includes(String(id));
  const addTs=id=>{const a=readTs();if(!a.includes(String(id))){a.push(String(id));writeTs(a)}};

  function purgeStored(ids){
    try{
      const raw=localStorage.getItem(STORE);if(!raw)return;
      const x=JSON.parse(raw);if(!x||!Array.isArray(x.tasks))return;
      const set=new Set(ids.map(String));
      const n=x.tasks.filter(t=>!set.has(String(t?.id||'')));
      if(n.length!==x.tasks.length){x.tasks=n;localStorage.setItem(STORE,JSON.stringify(x));}
    }catch(_){ }
  }

  function purgeRuntime(ids=readTs()){
    if(!ids.length)return;
    const set=new Set(ids.map(String));
    try{
      if(typeof db!=='undefined'&&Array.isArray(db?.tasks)){
        const before=db.tasks.length;
        db.tasks=db.tasks.filter(t=>!set.has(String(t?.id||'')));
        if(before!==db.tasks.length&&typeof save==='function')save();
      }
    }catch(_){ }
    purgeStored([...set]);
    try{if(typeof render==='function')render()}catch(_){ }
  }

  function getClient(){
    try{return window.supabase?.createClient&&cfg.supabaseUrl&&cfg.supabaseAnonKey?window.supabase.createClient(cfg.supabaseUrl,cfg.supabaseAnonKey):null}catch{return null}
  }

  async function deleteRemote(id){
    if(!valid(id))return true;
    const c=getClient();if(!c)return false;
    const {data}=await c.auth.getSession();const u=data?.session?.user;if(!u)return false;
    const {error}=await c.from('aria_tasks').delete().eq('owner_id',u.id).eq('id',id);
    return !error;
  }

  async function flush(){
    const ids=readTs();if(!ids.length)return;
    purgeRuntime(ids);
    for(const id of ids){try{await deleteRemote(id)}catch(_){ }}
    purgeRuntime(ids);
  }

  async function removeTask(id){
    id=String(id||'').trim();if(!id)return false;
    addTs(id);
    purgeRuntime([id]);
    try{document.getElementById('taskDialog')?.close()}catch(_){ }
    const ok=await deleteRemote(id).catch(()=>false);
    purgeRuntime([id]);
    if(ok){try{setTimeout(()=>window.ARIA_SYNC?.pull?.(),120)}catch(_){ }}
    return ok;
  }

  async function handleDeleteClick(e){
    const b=e.target?.closest?.('#deleteTaskBtn');if(!b)return;
    e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();
    const id=document.getElementById('taskId')?.value||b.dataset?.taskId||'';
    if(!id)return;
    if(!confirm('این کار برای همیشه حذف شود؟'))return;
    b.disabled=true;
    try{await removeTask(id)}finally{b.disabled=false}
  }

  document.addEventListener('click',handleDeleteClick,true);
  window.addEventListener('pageshow',()=>setTimeout(flush,150));
  window.addEventListener('online',flush);
  setTimeout(flush,700);
  setInterval(()=>purgeRuntime(readTs()),1800);
  window.ARIA_DELETE_FIX={removeTask,flush,purge:purgeRuntime};
})();
