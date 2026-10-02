// Base: iconos SVG, utilidades, estado global, carga de datos y enrutado.

// ---------- iconos SVG ----------
const IC = {
 dashboard:'<path d="M4 13h6V4H4v9Zm0 7h6v-4H4v4Zm10 0h6v-9h-6v9Zm0-16v4h6V4h-6Z"/>',
 notice:'<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8l-5-5Z"/><path d="M14 3v5h5M9 13h6M9 17h6"/>',
 resource:'<path d="M12 3 3 8l9 5 9-5-9-5Z"/><path d="M3 13l9 5 9-5M3 16l9 5 9-5"/>',
 folder:'<path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Z"/>',
 building:'<path d="M4 21V5a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v16M14 21V9h4a2 2 0 0 1 2 2v10M3 21h18M7 7h2M7 11h2M7 15h2"/>',
 subscription:'<circle cx="7.5" cy="15.5" r="3.5"/><path d="m10 13 7-7M14 5l3 3 3-3-2-2M15 9l2 2"/>',
 check:'<circle cx="12" cy="12" r="9"/><path d="m8.5 12 2.5 2.5 4.5-5"/>',
 clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.5 2"/>',
 add:'<path d="M12 5v14M5 12h14"/>',
 search:'<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
 filter:'<path d="M3 5h18l-7 8v6l-4-2v-4L3 5Z"/>',
 export:'<path d="M12 3v12m0 0 4-4m-4 4-4-4M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2"/>',
 warning:'<path d="M12 3 2 20h20L12 3Z"/><path d="M12 10v5M12 18h.01"/>',
 close:'<path d="M6 6l12 12M18 6 6 18"/>',
 eye:'<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/>',
 eyeoff:'<path d="M3 3l18 18M10.6 10.6a3 3 0 0 0 4.24 4.24M9.9 4.66A10.4 10.4 0 0 1 12 4.5c6.5 0 10 7 10 7a17.8 17.8 0 0 1-3.06 3.94M6.1 6.12A17.8 17.8 0 0 0 2 11.5s3.5 7 10 7a10.4 10.4 0 0 0 3.06-.44"/>',
 chev:'<path d="m9 6 6 6-6 6"/>',
 panel:'<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M9 4v16"/>',
 edit:'<path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/>',
 trash:'<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/>',
 sat:'<path d="m6 10 4 4M9.5 6.5l8 8M4 12l-1.5 1.5a2.1 2.1 0 0 0 0 3l2 2a2.1 2.1 0 0 0 3 0L9 17M14 8l2-2M18 12a4 4 0 0 0-4-4M21 12a7 7 0 0 0-7-7"/>',
 user:'<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
 team:'<circle cx="9" cy="8" r="3.4"/><path d="M3 20a6 6 0 0 1 12 0M16 5a3 3 0 0 1 0 6M17.5 20a5.5 5.5 0 0 0-3-4.9"/>',
 home:'<path d="M3 11 12 4l9 7"/><path d="M5 10v10h5v-6h4v6h5V10"/>',
 moon:'<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z"/>',
 logout:'<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="M16 17l5-5-5-5"/><path d="M21 12H9"/>',
 archive:'<rect x="3" y="4" width="18" height="4" rx="1"/><path d="M5 8v11a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V8"/><path d="M10 12h4"/>',
 unarchive:'<rect x="3" y="4" width="18" height="4" rx="1"/><path d="M5 8v11a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V8"/><path d="M12 18v-6m0 0-2.4 2.4M12 12l2.4 2.4"/>',
};
function svg(name,cls='icon'){
  return `<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${IC[name]||''}</svg>`;
}
document.querySelectorAll('[data-ic]').forEach(e=>e.innerHTML=svg(e.dataset.ic));

// Sidebar colapsable (solo iconos). Estado recordado en localStorage.
(function initCollapse(){
  const app=document.querySelector('.app'),KEY='sbCollapsed';
  if(localStorage.getItem(KEY)==='1')app.classList.add('collapsed');
  const btn=document.getElementById('btnCollapse');
  if(btn)btn.addEventListener('click',()=>{
    const c=app.classList.toggle('collapsed');
    localStorage.setItem(KEY,c?'1':'0');
    btn.setAttribute('title',c?'Expandir menú':'Contraer menú');
  });
})();

// ---------- utilidades ----------
const $=s=>document.querySelector(s);
const esc=s=>(s??'').toString().replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const api=async(url,opt)=>{const r=await fetch(url,opt&&{headers:{'Content-Type':'application/json'},...opt});if(!r.ok)throw new Error((await r.json()).error||r.status);return r.json();};
function toast(msg){const t=$('#toast');t.textContent=msg;t.classList.add('show');clearTimeout(t._t);t._t=setTimeout(()=>t.classList.remove('show'),2200);}
function hl(s,q){s=esc(s);if(!q)return s;try{return s.replace(new RegExp('('+q.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+')','ig'),'<mark>$1</mark>');}catch(e){return s;}}
const today=(()=>{const d=new Date();return new Date(d.getTime()-d.getTimezoneOffset()*60000).toISOString().slice(0,10);})();  // fecha local (no UTC)
function fmtInv(ts){                       // "2026-09-03T10:31:00" -> "3 sep 2026"
  if(!ts)return'';
  const d=new Date(ts.replace(' ','T'));
  if(isNaN(d))return esc(ts.slice(0,10));
  return d.toLocaleDateString('es',{day:'numeric',month:'short',year:'numeric'});
}
const MESES=['enero','febrero','marzo','abril','mayo','junio','julio','agosto','setiembre','octubre','noviembre','diciembre'];
function fmtFechaLarga(s){                  // "2025-09-20" -> "20 de setiembre de 2025"
  if(!s)return'';
  const m=String(s).slice(0,10).match(/^(\d{4})-(\d{2})-(\d{2})/);
  if(!m)return esc(String(s));
  const y=+m[1],mo=+m[2],d=+m[3];
  if(mo<1||mo>12)return esc(String(s));
  return `${d} de ${MESES[mo-1]} de ${y}`;
}
function invAgo(ts){                        // texto relativo: "hoy", "hace 3 d"
  if(!ts)return'';
  const days=Math.floor((new Date(today)-new Date(ts.slice(0,10)))/864e5);
  return days<=0?'hoy':days===1?'ayer':`hace ${days} d`;
}
function dueClass(d){if(!d)return'';return d<today?'--danger':(d<=new Date(Date.now()+30*864e5).toISOString().slice(0,10)?'--warn':'--ok');}
function pctClass(p){return p>=90?'kpi--ok':p>=50?'kpi--warn':'kpi--danger';}
const CAT_COLORS={"Compute":"#58a6ff","Almacenamiento":"#d29922","Redes":"#2dd4bf","Bases de datos":"#a78bfa","Datos y Analítica":"#f778ba","Contenedores":"#3fb950","Seguridad e Identidad":"#f85149","Gobernanza y Monitoreo":"#79c0ff","FinOps y Reservas":"#e3b341","Otros":"#8b98a9"};
function catColor(c){return CAT_COLORS[c]||"#8b98a9";}
function catBadge(c){return c?`<span class="cbadge" style="--c:${catColor(c)}">${esc(c)}</span>`:'<span class="caption">—</span>';}

let STATE={view:'mipanel',stats:null,comunicados:[],q:'',cat:'',est:'',verVenc:false,comCli:[],comSub:[],comView:'',comFiltersOpen:false,comFilterTab:'cliente',comFilterQ:'',recSort:{col:null,dir:1},comSort:{col:'fecha_limite',dir:1},comPage:0,comPageSize:25,comScope:null,verArch:false,recFiltersOpen:false,recFilterTab:'cliente',recFilterQ:''};
let COMGRP={keys:[]};                 // claves de los grupos visibles (índice → clave)
const COM_COLLAPSED=new Set();        // grupos colapsados (por clave)

async function loadAll(){
  const [st,co,cl,mi,me]=await Promise.all([api('/api/stats'),api('/api/comunicados'),
    api('/api/clientes').catch(()=>[]),api('/api/miembros').catch(()=>[]),
    api('/api/me').catch(()=>({miembro:null}))]);
  STATE.stats=st;STATE.comunicados=co;CLI.list=cl;MIEM.list=mi;   // caché para el buscador global
  STATE.me=(me&&me.miembro)||null;                               // miembro logueado (o null)
  STATE.nPap=(await api('/api/papelera').catch(()=>[])).length;   // contador del botón Papelera
}

// ---------- enrutado (URLs reales / History API) ----------
function navigate(path){
  if(location.pathname!==path)history.pushState({},'',path);
  route();
}
async function route(){
  const p=location.pathname.replace(/\/+$/,'')||'/';
  let m;
  if(m=p.match(/^\/comunicados\/(\d+)\/recursos$/)){
    setNav('comunicados');
    await loadRecursos(+m[1]);           // carga recursos del comunicado
    if(!RES.com){navigate('/comunicados');return;}
    STATE.view='recursos';render();
  }else if(p==='/comunicados'){
    STATE.comScope=null;                  // vista global de comunicados
    STATE.view='comunicados';setNav('comunicados');render();
  }else if(m=p.match(/^\/clientes\/(\d+)\/comunicados$/)){
    setNav('clientes');
    const cli=(CLI.list||[]).find(c=>c.id===+m[1]);   // misma tabla de comunicados, acotada al cliente
    STATE.comScope={id:+m[1],nombre:cli?cli.nombre:'Cliente'};
    if(STATE.comView==='cliente')STATE.comView='';   // no tiene sentido "Por cliente" dentro de un cliente
    STATE.comPage=0;STATE.view='comunicados';render();
  }else if(p==='/clientes'){
    STATE.view='clientes';setNav('clientes');render();
  }else if(p==='/miembros'){
    STATE.view='miembros';setNav('miembros');render();
  }else if(p==='/mipanel'){
    STATE.view='mipanel';setNav('mipanel');render();
  }else if(p==='/perfil'){
    STATE.view='perfil';setNav('perfil');render();
  }else{
    STATE.view='mipanel';setNav('mipanel');render();   // '/' es Inicio
  }
}
window.addEventListener('popstate',route);

document.querySelectorAll('.nav-item[data-view]').forEach(b=>b.onclick=()=>{
  navigate(b.dataset.view==='mipanel'?'/':'/'+b.dataset.view);   // Inicio vive en '/'
});
