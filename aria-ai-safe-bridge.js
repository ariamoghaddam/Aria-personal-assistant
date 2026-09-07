(function(){
  if(window.__ARIA_AI_SAFE_BRIDGE_V1)return;window.__ARIA_AI_SAFE_BRIDGE_V1=true;
  const nativeFetch=window.fetch.bind(window);
  const keys={
    focus:'ARIA_FOCUS_HISTORY_V1',
    distractions:'ARIA_FOCUS_DISTRACTIONS_V1',
    musicSessions:'ARIA_MUSIC_SESSIONS_V1',
    musicBpm:'ARIA_MUSIC_BPM_V1',
    musicSongs:'ARIA_MUSIC_SONGS_V1',
    musicSetlists:'ARIA_MUSIC_SETLISTS_V1',
    musicGoals:'ARIA_MUSIC_GOALS_V1',
    musicPlan:'ARIA_MUSIC_PLAN_V1',
    priceBook:'ARIA_PROJECT_PRICE_BOOK_V1',
    productivity:'ARIA_PRODUCTIVITY_V1',
    metronomePrograms:'ARIA_METRONOME_PROGRAMS_V1'
  };
  const read=(k)=>{try{return JSON.parse(localStorage.getItem(k)||'null')}catch{return null}};
  function extraContext(){const out={};for(const [name,key] of Object.entries(keys)){const v=read(key);if(v!=null)out[name]=v}return out}
  function parseActionsFromText(text){
    if(!text||typeof text!=='string')return{text:text||'',actions:[]};
    const candidates=[];
    const fenced=[...text.matchAll(/```json\s*([\s\S]*?)```/gi)].map(m=>m[1]);candidates.push(...fenced);
    const loose=text.match(/\{[\s\S]*"actions"[\s\S]*\}\s*$/);if(loose)candidates.push(loose[0]);
    for(const c of candidates){try{const j=JSON.parse(c);if(Array.isArray(j.actions)){let clean=text.replace(/```json\s*[\s\S]*?```/gi,'').trim();if(clean===text.trim()&&loose)clean=text.slice(0,loose.index).trim();return{text:clean||'پیشنهاد آماده است.',actions:j.actions}}}catch{}}
    return{text,actions:[]};
  }
  window.fetch=async function(input,init){
    try{
      const url=typeof input==='string'?input:(input&&input.url)||'';
      if(url.includes('/api/aria-ai')&&url.includes('mode=assistant')&&init&&typeof init.body==='string'){
        const body=JSON.parse(init.body);body.context=body.context||{};body.context.extensions=extraContext();
        const res=await nativeFetch(input,{...init,body:JSON.stringify(body)});
        const clone=res.clone();const data=await clone.json().catch(()=>null);
        if(data&&typeof data==='object'&&!Array.isArray(data)){
          if(!Array.isArray(data.actions)&&typeof data.text==='string'){
            const p=parseActionsFromText(data.text);data.text=p.text;data.actions=p.actions;
          }
          return new Response(JSON.stringify(data),{status:res.status,statusText:res.statusText,headers:res.headers});
        }
        return res;
      }
    }catch(e){console.warn('ARIA AI safe bridge',e)}
    return nativeFetch(input,init);
  };
})();