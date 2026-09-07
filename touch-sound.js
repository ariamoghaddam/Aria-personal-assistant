(function(){
  if(window.__ARIA_TOUCH_SOUND_V1)return;window.__ARIA_TOUCH_SOUND_V1=true;
  const KEY='ARIA_TOUCH_SOUND_ENABLED_V1';
  let ctx=null;
  function enabled(){const v=localStorage.getItem(KEY);return v===null?true:v==='1'}
  function setEnabled(v){localStorage.setItem(KEY,v?'1':'0')}
  function ensure(){if(!ctx){const C=window.AudioContext||window.webkitAudioContext;if(!C)return null;ctx=new C()}if(ctx.state==='suspended')ctx.resume?.();return ctx}
  function tap(){if(!enabled())return;const c=ensure();if(!c)return;try{const now=c.currentTime;const o=c.createOscillator(),g=c.createGain(),f=c.createBiquadFilter();o.type='sine';o.frequency.setValueAtTime(1180,now);o.frequency.exponentialRampToValueAtTime(760,now+0.022);g.gain.setValueAtTime(0.0001,now);g.gain.exponentialRampToValueAtTime(0.045,now+0.004);g.gain.exponentialRampToValueAtTime(0.0001,now+0.035);f.type='highpass';f.frequency.value=420;o.connect(f);f.connect(g);g.connect(c.destination);o.start(now);o.stop(now+0.04)}catch(_){}}
  function soft(){if(!enabled())return;const c=ensure();if(!c)return;try{const now=c.currentTime;const o=c.createOscillator(),g=c.createGain();o.type='triangle';o.frequency.setValueAtTime(640,now);o.frequency.exponentialRampToValueAtTime(520,now+0.045);g.gain.setValueAtTime(0.0001,now);g.gain.exponentialRampToValueAtTime(0.028,now+0.006);g.gain.exponentialRampToValueAtTime(0.0001,now+0.055);o.connect(g);g.connect(c.destination);o.start(now);o.stop(now+0.06)}catch(_){}}
  document.addEventListener('pointerdown',e=>{const el=e.target.closest?.('button,.btn,[role="button"],.project,.task .check,.jday,.dockItem');if(!el)return;if(el.disabled)return;tap()},{passive:true});
  document.addEventListener('change',e=>{if(e.target.matches?.('select,input[type="checkbox"],input[type="radio"],input[type="color"]'))soft()},{passive:true});
  window.ARIA_TOUCH_SOUND={tap,soft,enabled,setEnabled};
})();