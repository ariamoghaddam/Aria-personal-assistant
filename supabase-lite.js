(function(){
if(window.supabase?.createClient)return;
const STORE='ARIA_SUPABASE_LITE_SESSION_V1';
function createClient(base,anon){
  base=String(base||'').replace(/\/$/,'');
  let listeners=[];
  const read=()=>{try{return JSON.parse(localStorage.getItem(STORE)||'null')}catch{return null}};
  const write=s=>{try{s?localStorage.setItem(STORE,JSON.stringify(s)):localStorage.removeItem(STORE)}catch{}};
  const notify=(ev,s)=>listeners.forEach(fn=>{try{fn(ev,s)}catch{}});
  async function api(path,opt={}){
    const h={'apikey':anon,'Content-Type':'application/json',...(opt.headers||{})};
    const r=await fetch(base+path,{...opt,headers:h});
    let data=null;const txt=await r.text();try{data=txt?JSON.parse(txt):null}catch{data=txt||null}
    if(!r.ok){const msg=data?.msg||data?.message||data?.error_description||data?.error||('HTTP '+r.status);const e=new Error(msg);e.status=r.status;e.data=data;throw e}
    return {data,headers:r.headers,status:r.status};
  }
  async function refreshIfNeeded(){
    let s=read();if(!s?.refresh_token)return s;
    const exp=(s.expires_at||0)*1000;
    if(exp&&Date.now()<exp-60000)return s;
    try{
      const {data}=await api('/auth/v1/token?grant_type=refresh_token',{method:'POST',body:JSON.stringify({refresh_token:s.refresh_token})});
      s={access_token:data.access_token,refresh_token:data.refresh_token||s.refresh_token,expires_in:data.expires_in,user:data.user,expires_at:Math.floor(Date.now()/1000)+(data.expires_in||3600)};
      write(s);notify('TOKEN_REFRESHED',s);return s;
    }catch{write(null);notify('SIGNED_OUT',null);return null}
  }
  async function token(){const s=await refreshIfNeeded();return s?.access_token||anon}
  const auth={
    async getSession(){const s=await refreshIfNeeded();return{data:{session:s},error:null}},
    async signInWithPassword({email,password}){try{const {data}=await api('/auth/v1/token?grant_type=password',{method:'POST',body:JSON.stringify({email,password})});const s={access_token:data.access_token,refresh_token:data.refresh_token,expires_in:data.expires_in,user:data.user,expires_at:Math.floor(Date.now()/1000)+(data.expires_in||3600)};write(s);notify('SIGNED_IN',s);return{data:{session:s,user:data.user},error:null}}catch(e){return{data:{session:null,user:null},error:e}}},
    async signUp({email,password,options={}}){try{const q=options.emailRedirectTo?'?redirect_to='+encodeURIComponent(options.emailRedirectTo):'';const {data}=await api('/auth/v1/signup'+q,{method:'POST',headers:{Authorization:'Bearer '+anon},body:JSON.stringify({email,password})});const s=data?.access_token?{access_token:data.access_token,refresh_token:data.refresh_token,expires_in:data.expires_in,user:data.user,expires_at:Math.floor(Date.now()/1000)+(data.expires_in||3600)}:null;if(s){write(s);notify('SIGNED_IN',s)}return{data:{session:s,user:data?.user||null},error:null}}catch(e){return{data:null,error:e}}},
    async resend({type,email,options={}}){try{const q=options.emailRedirectTo?'?redirect_to='+encodeURIComponent(options.emailRedirectTo):'';await api('/auth/v1/resend'+q,{method:'POST',headers:{Authorization:'Bearer '+anon},body:JSON.stringify({type,email})});return{data:{},error:null}}catch(e){return{data:null,error:e}}},
    async resetPasswordForEmail(email,{redirectTo}={}){try{const q=redirectTo?'?redirect_to='+encodeURIComponent(redirectTo):'';await api('/auth/v1/recover'+q,{method:'POST',headers:{Authorization:'Bearer '+anon},body:JSON.stringify({email})});return{data:{},error:null}}catch(e){return{data:null,error:e}}},
    async updateUser(body){try{const t=await token();const {data}=await api('/auth/v1/user',{method:'PUT',headers:{Authorization:'Bearer '+t},body:JSON.stringify(body)});return{data:{user:data},error:null}}catch(e){return{data:null,error:e}}},
    onAuthStateChange(fn){listeners.push(fn);return{data:{subscription:{unsubscribe(){listeners=listeners.filter(x=>x!==fn)}}}}}
  };
  function from(table){
    let method='GET',body=null,filters=[],ord='',wantSelect=false,wantSingle=false;
    const q={
      select(){wantSelect=true;return q},
      eq(k,v){filters.push([k,'eq',v]);return q},
      order(k,opt={}){ord=k+'.'+(opt.ascending===false?'desc':'asc');return q},
      upsert(v){method='POST';body=v;wantSelect=true;return q},
      update(v){method='PATCH';body=v;return q},
      delete(){method='DELETE';return q},
      single(){wantSingle=true;return q},
      then(resolve,reject){
        (async()=>{try{
          const qs=new URLSearchParams();filters.forEach(([k,op,v])=>qs.append(k,op+'.'+v));if(ord)qs.set('order',ord);if(method==='GET'||wantSelect)qs.set('select','*');
          const t=await token(),headers={Authorization:'Bearer '+t};
          if(method==='POST')headers.Prefer='resolution=merge-duplicates,return=representation';
          else if(method==='PATCH'||method==='DELETE')headers.Prefer='return=representation';
          const r=await api('/rest/v1/'+table+(qs.toString()?'?'+qs.toString():''),{method,headers,body:body==null?undefined:JSON.stringify(body)});
          let data=r.data;if(wantSingle&&Array.isArray(data))data=data[0]||null;return{data,error:null};
        }catch(e){return{data:null,error:e}}})().then(resolve,reject)
      }
    };return q;
  }
  return{auth,from,channel(){return{on(){return this},subscribe(){return this}}},removeChannel(){return Promise.resolve()}};
}
window.supabase={createClient};
})();