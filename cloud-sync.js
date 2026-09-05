
(function(){
  const cfg = window.ARIA_CLOUD || {};
  let client = null, user = null, onState=()=>{}, onData=()=>{}, syncing=false, timer=null;

  function projectToLocal(p){ return {id:p.id,name:p.name,area:p.area,desc:p.description||''}; }
  function taskToLocal(t){ return {
    id:t.id,title:t.title,project:t.project_id||'general',area:t.area||'general',description:t.description||'',
    date:t.due_date||'',time:t.due_time?String(t.due_time).slice(0,5):'',priority:t.priority||'normal',
    status:t.status||'todo',repeat:t.repeat_rule||'none',subtasks:Array.isArray(t.subtasks)?t.subtasks:[],
    attachments:Array.isArray(t.attachments)?t.attachments:[],drawing:t.drawing_url||null,createdAt:new Date(t.created_at).getTime()
  }; }
  function musicToLocal(m){ return {
    id:m.id,type:m.type,title:m.title,date:m.event_date||'',duration:m.duration||'',note:m.note||''
  }; }

  async function pull(){
    if(!client||!user)return;
    const [p,t,m]=await Promise.all([
      client.from('aria_projects').select('*').eq('owner_id',user.id).order('created_at'),
      client.from('aria_tasks').select('*').eq('owner_id',user.id).order('created_at'),
      client.from('aria_music').select('*').eq('owner_id',user.id).order('created_at')
    ]);
    if(p.error||t.error||m.error) return;
    let projects=(p.data||[]).map(projectToLocal);
    if(!projects.length){
      const defaults=[
        {name:'عمومی',area:'general',description:''},
        {name:'داریس / آزمایشگاه',area:'work',description:''},
        {name:'نمایشگاه و رویداد',area:'work',description:''},
        {name:'آوای بندر / موسیقی',area:'music',description:''},
        {name:'شخصی',area:'personal',description:''}
      ].map(x=>({...x,owner_id:user.id}));
      await client.from('aria_projects').insert(defaults);
      const rr=await client.from('aria_projects').select('*').eq('owner_id',user.id).order('created_at');
      projects=(rr.data||[]).map(projectToLocal);
    }
    onData({settings:{smartPostponeDays:1},projects,tasks:(t.data||[]).map(taskToLocal),music:(m.data||[]).map(musicToLocal),archive:[]});
    onState('online');
  }

  async function pushSnapshot(db){
    if(syncing||!client||!user)return;
    syncing=true;
    try{
      // Upsert projects first
      for(const p of db.projects||[]){
        if(String(p.id).length<30) continue; // local seed IDs are not UUIDs; cloud defaults are created separately
        await client.from('aria_projects').upsert({
          id:p.id,owner_id:user.id,name:p.name,area:p.area||'general',description:p.desc||''
        });
      }
      // Resolve local project names to cloud IDs when needed
      const rp=await client.from('aria_projects').select('*').eq('owner_id',user.id);
      const cloudProjects=rp.data||[];
      const nameMap=new Map(cloudProjects.map(p=>[p.name,p.id]));
      const idMap=new Map(cloudProjects.map(p=>[p.id,p.id]));

      for(const t of db.tasks||[]){
        let pid=idMap.get(t.project);
        if(!pid){
          const localP=(db.projects||[]).find(p=>p.id===t.project);
          if(localP) pid=nameMap.get(localP.name);
        }
        const row={
          owner_id:user.id,title:t.title,project_id:pid||null,area:t.area||'general',description:t.description||'',
          due_date:t.date||null,due_time:t.time||null,priority:t.priority||'normal',status:t.status||'todo',
          repeat_rule:t.repeat||'none',subtasks:t.subtasks||[],attachments:t.attachments||[],drawing_url:t.drawing||null
        };
        if(String(t.id).length>30) row.id=t.id;
        const r=await client.from('aria_tasks').upsert(row).select().single();
        if(r.data && String(t.id).length<30) t.id=r.data.id;
      }
      for(const m of db.music||[]){
        const row={owner_id:user.id,type:m.type,title:m.title,event_date:m.date||null,duration:m.duration||'',note:m.note||''};
        if(String(m.id).length>30) row.id=m.id;
        const r=await client.from('aria_music').upsert(row).select().single();
        if(r.data && String(m.id).length<30) m.id=r.data.id;
      }
      localStorage.setItem('ARIA_ASSISTANT_PRO_V2',JSON.stringify(db));
    } finally { syncing=false; }
  }

  function subscribe(){
    client.channel('aria-live')
      .on('postgres_changes',{event:'*',schema:'public',table:'aria_projects',filter:`owner_id=eq.${user.id}`},()=>pull())
      .on('postgres_changes',{event:'*',schema:'public',table:'aria_tasks',filter:`owner_id=eq.${user.id}`},()=>pull())
      .on('postgres_changes',{event:'*',schema:'public',table:'aria_music',filter:`owner_id=eq.${user.id}`},()=>pull())
      .subscribe();
  }

  async function init(opts={}){
    onState=opts.onState||onState; onData=opts.onData||onData;
    if(!cfg.cloudEnabled||!cfg.supabaseUrl||!cfg.supabaseAnonKey){onState('offline');return}
    client=supabase.createClient(cfg.supabaseUrl,cfg.supabaseAnonKey);
    const {data}=await client.auth.getSession();
    user=data.session?.user||null;
    if(!user){onState('auth')}
    else {subscribe();await pull()}
    client.auth.onAuthStateChange(async(_event,session)=>{
      user=session?.user||null;
      if(user){subscribe();await pull()} else onState('auth');
    });
  }

  async function signIn(email,password){
    if(!client) await init({});
    const {error}=await client.auth.signInWithPassword({email,password});
    return error?{ok:false,error:error.message}:{ok:true};
  }
  async function signUp(email,password){
    if(!client) await init({});
    const {error}=await client.auth.signUp({email,password});
    return error?{ok:false,error:error.message}:{ok:true};
  }
  function queueFullSync(db){
    clearTimeout(timer);
    timer=setTimeout(()=>pushSnapshot(db),500);
  }
  window.ARIA_SYNC={init,signIn,signUp,queueFullSync,pull};
})();
