export const config = { api: { bodyParser: false } };

function readRaw(req){
  return new Promise((resolve,reject)=>{
    const chunks=[];
    req.on('data',c=>chunks.push(c));
    req.on('end',()=>resolve(Buffer.concat(chunks)));
    req.on('error',reject);
  });
}

export default async function handler(req,res){
  if(req.method!=='POST') return res.status(405).json({error:'method_not_allowed'});
  try{
    const token=(req.query?.t||'').toString().trim();
    if(!token) return res.status(401).json({error:'unauthorized'});
    const mode=(req.query?.mode||'transcribe').toString();
    const body=await readRaw(req);
    const ct=(req.headers['content-type']||'application/octet-stream').toString();
    const r=await fetch(`https://kbwyysfkvprvetninabb.supabase.co/functions/v1/aria-ai?mode=${encodeURIComponent(mode)}`,{
      method:'POST',
      headers:{Authorization:`Bearer ${token}`,'Content-Type':ct},
      body
    });
    const text=await r.text();
    res.status(r.status);
    res.setHeader('Content-Type',r.headers.get('content-type')||'application/json; charset=utf-8');
    res.setHeader('Cache-Control','no-store');
    res.send(text);
  }catch(e){
    res.status(500).json({error:'proxy_failed',detail:e?.message||String(e)});
  }
}
