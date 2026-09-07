(function(){
  const cfg=window.ARIA_CLOUD||{};
  let client=null,user=null,onState=()=>{},onData=()=>{},onRecovery=()=>{},syncing=false,timer=null,liveChannel=null;
  const recoveryHint=/(?:#|[?&])type=recovery(?:&|$)/.test(window.location.href);

  function projectToLocal(p){return {id:p.id,name:p.name,area:p.area||'general',desc:p.description||'',color:p.color||'#2dd4bf'}}
  function taskToLocal(t){return {id:t.id,title:t.title,project:t.project_id||'general',area:t.area||'general',description:t.description||'',date:t.due_date||'',time:t.due_time?String(t.due_time).slice(0,5):'',priority:t.priority||'normal',status:t.status||'todo',repeat:t.repeat_rule||'none',subtasks:Array.isArray(t.subtasks)?t.subtasks:[],attachments:Array.isArray(t.attachments)?t.attachments:[],drawing:t.drawing_url||null,createdAt:new Date(t.created_at).getTime()}}
  function musicToLocal(m){return {id:m.id,type:m.type,title:m.title,date:m.event_date||'',duration:m.duration||'',note:m.note||''}}

  async function pull(){
    if(!client||!user)return;
    const [p,t,m]=await Promise.all([
      client.from('aria_projects').select('*').eq('owner_id',user.id).order('created_at'),
      client.from('aria_tasks').select('*').eq('owner_id',user.id).order('created_at'),
      client.from('aria_music').select('*').eq('owner_id',user.id).order('created_at')
    ]);
    if(p.error||t.error||m.error)return;
    onData({settings:{smartPostponeDays:1},projects:(p.data||[]).map(projectToLocal),tasks:(t.data||[]).map(taskToLocal),music:(m.data||[]).map(musicToLocal),archive:[]});
    onState('online');
  }

  async function pushSnapshot(dbx){
    if(syncing||!client||!user)return;
    syncing=true;
    try{
      for(const p of dbx.projects||[]){
        if(!/^[0-9a-f-]{36}$/i.test(String(p.id)))continue;
        await client.from('aria_projects').upsert({id:p.id,owner_id:user.id,name:p.name,area:p.area||'general',description:p.desc||'',color:p.color||'#2dd4bf'});
      }
      const rp=await client.from('aria_projects').select('id').eq('owner_id',user.id);
      const ids=new Set((rp.data||[]).map(x=>x.id));
      for(const t of dbx.tasks||[]){
        const row={owner_id:user.id,title:t.title,project_id:ids.has(t.project)?t.project:null,area:t.area||'general',description:t.description||'',due_date:t.date||null,due_time:t.time||null,priority:t.priority||'normal',status:t.status||'todo',repeat_rule:t.repeat||'none',subtasks:t.subtasks||[],attachments:t.attachments||[],drawing_url:t.drawing||null};
        if(/^[0-9a-f-]{36}$/i.test(String(t.id)))row.id=t.id;
        const r=await client.from('aria_tasks').upsert(row).select().single();
        if(r.data&&!/^[0-9a-f-]{36}$/i.test(String(t.id)))t.id=r.data.id;
      }
      for(const m of dbx.music||[]){
        const row={owner_id:user.id,type:m.type,title:m.title,event_date:m.date||null,duration:m.duration||'',note:m.note||''};
        if(/^[0-9a-f-]{36}$/i.test(String(m.id)))row.id=m.id;
        const r=await client.from('aria_music').upsert(row).select().single();
        if(r.data&&!/^[0-9a-f-]{36}$/i.test(String(m.id)))m.id=r.data.id;
      }
      localStorage.setItem('ARIA_ASSISTANT_PRO_V2',JSON.stringify(dbx));
    }finally{syncing=false}
  }

  function subscribe(){
    if(!client||!user)return;
    if(liveChannel){try{client.removeChannel(liveChannel)}catch(_){}}
    liveChannel=client.channel('aria-live')
      .on('postgres_changes',{event:'*',schema:'public',table:'aria_projects',filter:`owner_id=eq.${user.id}`},()=>setTimeout(pull,0))
      .on('postgres_changes',{event:'*',schema:'public',table:'aria_tasks',filter:`owner_id=eq.${user.id}`},()=>setTimeout(pull,0))
      .on('postgres_changes',{event:'*',schema:'public',table:'aria_music',filter:`owner_id=eq.${user.id}`},()=>setTimeout(pull,0))
      .subscribe();
  }
  function handleSignedIn(session){user=session?.user||null;if(!user){onState('auth');return}onState('online');setTimeout(async()=>{try{subscribe();await pull()}catch(e){console.error(e)}},0)}

  async function init(opts={}){
    onState=opts.onState||onState;onData=opts.onData||onData;onRecovery=opts.onRecovery||onRecovery;
    if(!cfg.cloudEnabled||!cfg.supabaseUrl||!cfg.supabaseAnonKey){onState('offline');return}
    client=supabase.createClient(cfg.supabaseUrl,cfg.supabaseAnonKey);
    const {data}=await client.auth.getSession();user=data.session?.user||null;
    if(!user)onState('auth');else{onState('online');subscribe();await pull();if(recoveryHint)onRecovery(data.session)}
    client.auth.onAuthStateChange((event,session)=>{user=session?.user||null;if(event==='PASSWORD_RECOVERY'){onRecovery(session);if(session)onState('online');return}if(user)handleSignedIn(session);else onState('auth')});
  }
  async function signIn(email,password){if(!client)await init({});try{const {data,error}=await client.auth.signInWithPassword({email,password});if(error)return {ok:false,error:error.message};handleSignedIn(data.session);return {ok:true}}catch(e){return {ok:false,error:e?.message||'خطا در ورود'}}}
  async function signUp(email,password){if(!client)await init({});const {error}=await client.auth.signUp({email,password,options:{emailRedirectTo:window.location.origin+'/'}});return error?{ok:false,error:error.message}:{ok:true}}
  async function resendConfirmation(email){if(!client)await init({});const {error}=await client.auth.resend({type:'signup',email,options:{emailRedirectTo:window.location.origin+'/'}});return error?{ok:false,error:error.message}:{ok:true}}
  async function requestPasswordReset(email){if(!client)await init({});const {error}=await client.auth.resetPasswordForEmail(email,{redirectTo:window.location.origin+'/'});return error?{ok:false,error:error.message}:{ok:true}}
  async function resetPassword(email){return requestPasswordReset(email)}
  async function updatePassword(password){if(!client)await init({});const {data,error}=await client.auth.updateUser({password});if(error)return {ok:false,error:error.message};user=data.user||user;try{history.replaceState({},document.title,window.location.pathname+window.location.search)}catch(_){}onState('online');setTimeout(pull,0);return {ok:true}}
  async function updateProjectColor(id,color){if(!client||!user||!/^[0-9a-f-]{36}$/i.test(String(id)))return {ok:true};const {error}=await client.from('aria_projects').update({color}).eq('id',id).eq('owner_id',user.id);return error?{ok:false,error:error.message}:{ok:true}}
  async function deleteProject(id){if(!client||!user||!/^[0-9a-f-]{36}$/i.test(String(id)))return {ok:true};let a=await client.from('aria_tasks').update({project_id:null}).eq('owner_id',user.id).eq('project_id',id);if(a.error)return {ok:false,error:a.error.message};let b=await client.from('aria_projects').delete().eq('owner_id',user.id).eq('id',id);return b.error?{ok:false,error:b.error.message}:{ok:true}}
  function queueFullSync(dbx){clearTimeout(timer);timer=setTimeout(()=>pushSnapshot(dbx),500)}
  window.ARIA_SYNC={init,signIn,signUp,resendConfirmation,requestPasswordReset,resetPassword,updatePassword,updateProjectColor,deleteProject,queueFullSync,pull};

  window.addEventListener('load',()=>setTimeout(installEnhancements,180));
  function installEnhancements(){
    try{
      document.getElementById('phoneLoginBtn')?.remove();
      document.getElementById('phoneDialog')?.remove();

      const pdesc=document.getElementById('projectDesc');
      if(pdesc&&!document.getElementById('projectColor')){
        const lab=document.createElement('label');lab.innerHTML='رنگ پروژه<input id="projectColor" type="color" value="#2dd4bf" style="height:46px;padding:5px">';
        pdesc.closest('label').before(lab);
      }
      const pf=document.getElementById('projectForm');
      if(pf){
        pf.onsubmit=e=>{
          e.preventDefault();
          const pn=document.getElementById('projectName');
          const pa=document.getElementById('projectArea');
          const pd=document.getElementById('projectDesc');
          const pc=document.getElementById('projectColor');
          const dlg=document.getElementById('projectDialog');
          const name=(pn?.value||'').trim();
          if(!name){alert('نام پروژه را وارد کن.');return;}
          const id=(window.crypto&&window.crypto.randomUUID)?window.crypto.randomUUID():'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g,c=>{let r=Math.random()*16|0,v=c==='x'?r:(r&3|8);return v.toString(16)});
          db.projects.push({id,name,area:pa?.value||'general',color:pc?.value||'#2dd4bf',desc:(pd?.value||'').trim()});
          save();
          if(dlg?.open) dlg.close();
          currentProject=id;
          view='projects';
          render();
        };
      }

      window.ARIA_setProjectColor=async(id,color)=>{let p=db.projects.find(x=>x.id===id);if(!p)return;p.color=color;save();await updateProjectColor(id,color)};
      window.ARIA_deleteProject=async id=>{let p=db.projects.find(x=>x.id===id);if(!p||!confirm(`پروژه «${p.name}» حذف شود؟`))return;await deleteProject(id);db.projects=db.projects.filter(x=>x.id!==id);db.tasks.forEach(t=>{if(t.project===id)t.project='general'});if(currentProject===id)currentProject=null;save()};
      window.ARIA_openProject=id=>{currentProject=id;view='projects';render()};
      window.ARIA_backProjects=()=>{currentProject=null;view='projects';render()};
      window.ARIA_newTaskInProject=id=>{currentProject=id;openTask();setTimeout(()=>{if(window.project)project.value=id},20)};

      renderProjects=function(){
        if(currentProject){
          const p=db.projects.find(x=>x.id===currentProject);
          if(!p){currentProject=null;return renderProjects()}
          const c=p.color||'#2dd4bf';
          const tasks=db.tasks.filter(t=>t.project===p.id).sort((a,b)=>(a.date||'9999').localeCompare(b.date||'9999'));
          return `<section class="card section"><div class="sectionHead"><div style="display:flex;align-items:center;gap:10px"><button class="ghost" onclick="ARIA_backProjects()">← پروژه‌ها</button><div><b style="font-size:18px">${esc(p.name)}</b><div class="sub">${p.desc?esc(p.desc):'پوشه پروژه'}</div></div></div><button class="primary" onclick="ARIA_newTaskInProject('${p.id}')">＋ کار جدید در این پروژه</button></div><div style="height:5px;border-radius:8px;background:${c};margin:12px 0"></div><div class="taskList">${tasks.length?tasks.map(renderTask).join(''):'<div class="empty">هنوز کاری داخل این پروژه نیست. از دکمه «کار جدید در این پروژه» استفاده کن.</div>'}</div></section>`;
        }
        return `<section class="card section"><div class="sectionHead"><b>پروژه‌ها و پوشه‌ها</b><button onclick="openProject()">＋ پروژه</button></div><div class="projectGrid">${db.projects.map(p=>{const n=db.tasks.filter(t=>t.project===p.id&&t.status!=='done').length,c=p.color||'#2dd4bf';return `<div class="project" style="border-top:4px solid ${c}" onclick="ARIA_openProject('${p.id}')"><b>📁 ${esc(p.name)}</b><small>${n} کار باز • ${p.area==='music'?'موسیقی':p.area==='work'?'کاری':p.area==='personal'?'شخصی':'عمومی'}</small>${p.desc?`<div class="desc">${esc(p.desc)}</div>`:''}<div style="display:flex;gap:7px;align-items:center;margin-top:10px" onclick="event.stopPropagation()"><input type="color" value="${c}" style="width:38px;height:30px;padding:2px" onchange="ARIA_setProjectColor('${p.id}',this.value)"><button class="danger" style="font-size:10px;padding:6px 8px" onclick="ARIA_deleteProject('${p.id}')">حذف پروژه</button></div></div>`}).join('')}</div></section>`;
      };

      const originalRender=render;
      render=function(){originalRender();if(view==='today'){const iso=addDays(todayISO(),1),a=db.tasks.filter(t=>t.date===iso&&t.status!=='done');main.insertAdjacentHTML('beforeend',`<section class="card section"><div class="sectionHead"><b>تابلو اعلانات فردا</b><span class="sub">${a.length} مورد</span></div><div class="taskList">${a.length?a.map(renderTask).join(''):'<div class="empty">برای فردا کاری ثبت نشده.</div>'}</div></section>`)}};
      render();
    }catch(e){console.error('ARIA enhancements',e)}
  }
})();
