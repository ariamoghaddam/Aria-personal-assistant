export default async function handler(req,res){
  try{
    const base='https://kbwyysfkvprvetninabb.supabase.co/functions/v1/aria-notify';
    const qs=new URLSearchParams(req.query||{}).toString();
    const url=qs?`${base}?${qs}`:base;
    const headers={'Content-Type':'application/json'};
    const auth=req.headers.authorization;
    if(auth)headers.Authorization=auth;
    const init={method:req.method||'GET',headers};
    if(req.method!=='GET'&&req.method!=='HEAD')init.body=typeof req.body==='string'?req.body:JSON.stringify(req.body||{});
    const r=await fetch(url,init);
    const text=await r.text();
    res.status(r.status);
    res.setHeader('Cache-Control','no-store');
    res.setHeader('Content-Type',r.headers.get('content-type')||'application/json; charset=utf-8');
    return res.send(text);
  }catch(e){
    return res.status(502).json({error:'notify_proxy_failed',detail:String(e?.message||e)});
  }
}
