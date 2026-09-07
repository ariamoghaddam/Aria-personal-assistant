window.ARIA_CLOUD = {
  supabaseUrl: "https://kbwyysfkvprvetninabb.supabase.co",
  supabaseAnonKey: "sb_publishable_fQ5frelO2cr7bFCjoFXvng_0SmCwsG4",
  pushPublicKey: "",
  apiBase: "/api",
  cloudEnabled: true
};

// Load the latest Persian AI input layer after the main app starts.
// v20 intentionally sends no custom browser headers to avoid WebKit ByteString errors.
window.addEventListener('load',()=>setTimeout(()=>{
  document.querySelectorAll('script[data-aria-ai-input]').forEach(x=>x.remove());
  const s=document.createElement('script');
  s.src='./ai-input.js?v=20';
  s.defer=true;
  s.dataset.ariaAiInput='1';
  document.head.appendChild(s);
},350));
