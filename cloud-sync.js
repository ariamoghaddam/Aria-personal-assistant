
(function(){
  const cfg = window.ARIA_CLOUD || {};
  let client = null, user = null, onState=()=>{}, onData=()=>{}, onRecovery=()=>{}, syncing=false, timer=null;
  const recoveryHint = /(?:#|[?&])type=recovery(?:&|$)/.test(window.location.href);


  function ensurePhoneUi(){
    if(document.getElementById('phoneLoginBtn')) return;
    const form=document.getElementById('authForm');
    if(!form) return;
    const actions=form.querySelector('.modalActions');
    if(actions){
      const b=document.createElement('button');
      b.type='button'; b.id='phoneLoginBtn'; b.className='primary'; b.textContent='📱 ورود با کد پیامکی';
      actions.insertBefore(b, actions.lastElementChild || null);
    }
    const d=document.createElement('dialog');
    d.id='phoneDialog';
    d.innerHTML=`<form id="phoneForm">
      <h3 style="margin:0">ورود با شماره موبایل</h3>
      <div class="sub">شماره را با کد کشور وارد کن؛ مثل +98... یا +994...</div>
      <label>شماره موبایل<input id="phoneNumber" type="tel" inputmode="tel" required placeholder="+989121234567"></label>
      <div class="modalActions"><button type="button" id="phoneClose">بستن</button><button type="button" id="sendOtpBtn" class="primary">ارسال کد ۶ رقمی</button></div>
      <div id="otpWrap" style="display:none"><label>کد پیامک<input id="phoneOtp" type="text" inputmode="numeric" autocomplete="one-time-code" maxlength="6" placeholder="123456"></label><button type="submit" class="primary" style="width:100%">تأیید و ورود</button></div>
      <div id="phoneMsg" class="sub"></div>
    </form>`;
    document.body.appendChild(d);
    const btn=document.getElementById('phoneLoginBtn'), close=document.getElementById('phoneClose'), send=document.getElementById('sendOtpBtn'), pf=document.getElementById('phoneForm');
    btn.onclick=()=>{ const a=document.getElementById('authDialog'); if(a?.open)a.close(); document.getElementById('phoneMsg').textContent=''; document.getElementById('otpWrap').style.display='none'; d.showModal(); };
    close.onclick=()=>d.close();
    send.onclick=async()=>{
      const phone=document.getElementById('phoneNumber').value.trim().replace(/\s+/g,'');
      const msg=document.getElementById('phoneMsg');
      if(!/^\+[1-9]\d{7,14}$/.test(phone)){ msg.textContent='شماره را با کد کشور وارد کن؛ مثل +98912...'; return; }
      msg.textContent='در حال ارسال کد پیامکی...';
      const r=await sendPhoneOtp(phone);
      if(!r.ok){ msg.textContent=r.error; return; }
      document.getElementById('otpWrap').style.display='block'; msg.textContent='کد ۶ رقمی ارسال شد.';
    };
    pf.onsubmit=async e=>{
      e.preventDefault();
      const phone=document.getElementById('phoneNumber').value.trim().replace(/\s+/g,''), token=document.getElementById('phoneOtp').value.trim(), msg=document.getElementById('phoneMsg');
      if(!/^\d{6}$/.test(token)){ msg.textContent='کد ۶ رقمی را وارد کن.'; return; }
      msg.textContent='در حال تأیید کد...';
      const r=await verifyPhoneOtp(phone,token);
      if(!r.ok){ msg.textContent=r.error; return; }
      msg.textContent='وارد شدی. همگام‌سازی فعال شد.'; setTimeout(()=>d.close(),700);
    };
  }

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
    onState=opts.onState||onState; onData=opts.onData||onData; onRecovery=opts.onRecovery||onRecovery;
    ensurePhoneUi();
    if(!cfg.cloudEnabled||!cfg.supabaseUrl||!cfg.supabaseAnonKey){onState('offline');return}
    client=supabase.createClient(cfg.supabaseUrl,cfg.supabaseAnonKey);
    const {data}=await client.auth.getSession();
    user=data.session?.user||null;
    if(!user){onState('auth')}
    else {
      subscribe();
      await pull();
      if(recoveryHint) onRecovery(data.session);
    }
    client.auth.onAuthStateChange(async(event,session)=>{
      user=session?.user||null;
      if(event==='PASSWORD_RECOVERY'){
        onRecovery(session);
        if(session) onState('online');
        return;
      }
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
    const redirect = window.location.origin + '/';
    const {error}=await client.auth.signUp({
      email,
      password,
      options:{emailRedirectTo: redirect}
    });
    return error?{ok:false,error:error.message}:{ok:true};
  }
  async function resendConfirmation(email){
    if(!client) await init({});
    const redirect = window.location.origin + '/';
    const {error}=await client.auth.resend({
      type:'signup',
      email,
      options:{emailRedirectTo: redirect}
    });
    return error?{ok:false,error:error.message}:{ok:true};
  }
  async function sendPhoneOtp(phone){
    if(!client) await init({});
    const {error}=await client.auth.signInWithOtp({phone,options:{shouldCreateUser:true}});
    return error?{ok:false,error:error.message}:{ok:true};
  }
  async function verifyPhoneOtp(phone,token){
    if(!client) await init({});
    const {data,error}=await client.auth.verifyOtp({phone,token,type:'sms'});
    if(error) return {ok:false,error:error.message};
    user=data.user||data.session?.user||user;
    if(user){ onState('online'); subscribe(); await pull(); }
    return {ok:true};
  }
  async function requestPasswordReset(email){
    if(!client) await init({});
    const redirect = window.location.origin + '/';
    const {error}=await client.auth.resetPasswordForEmail(email,{redirectTo:redirect});
    return error?{ok:false,error:error.message}:{ok:true};
  }
  async function resetPassword(email){ return requestPasswordReset(email); }
  async function updatePassword(password){
    if(!client) await init({});
    const {data,error}=await client.auth.updateUser({password});
    if(error) return {ok:false,error:error.message};
    user=data.user||user;
    try{
      history.replaceState({},document.title,window.location.pathname+window.location.search);
    }catch(_){}
    onState('online');
    if(user) await pull();
    return {ok:true};
  }
  function queueFullSync(db){
    clearTimeout(timer);
    timer=setTimeout(()=>pushSnapshot(db),500);
  }
  window.ARIA_SYNC={init,signIn,signUp,resendConfirmation,sendPhoneOtp,verifyPhoneOtp,requestPasswordReset,resetPassword,updatePassword,queueFullSync,pull};
})();
