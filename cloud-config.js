window.ARIA_CLOUD = {
  supabaseUrl: "https://kbwyysfkvprvetninabb.supabase.co",
  supabaseAnonKey: "sb_publishable_fQ5frelO2cr7bFCjoFXvng_0SmCwsG4",
  pushPublicKey: "",
  apiBase: "/api",
  cloudEnabled: true
};

// Load the Persian AI input layer after the main app starts.
window.addEventListener('load',()=>setTimeout(()=>{
  if(document.querySelector('script[data-aria-ai-input]')) return;
  const s=document.createElement('script');
  s.src='./ai-input.js?v=17';
  s.defer=true;
  s.dataset.ariaAiInput='1';
  document.head.appendChild(s);
},350));
