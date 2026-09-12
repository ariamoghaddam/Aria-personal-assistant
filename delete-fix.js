(function(){
  if(window.__ARIA_DELETE_FIX_V1)return;window.__ARIA_DELETE_FIX_V1=true;
  const cfg=window.ARIA_CLOUD||{};
  const TOMBSTONES='ARIA_TASK_DELETE_TOMBSTONES_V1';
  const valid=x=>/^[0-9a-f-]{36}$/i.test(String(x||''));
  const readTs=()=>{try{return JSON.parse(localStorage.getItem(TOMBSTONES)||'[]')}catch{return[]}};
  const writeTs=a=>localStorage.setItem(TOMBSTONES,JSON.stringify([...new Set(a.filter(Boolean))]));
  function getClient(){try{return window.supabase?.createClient&&cfg.supabaseUrl&&cfg.supabaseAnonKey?window.supabase.createClient(cfg.supabaseUrl,cfg.supabaseAnonKey):null}catch{return null}}
  async function deleteRemote(id){
    if(!valid(id))return true;
    const c=getClient();if(!c)return false;
    const {data}=await c.auth.getSession();const u=data?.session?.user;if(!u)return false;
    const {error}=await c.from('aria_tasks').delete().eq('owner_id',u.id).eq('id',id);
    return !error;
  }
  async function flush(){
    let a=readTs();if(!a.length)return;
    const keep=[];
    for(const id of a){try{if(!(await deleteRemote(id)))keep.push(id)}catch{keep.push(id)}}
    writeTs(keep);
  }
  async function removeTask(id){
    if(!id)return;
    const a=readTs();if(!a.includes(id)){a.push(id);writeTs(a)}
    try{if(typeof db!=='undefined'&&db?.tasks)db.tasks=db.tasks.filter(t=>String(t.id)!==String(id));}catch(_){ }
    try{if(typeof save==='function')save();else localStorage.setItem('ARIA_ASSISTANT_PRO_V2',JSON.stringify(db))}catch(_){ }
    try{document.getElementById('taskDialog')?.close()}catch(_){ }
    try{if(typeof render==='function')render()}catch(_){ }
    await flush();
  }
  function install(){
    const b=document.getElementById('deleteTaskBtn');if(!b)return;
    b.onclick=async()=>{
      const id=document.getElementById('taskId')?.value||'';
      if(!id)return;
      if(!confirm('این کار برای همیشه حذف شود؟'))return;
      b.disabled=true;
      try{await removeTask(id)}finally{b.disabled=false}
    };
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(install,300));else setTimeout(install,300);
  window.addEventListener('pageshow',()=>{setTimeout(install,200);flush()});
  setTimeout(flush,1200);
  window.ARIA_DELETE_FIX={removeTask,flush};
})();
