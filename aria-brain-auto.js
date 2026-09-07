(function(){
  if(window.__ARIA_BRAIN_AUTO)return;window.__ARIA_BRAIN_AUTO=true;
  const run=()=>{
    const b=document.getElementById('ariaBrainApply');
    if(!b||b.style.display==='none'||b.disabled||b.dataset.autoRunning==='1')return;
    b.dataset.autoRunning='1';
    const old=window.confirm;
    try{
      window.confirm=()=>true;
      b.click();
    }catch(e){
      console.error('ARIA auto apply failed',e);
    }finally{
      window.confirm=old;
      setTimeout(()=>{delete b.dataset.autoRunning},300);
    }
  };
  new MutationObserver(run).observe(document.documentElement,{subtree:true,childList:true,attributes:true,attributeFilter:['style']});
  setInterval(run,500);
})();