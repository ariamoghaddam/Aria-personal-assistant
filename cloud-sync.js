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

  window.addEventListener('load',()=>setTimeout(installEnhancements,150));
  function installEnhancements(){
    try{
      document.getElementById('phoneLoginBtn')?.remove();
      document.getElementById('phoneDialog')?.remove();

      const pdesc=document.getElementById('projectDesc');
      if(pdesc&&!document.getElementById('projectColor')){
        const lab=document.createElement('label');lab.innerHTML='رنگ پروژه<input id="projectColor" type="color" value="#2dd4bf" style="height:46px;padding:5px">';
        pdesc.closest('label').before(lab);
      }
      if(window.projectForm){
        projectForm.onsubmit=e=>{
          e.preventDefault();
          const id=(crypto&&crypto.randomUUID)?crypto.randomUUID():'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g,c=>{let r=Math.random()*16|0,v=c==='x'?r:(r&3|8);return v.toString(16)});
          db.projects.push({id,name:projectName.value.trim(),area:projectArea.value,color:(document.getElementById('projectColor')?.value||'#2dd4bf'),desc:projectDesc.value.trim()});
          save();projectDialog.close();
        };
      }

      renderProjects=function(){
        return `<section class="card section"><div class="sectionHead"><b>پروژه‌ها و پوشه‌ها</b><button onclick="openProject()">＋ پروژه</button></div>
        <div class="projectGrid">${db.projects.map(p=>{const n=db.tasks.filter(t=>t.project===p.id&&t.status!=='done').length,c=p.color||'#2dd4bf';return `<div class="project" style="border-top:4px solid ${c}" onclick="currentProject='${p.id}';view='projects';render()"><b>${esc(p.name)}</b><small>${n} کار باز • ${p.area==='music'?'موسیقی':p.area==='work'?'کاری':p.area==='personal'?'شخصی':'عمومی'}</small>${p.desc?`<div class="desc">${esc(p.desc)}</div>`:''}<div style="display:flex;gap:7px;align-items:center;margin-top:10px" onclick="event.stopPropagation()"><input type="color" value="${c}" style="width:38px;height:30px;padding:2px" onchange="ARIA_setProjectColor('${p.id}',this.value)"><button class="danger" style="font-size:10px;padding:6px 8px" onclick="ARIA_deleteProject('${p.id}')">حذف پروژه</button></div></div>`}).join('')}</div></section>`+(currentProject?renderTasksSection('کارهای '+projectName(currentProject)):'');
      };
      window.ARIA_setProjectColor=async(id,color)=>{let p=db.projects.find(x=>x.id===id);if(!p)return;p.color=color;save();await updateProjectColor(id,color)};
      window.ARIA_deleteProject=async id=>{let p=db.projects.find(x=>x.id===id);if(!p||!confirm(`پروژه «${p.name}» حذف شود؟`))return;await deleteProject(id);db.projects=db.projects.filter(x=>x.id!==id);db.tasks.forEach(t=>{if(t.project===id)t.project='general'});if(currentProject===id)currentProject=null;save()};

      const originalRender=render;
      render=function(){
        originalRender();
        if(view==='today'){
          const iso=addDays(todayISO(),1),a=db.tasks.filter(t=>t.date===iso&&t.status!=='done');
          main.insertAdjacentHTML('beforeend',`<section class="card section"><div class="sectionHead"><b>تابلو اعلانات فردا</b><span class="sub">${a.length} مورد</span></div><div class="taskList">${a.length?a.map(renderTask).join(''):'<div class="empty">برای فردا کاری ثبت نشده.</div>'}</div></section>`);
        }
      };

      const dateFaEl=document.getElementById('dateFa'), dateEl=document.getElementById('date');
      if(dateFaEl&&dateEl&&!document.getElementById('ariaDatePicker')){
        dateFaEl.readOnly=true;dateFaEl.style.cursor='pointer';
        const btn=document.createElement('button');btn.type='button';btn.className='ghost';btn.textContent='📅 انتخاب روز';btn.style.marginTop='5px';dateFaEl.after(btn);
        const dlg=document.createElement('dialog');dlg.id='ariaDatePicker';dlg.innerHTML='<div><div class="calHead"><button type="button" id="adpPrev" class="ghost">‹ ماه قبل</button><div style="text-align:center"><b id="adpTitle"></b><div class="sub">روز را انتخاب کن</div></div><button type="button" id="adpNext" class="ghost">ماه بعد ›</button></div><div class="jweek"><span>ش</span><span>ی</span><span>د</span><span>س</span><span>چ</span><span>پ</span><span>ج</span></div><div id="adpGrid" class="jcal"></div><div class="modalActions" style="margin-top:10px"><button type="button" id="adpToday">امروز</button><button type="button" id="adpClose">بستن</button></div></div>';document.body.appendChild(dlg);
        let py,pm;
        function drawPicker(){let first=jWeek(py,pm,1),days=jmDays(py,pm),cells=[];adpTitle.textContent=`${jMonths[pm-1]} ${faN(py)}`;for(let i=0;i<first;i++)cells.push('<div class="jday empty"></div>');for(let d=1;d<=days;d++){let g=j2g(py,pm,d),iso=`${g.gy}-${String(g.gm).padStart(2,'0')}-${String(g.gd).padStart(2,'0')}`;cells.push(`<button type="button" class="jday ${dateEl.value===iso?'today':''}" onclick="ARIA_chooseDate('${iso}')"><b>${faN(d)}</b></button>`)}adpGrid.innerHTML=cells.join('')}
        function openPicker(){let base=dateEl.value||todayISO(),dd=new Date(base+'T12:00'),j=d2j(dd.getFullYear(),dd.getMonth()+1,dd.getDate());py=j.jy;pm=j.jm;drawPicker();dlg.showModal()}
        window.ARIA_chooseDate=iso=>{dateEl.value=iso;dateFaEl.value=iso2j(iso);dlg.close()};
        btn.onclick=openPicker;dateFaEl.onclick=openPicker;adpClose.onclick=()=>dlg.close();adpToday.onclick=()=>ARIA_chooseDate(todayISO());adpPrev.onclick=()=>{pm--;if(pm<1){pm=12;py--}drawPicker()};adpNext.onclick=()=>{pm++;if(pm>12){pm=1;py++}drawPicker()};
      }

      const eventCache={},loading={};
      function nd(s){return String(s??'').replace(/[۰-۹]/g,d=>'۰۱۲۳۴۵۶۷۸۹'.indexOf(d)).replace(/[٠-٩]/g,d=>'٠١٢٣٤٥٦٧٨٩'.indexOf(d))}
      function parseEvents(x){
        const out={};const add=(d,n,h)=>{d=parseInt(nd(d),10);if(d&&d<=31&&n)(out[d]||=[]).push({name:String(n),holiday:!!h})};
        function walk(v,day=null){if(Array.isArray(v)){v.forEach(z=>walk(z,day));return}if(!v||typeof v!=='object')return;let d=v.day??v.jalali_day??day;if(typeof v.date==='string'){let m=nd(v.date).match(/(?:^|[-/])(\d{1,2})$/);if(m)d=m[1]}let h=!!(v.is_holiday??v.isHoliday??v.holiday),names=[];if(v.event_name)names.push(v.event_name);if(typeof v.event==='string')names.push(v.event);if(Array.isArray(v.events))v.events.forEach(e=>names.push(typeof e==='string'?e:(e?.name||e?.event_name||'')));if(d)names.forEach(n=>add(d,n,h));Object.entries(v).forEach(([k,z])=>{if(['day','jalali_day','date','is_holiday','isHoliday','holiday','event_name','event','events'].includes(k))return;walk(z,/^\d{1,2}$/.test(k)?k:d)})}walk(x);return out
      }
      async function loadEvents(y,m){let k=`${y}-${m}`;if(eventCache[k]||loading[k])return;loading[k]=1;try{let r=await fetch(`https://persian-calendar-api.sajjadth.workers.dev/?year=${y}&month=${m}`,{cache:'no-store'});if(!r.ok)throw 0;eventCache[k]=parseEvents(await r.json())}catch(_){eventCache[k]={}}finally{delete loading[k];if(view==='calendar'&&window._jy===y&&window._jm===m)render()}}
      const originalCalDay=calDay;
      renderCalendar=function(){
        let tj=d2j(new Date().getFullYear(),new Date().getMonth()+1,new Date().getDate());if(!window._jy){_jy=tj.jy;_jm=tj.jm}loadEvents(_jy,_jm);let first=jWeek(_jy,_jm,1),days=jmDays(_jy,_jm),cells=[],evs=eventCache[`${_jy}-${_jm}`]||{};for(let i=0;i<first;i++)cells.push('<div class="jday empty"></div>');
        for(let d=1;d<=days;d++){let g=j2g(_jy,_jm,d),iso=`${g.gy}-${String(g.gm).padStart(2,'0')}-${String(g.gd).padStart(2,'0')}`,ts=db.tasks.filter(t=>t.date===iso&&t.status!=='done'),today=tj.jy===_jy&&tj.jm===_jm&&tj.jd===d,ev=evs[d]||[],hol=ev.some(e=>e.holiday);cells.push(`<div class="jday ${today?'today':''} ${ts.length?'has':''}" style="${hol?'border-color:#a43d48;background:#241317':''}" onclick="ARIA_calDay('${iso}',${d})"><b>${faN(d)}</b>${ts.length?`<small>${faN(ts.length)} کار</small>`:''}${ev.slice(0,2).map(e=>`<small style="display:block;font-size:8px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;color:${e.holiday?'#ffc6cb':'#a9c7d8'}">${e.holiday?'● ':''}${esc(e.name)}</small>`).join('')}</div>`)}
        let mts=db.tasks.filter(t=>t.date&&iso2j(t.date).startsWith(`${faN(_jy)}/${faN(String(_jm).padStart(2,'0'))}`)&&t.status!=='done');
        return `<section class="card section"><div class="calHead"><button class="ghost" onclick="calPrev()">‹ ماه قبل</button><div style="text-align:center"><b>${jMonths[_jm-1]} ${faN(_jy)}</b><div class="sub">تقویم شمسی • تعطیلات و مناسبت‌ها ${loading[`${_jy}-${_jm}`]?'(در حال دریافت...)':''}</div></div><button class="ghost" onclick="calNext()">ماه بعد ›</button></div><div class="jweek"><span>ش</span><span>ی</span><span>د</span><span>س</span><span>چ</span><span>پ</span><span>ج</span></div><div class="jcal">${cells.join('')}</div></section><section class="card section"><div class="sectionHead"><b>کارهای این ماه</b><span class="sub">${faN(mts.length)} مورد</span></div><div class="taskList">${mts.length?mts.map(renderTask).join(''):'<div class="empty">برای این ماه کاری ثبت نشده.</div>'}</div></section>`;
      };
      window.ARIA_calDay=(iso,d)=>{let a=db.tasks.filter(t=>t.date===iso),ev=(eventCache[`${_jy}-${_jm}`]||{})[d]||[],lines=[];ev.forEach(e=>lines.push((e.holiday?'🔴 ':'• ')+e.name));if(a.length)lines.push('',...a.map(x=>'✅ '+x.title));if(!lines.length)return originalCalDay(iso);alert(iso2j(iso)+'\n\n'+lines.join('\n'))};

      render();
    }catch(e){console.error('ARIA enhancements',e)}
  }
})();