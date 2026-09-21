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
const today=new Date().toISOString().slice(0,10);
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

let STATE={view:'mipanel',stats:null,comunicados:[],q:'',cat:'',est:'faltan',verVenc:false,comCli:[],comSub:[],comView:'',comFiltersOpen:false,comFilterTab:'cliente',comFilterQ:'',recSort:{col:null,dir:1},comSort:{col:'fecha_limite',dir:1},comPage:0,comPageSize:25,comScope:null,verArch:false,recFiltersOpen:false,recFilterTab:'cliente',recFilterQ:''};
let COMGRP={keys:[]};                 // claves de los grupos visibles (índice → clave)
const COM_COLLAPSED=new Set();        // grupos colapsados (por clave)

async function loadAll(){
  const [st,co,cl,mi,me]=await Promise.all([api('/api/stats'),api('/api/comunicados'),
    api('/api/clientes').catch(()=>[]),api('/api/miembros').catch(()=>[]),
    api('/api/me').catch(()=>({miembro:null}))]);
  STATE.stats=st;STATE.comunicados=co;CLI.list=cl;MIEM.list=mi;   // caché para el buscador global
  STATE.me=(me&&me.miembro)||null;                               // miembro logueado (o null)
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
// ---------- buscador global estilo Azure (objetos: cliente, encargado, comunicado…) ----------
const GS={items:[],active:-1,open:false};
function gsSources(q){
  const ql=q.toLowerCase(),out=[];
  // Comunicados (por título, resumen o categoría)
  STATE.comunicados.forEach(c=>{
    if([c.titulo,c.resumen,c.categoria].filter(Boolean).join(' ').toLowerCase().includes(ql))
      out.push({type:'Comunicado',icon:'notice',name:c.titulo||'(sin título)',
        sub:[c.categoria,c.fecha_limite?'vence '+c.fecha_limite:''].filter(Boolean).join(' · '),
        run:()=>openRecursos(c.id)});
  });
  // Clientes y sus suscripciones
  (CLI.list||[]).forEach(c=>{
    if((c.nombre||'').toLowerCase().includes(ql)||(c.ext_id||'').toLowerCase().includes(ql))
      out.push({type:'Cliente',icon:'building',name:c.nombre,
        sub:(c.suscripciones?.length||0)+' suscripción(es)'+(c.ext_id?' · '+c.ext_id:''),
        run:()=>gotoCli(c.nombre)});
    (c.suscripciones||[]).forEach(s=>{
      if((s.nombre||'').toLowerCase().includes(ql)||(s.sub_id||'').toLowerCase().includes(ql))
        out.push({type:'Suscripción',icon:'subscription',name:s.nombre||s.sub_id||'(sin nombre)',
          sub:'Cliente: '+c.nombre,run:()=>gotoCli(s.nombre||s.sub_id||c.nombre)});
    });
  });
  // Miembros de la plataforma
  (MIEM.list||[]).forEach(m=>{
    const full=[m.nombre,m.apellido].filter(Boolean).join(' ');
    if([m.correo,m.nombre,m.apellido].filter(Boolean).join(' ').toLowerCase().includes(ql))
      out.push({type:'Miembro',icon:'user',name:full||m.correo,
        sub:full?m.correo:'',run:()=>gotoMiembros(m.correo)});
  });
  // Encargados (responsables distintos de los comunicados)
  const enc={};
  STATE.comunicados.forEach(c=>{const r=(c.responsable||'').trim();if(r)enc[r]=(enc[r]||0)+1;});
  Object.keys(enc).filter(r=>r.toLowerCase().includes(ql)).forEach(r=>{
    out.push({type:'Encargado',icon:'building',name:r,sub:enc[r]+' comunicado'+(enc[r]===1?'':'s'),
      run:()=>gotoComQ(r)});
  });
  // Categorías
  [...new Set(STATE.comunicados.map(c=>c.categoria).filter(Boolean))]
    .filter(cat=>cat.toLowerCase().includes(ql))
    .forEach(cat=>out.push({type:'Categoría',icon:'filter',name:cat,sub:'Filtrar comunicados',
      run:()=>{STATE.cat=cat;STATE.q='';STATE.est='';STATE.verVenc=true;navigate('/comunicados');}}));
  return out;
}
function gotoCli(term){CLI.pendingQ=term||'';navigate('/clientes');}
// Desde "Clientes afectados" en Inicio: ir directo a los comunicados del cliente.
function gotoCliComs(nombre){const id=clienteIdPorNombre(nombre);if(id)navigate('/clientes/'+id+'/comunicados');else gotoCli(nombre);}
function gotoComQ(term){STATE.q=term||'';STATE.cat='';STATE.est='';STATE.verVenc=true;navigate('/comunicados');}
function gsRender(raw){
  const box=$('#gsResults'),q=(raw||'').trim();
  if(!box)return;
  if(!q){gsClose();return;}
  const order=['Comunicado','Cliente','Suscripción','Miembro','Encargado','Categoría'],perType=6;
  const grouped={};gsSources(q).forEach(it=>(grouped[it.type]=grouped[it.type]||[]).push(it));
  GS.items=[];let html='';
  order.forEach(t=>{
    const arr=(grouped[t]||[]).slice(0,perType);if(!arr.length)return;
    const extra=grouped[t].length>perType?` · ${perType} de ${grouped[t].length}`:'';
    html+=`<div class="gs-group">${t}${extra}</div>`;
    arr.forEach(it=>{
      const idx=GS.items.length;GS.items.push(it);
      html+=`<div class="gs-item" data-i="${idx}" onclick="gsPick(${idx})" onmousemove="gsHover(${idx})">
        ${svg(it.icon,'icon')}
        <div class="gs-main"><div class="gs-name">${hl(it.name,q)}</div>${it.sub?`<div class="gs-sub">${esc(it.sub)}</div>`:''}</div>
        <span class="gs-badge">${t}</span></div>`;
    });
  });
  box.innerHTML=html||`<div class="gs-empty">Sin coincidencias para “${esc(q)}”.</div>`;
  box.hidden=false;GS.open=true;GS.active=-1;
  $('#globalSearch').setAttribute('aria-expanded','true');
}
function gsHover(i){GS.active=i;gsSyncActive();}
function gsSyncActive(){document.querySelectorAll('#gsResults .gs-item').forEach(el=>el.classList.toggle('active',+el.dataset.i===GS.active));}
function gsScroll(){const el=document.querySelector(`#gsResults .gs-item[data-i="${GS.active}"]`);if(el)el.scrollIntoView({block:'nearest'});}
function gsPick(i){const it=GS.items[i];if(!it)return;gsClose();$('#globalSearch').value='';it.run();}
function gsClose(){const box=$('#gsResults');if(box){box.hidden=true;box.innerHTML='';}GS.open=false;GS.active=-1;const g=$('#globalSearch');if(g)g.setAttribute('aria-expanded','false');}
$('#globalSearch').addEventListener('input',e=>gsRender(e.target.value));
$('#globalSearch').addEventListener('focus',e=>{if(e.target.value.trim())gsRender(e.target.value);});
$('#globalSearch').addEventListener('keydown',e=>{
  if(!GS.open||!GS.items.length){if(e.key==='Escape')gsClose();return;}
  if(e.key==='ArrowDown'){e.preventDefault();GS.active=Math.min(GS.active+1,GS.items.length-1);gsSyncActive();gsScroll();}
  else if(e.key==='ArrowUp'){e.preventDefault();GS.active=Math.max(GS.active-1,0);gsSyncActive();gsScroll();}
  else if(e.key==='Enter'){e.preventDefault();gsPick(GS.active>=0?GS.active:0);}
  else if(e.key==='Escape'){gsClose();e.target.blur();}
});
document.addEventListener('click',e=>{if(!e.target.closest('#gsearch'))gsClose();});
// cerrar el popover de filtro al hacer clic fuera (sin re-render completo)
document.addEventListener('click',e=>{
  if(!STATE.comFiltersOpen||e.target.closest('#comFilter'))return;
  STATE.comFiltersOpen=false;
  const p=$('#comFilterPop');if(p)p.hidden=true;
  const b=$('#btnFiltrar');if(b){b.setAttribute('aria-expanded','false');b.classList.toggle('primary',!!(STATE.comCli.length+STATE.comSub.length));}
});
// mismo comportamiento para el popover de filtro de recursos
document.addEventListener('click',e=>{
  if(!STATE.recFiltersOpen||e.target.closest('#recFilter'))return;
  STATE.recFiltersOpen=false;
  const p=$('#recFilterPop');if(p)p.hidden=true;
  const b=$('#btnRecFiltrar');if(b){b.setAttribute('aria-expanded','false');b.classList.toggle('primary',!!(STATE.recCli.length+STATE.recSub.length));}
});

function render(){
  if(STATE.view==='recursos'&&RES.com)renderRecursos();
  else if(STATE.view==='clientes')renderClientes();
  else if(STATE.view==='miembros')renderMiembros();
  else if(STATE.view==='mipanel')renderMiPanel();
  else if(STATE.view==='perfil')renderPerfil();
  else renderComunicados();
}

// ---------- DASHBOARD ----------
function donut(segs,size=170,stroke=22){
  const r=(size-stroke)/2,C=2*Math.PI*r,cx=size/2,cy=size/2;
  const total=segs.reduce((a,s)=>a+s.value,0)||1;let acc=0;
  const arcs=segs.filter(s=>s.value>0).map(s=>{const f=s.value/total,dash=f*C,rot=acc*360-90;acc+=f;
    return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${s.color}" stroke-width="${stroke}" stroke-dasharray="${dash.toFixed(2)} ${(C-dash).toFixed(2)}" transform="rotate(${rot} ${cx} ${cy})"/>`;}).join('');
  const pct=Math.round((segs[0].value/total)*100);
  return `<svg viewBox="0 0 ${size} ${size}" width="${size}" height="${size}" role="img" aria-label="Revisado ${pct}%">
    <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="var(--surface-2)" stroke-width="${stroke}"/>${arcs}
    <text x="${cx}" y="${cy-2}" text-anchor="middle" dominant-baseline="middle" font-family="var(--font-mono)" font-size="30" font-weight="700" fill="var(--text)">${pct}%</text>
    <text x="${cx}" y="${cy+20}" text-anchor="middle" font-size="10" fill="var(--text-muted)" letter-spacing="1">REVISADO</text></svg>`;
}
function bars(items,max,color='var(--accent)'){
  max=max||Math.max(...items.map(i=>i.value),1);
  return items.map(i=>`<div class="bar-row"><span class="bar-label" title="${esc(i.label)}">${esc(i.label)}</span>
    <div class="bar-track"><div class="bar-fill" style="width:${(i.value/max*100).toFixed(1)}%;${i.color?'background:'+i.color:''}"></div></div>
    <span class="bar-val">${i.value.toLocaleString()}</span></div>`).join('');
}
function splitBar(rev,total,max,clickAttr=''){
  const wTot=(total/max*100).toFixed(1);
  const wRev=total?(rev/total*100).toFixed(1):0;
  return `<div class="bar-track" ${clickAttr}><div class="bar-outer" style="width:${wTot}%"><div class="rev" style="width:${wRev}%"></div></div></div>`;
}
function daysLeft(d){return Math.round((new Date(d)-new Date(today))/864e5);}
function goCat(cat){STATE.cat=cat;STATE.est='';STATE.verVenc=false;STATE.q='';navigate('/comunicados');}
function goRec(mode){
  STATE.cat='';STATE.q='';
  if(mode==='venc'){STATE.verVenc=true;STATE.est='';}   // ver vencidos
  else{STATE.est='faltan';STATE.verVenc=false;}          // pendientes / los que faltan
  navigate('/comunicados');
}
function setNav(view){document.querySelectorAll('.nav-item').forEach(x=>x.classList.toggle('active',x.dataset.view===view));}

// ---------- MI PANEL (login por miembro · ve SUS comunicados) ----------
function setInicioView(v){ STATE.inicioView=v; renderMiPanel(); }
function renderMiPanel(){
  if(!STATE.me){ showLoginGate(); return; }
  const v=STATE.inicioView==='equipo'?'equipo':'personal';
  const nombre=(STATE.me&&(STATE.me.nombre||STATE.me.correo))||'';
  $('#content').innerHTML=`
    <div class="mipanel-top">
      <div><h1 class="page" style="margin-bottom:2px">Hola, ${esc(nombre)}</h1></div>
      <div class="segbar" role="group" aria-label="Vista del inicio" style="margin:0">
        <button class="seg ${v==='personal'?'active':''}" onclick="setInicioView('personal')">${svg('user')}Personal</button>
        <button class="seg ${v==='equipo'?'active':''}" onclick="setInicioView('equipo')">${svg('team')}Equipo</button>
      </div>
    </div>
    <div id="inicioBody"><div class="empty-state" style="padding:var(--sp-5)">Cargando…</div></div>`;
  api(v==='equipo'?'/api/stats':'/api/mi-stats').then(s=>renderInicioDash(s,v)).catch(e=>{
    if(/401|autenticad/i.test(e.message)){STATE.me=null;showLoginGate();return;}
    const b=$('#inicioBody'); if(b)b.innerHTML=`<div class="empty-state">Error: ${esc(e.message)}</div>`;
  });
}
function renderLogin(container,onSuccess){
  container.innerHTML=`
    <div class="login-card">
      <img class="login-logo" src="/logo.png" alt="G&amp;S · Gestión y Sistemas">
      <div class="login-head"><b>Inicia sesión</b></div>
      <div class="login-sub">Revisión de comunicados</div>
      <form id="loginForm" autocomplete="on">
        <label class="field"><span>Correo</span><input type="email" id="loginCorreo" required placeholder="nombre.apellido@gestionysistemas.com" autocomplete="username"></label>
        <label class="field"><span>Contraseña</span><input type="password" id="loginPwd" required placeholder="••••••••" autocomplete="current-password"></label>
        <div class="login-err" id="loginErr" hidden></div>
        <button class="btn primary" type="submit" style="width:100%;justify-content:center">Entrar</button>
      </form>
    </div>`;
  const f=$('#loginForm');
  f.addEventListener('submit',async e=>{
    e.preventDefault();
    const correo=$('#loginCorreo').value.trim(), password=$('#loginPwd').value;
    const err=$('#loginErr'); err.hidden=true;
    try{
      const r=await api('/api/login',{method:'POST',body:JSON.stringify({correo,password})});
      STATE.me=r.miembro; toast(`Hola, ${r.miembro.nombre||r.miembro.correo}`);
      if(onSuccess) onSuccess(); else renderMiPanel();
    }catch(ex){ err.textContent=ex.message||'No se pudo iniciar sesión'; err.hidden=false; }
  });
  setTimeout(()=>$('#loginCorreo')&&$('#loginCorreo').focus(),40);
}
// Bloquea la plataforma en una pantalla de login propia, aparte del resto de la app.
function showLoginGate(){
  document.body.classList.add('locked');
  let scr=$('#loginScreen');
  if(!scr){ scr=document.createElement('div'); scr.id='loginScreen'; document.body.appendChild(scr); }
  renderLogin(scr,hideLoginGate);
}
function hideLoginGate(){
  document.body.classList.remove('locked');
  const scr=$('#loginScreen'); if(scr) scr.remove();
  boot();
}
async function doLogout(){
  try{ await api('/api/logout',{method:'POST',body:'{}'}); }catch(e){}
  STATE.me=null; toast('Sesión cerrada'); showLoginGate();
}
// ---------- MI PERFIL (datos del usuario + tema oscuro) ----------
function inicialDe(me){ return ((me&&(me.nombre||me.correo)||'?').trim()[0]||'?').toUpperCase(); }
function updateNavProfile(){
  const el=$('#navProfile'); if(!el) return;
  el.textContent=inicialDe(STATE.me);
}
// ---------- menú de perfil en el navbar (tema oscuro + cerrar sesión) ----------
function userMenuHTML(){
  const me=STATE.me||{};
  const nombre=`${me.nombre||''} ${me.apellido||''}`.trim()||me.correo||'Usuario';
  return `<div class="nav-menu-head">
      <div class="nav-menu-name">${esc(nombre)}</div>
      <div class="nav-menu-mail">${esc(me.correo||'')}</div></div>
    <button class="nav-menu-item" onclick="closeUserMenu();navigate('/perfil')">${svg('user')}Mi perfil</button>
    <div class="nav-menu-item as-row">
      <span class="nmi-lbl">${svg('moon')}Tema oscuro</span>
      <label class="switch"><input type="checkbox" id="menuTheme" ${isDark()?'checked':''}>
        <span class="track"></span><span class="thumb"></span></label>
    </div>
    <button class="nav-menu-item danger" onclick="doLogout()">${svg('logout')}Cerrar sesión</button>`;
}
function toggleUserMenu(e){
  if(e)e.stopPropagation();
  const menu=$('#navMenu'); if(!menu) return;
  if(menu.hasAttribute('hidden')){
    menu.innerHTML=userMenuHTML();
    menu.removeAttribute('hidden');
    $('#navProfile').setAttribute('aria-expanded','true');
    $('#menuTheme').addEventListener('change',ev=>{
      setDark(ev.target.checked); syncThemeControls();
      toast(ev.target.checked?'Tema oscuro activado':'Tema claro activado');
    });
  }else closeUserMenu();
}
function closeUserMenu(){
  const menu=$('#navMenu'); if(menu){menu.setAttribute('hidden','');menu.innerHTML='';}
  const btn=$('#navProfile'); if(btn)btn.setAttribute('aria-expanded','false');
}
function syncThemeControls(){
  [$('#themeToggle'),$('#menuTheme')].forEach(el=>{if(el)el.checked=isDark();});
}
document.addEventListener('click',e=>{ if(!e.target.closest('#navUser'))closeUserMenu(); });
function isDark(){ return document.documentElement.classList.contains('dark'); }
function setDark(on){
  document.documentElement.classList.toggle('dark',on);
  try{ localStorage.setItem('theme',on?'dark':'light'); }catch(e){}
}
function renderPerfil(){
  const me=STATE.me||{};
  const nombre=`${me.nombre||''} ${me.apellido||''}`.trim()||me.correo||'Usuario';
  const ini=inicialDe(me);
  $('#content').innerHTML=`<h1 class="page">Mi perfil</h1>
    <div class="profile-grid">
      <div class="profile-card">
        <div class="profile-id">
          <div class="profile-avatar">${esc(ini)}</div>
          <div><div class="profile-name">${esc(nombre)}</div>
            <div class="profile-mail">${esc(me.correo||'')}</div></div>
        </div>
        <div class="profile-pwd" style="border-bottom:1px solid var(--line)">
          <div class="lbl" style="margin-bottom:var(--sp-3)">Editar mis datos</div>
          <form id="nameForm" autocomplete="off">
            <div class="field-pair">
              <label class="field"><span>Nombre</span><input id="pfNombre" value="${esc(me.nombre||'')}"></label>
              <label class="field"><span>Apellido</span><input id="pfApellido" value="${esc(me.apellido||'')}"></label>
            </div>
            <div class="login-err" id="nameErr" hidden style="margin-top:var(--sp-3)"></div>
            <button class="btn primary" type="submit" style="margin-top:var(--sp-3)">${svg('check')}Guardar datos</button>
          </form>
        </div>
        <div class="profile-row">
          <div><div class="lbl">${svg('moon')} Tema oscuro</div>
            <div class="sub">Reduce el brillo de la interfaz. Se recuerda en este navegador.</div></div>
          <label class="switch"><input type="checkbox" id="themeToggle" ${isDark()?'checked':''}>
            <span class="track"></span><span class="thumb"></span></label>
        </div>
        <div class="profile-row">
          <div><div class="lbl">Sesión</div>
            <div class="sub">Cierra tu sesión en este equipo.</div></div>
          <button class="btn" onclick="doLogout()">${svg('close')}Cerrar sesión</button>
        </div>
      </div>
      <div class="profile-card">
        <div class="profile-pwd">
          <div class="lbl" style="margin-bottom:var(--sp-1)">Cambiar contraseña</div>
          <div class="sub" style="margin-bottom:var(--sp-3)">Necesitas tu contraseña actual para confirmar el cambio.</div>
          <form id="pwdForm" autocomplete="off">
            <label class="field"><span>Contraseña actual</span><input type="password" id="pwActual" required autocomplete="current-password"></label>
            <label class="field"><span>Nueva contraseña</span><input type="password" id="pwNueva" required minlength="4" autocomplete="new-password"></label>
            <label class="field"><span>Confirmar nueva contraseña</span><input type="password" id="pwConf" required autocomplete="new-password"></label>
            <div class="login-err" id="pwErr" hidden></div>
            <button class="btn primary" type="submit" style="align-self:flex-start">${svg('check')}Actualizar contraseña</button>
          </form>
        </div>
      </div>
    </div>`;
  $('#nameForm').addEventListener('submit',async e=>{
    e.preventDefault();
    const nombre=$('#pfNombre').value.trim(), apellido=$('#pfApellido').value.trim();
    const err=$('#nameErr'); err.hidden=true;
    try{
      const r=await api('/api/mi-perfil',{method:'POST',body:JSON.stringify({nombre,apellido})});
      STATE.me=r.miembro; updateNavProfile(); toast('Datos actualizados.'); renderPerfil();
    }catch(ex){ err.textContent=ex.message||'No se pudo guardar'; err.hidden=false; }
  });
  $('#themeToggle').addEventListener('change',e=>{
    setDark(e.target.checked); syncThemeControls();
    toast(e.target.checked?'Tema oscuro activado':'Tema claro activado');
  });
  $('#pwdForm').addEventListener('submit',async e=>{
    e.preventDefault();
    const actual=$('#pwActual').value, nueva=$('#pwNueva').value, conf=$('#pwConf').value;
    const err=$('#pwErr'); err.hidden=true;
    if(nueva.length<4){ err.textContent='La nueva contraseña debe tener al menos 4 caracteres.'; err.hidden=false; return; }
    if(nueva!==conf){ err.textContent='La nueva contraseña y su confirmación no coinciden.'; err.hidden=false; return; }
    try{
      await api('/api/cambiar-password',{method:'POST',body:JSON.stringify({actual,nueva})});
      e.target.reset(); toast('Contraseña actualizada.');
    }catch(ex){ err.textContent=ex.message||'No se pudo cambiar la contraseña'; err.hidden=false; }
  });
}
function renderInicioDash(s,mode){
  const body=$('#inicioBody'); if(!body) return;
  const team=mode==='equipo';
  const t=s.totales;
  const ce=s.com_estado||{sin_recursos:0,sin_revisar:0,en_progreso:0,completado:0};
  const totCom=t.comunicados||0, comDone=ce.completado||0, comPend=totCom-comDone;
  const pctCom=totCom?Math.round(comDone/totCom*100):0;
  // Comunicados por categoría (enfoque comunicados, no recursos)
  const cats=(s.por_categoria||[]).filter(c=>c.comunicados>0).slice().sort((a,b)=>b.comunicados-a.comunicados);
  const maxCat=Math.max(...cats.map(c=>c.comunicados),1);
  const catBars=cats.map(c=>`<div class="bar-row clickable" onclick="goCat('${esc(c.categoria).replace(/'/g,"\\'")}')" title="Ver comunicados · ${esc(c.categoria)}">
      <span class="bar-label" title="${esc(c.categoria)}">${esc(c.categoria)}</span>
      <div class="bar-track"><div class="bar-outer" style="width:${(c.comunicados/maxCat*100).toFixed(1)}%;background:${catColor(c.categoria)}"></div></div>
      <span class="bar-val">${c.comunicados}</span></div>`).join('')||'<div class="empty-state">Sin comunicados.</div>';
  const cliTop=s.clientes_top||[]; const maxCli=Math.max(...cliTop.map(x=>x.recursos),1);
  const cliBars=cliTop.map(x=>`<div class="bar-row clickable" onclick="gotoCliComs('${esc(x.cliente).replace(/'/g,"\\'")}')" title="Ver comunicados de ${esc(x.cliente)}">
      <span class="bar-label" title="${esc(x.cliente)}">${esc(x.cliente)}</span>${splitBar(x.revisados||0,x.recursos,maxCli)}
      <span class="bar-val">${(x.revisados||0)}/${x.recursos}</span></div>`).join('')||'<div class="empty-state">Sin clientes.</div>';
  const estItems=[{k:'Completado',v:ce.completado,c:'var(--ok)'},{k:'En progreso',v:ce.en_progreso,c:'var(--accent)'},
    {k:'Sin revisar',v:ce.sin_revisar,c:'var(--warn)'},{k:'Sin recursos',v:ce.sin_recursos,c:'var(--surface-3)'}];
  const estTot=estItems.reduce((a,b)=>a+b.v,0)||1;
  const estStack=`<div class="stack-bar">`+estItems.map(i=>i.v?`<div class="stack-seg" style="width:${(i.v/estTot*100).toFixed(1)}%;background:${i.c}" title="${i.k}: ${i.v}"></div>`:'').join('')+`</div>`;
  const estLegend=`<div class="legend" style="flex-wrap:wrap;gap:8px 16px">`+estItems.map(i=>`<div><span class="dot" style="background:${i.c}"></span>${i.k} <b>${i.v}</b></div>`).join('')+`</div>`;
  const rowLink=(p,danger)=>{
    const dl=p.fecha_limite?daysLeft(p.fecha_limite):null;
    const tag=danger?`<span class="status status--danger">${svg('warning')}${esc(p.fecha_limite)}</span>`
      :`<span class="status ${dueClass(p.fecha_limite)==='--warn'?'status--warn':'status--ok'}">${svg('clock')}${esc(p.fecha_limite)}</span>`;
    const info=danger?`hace ${Math.abs(dl)} d`:`en ${dl} d`;
    return `<div class="dl clickable" onclick="openRecursos(${p.id})"><span class="t" title="${esc(p.titulo)}">${esc(p.titulo)}</span>${tag}
      <span class="caption" style="white-space:nowrap">${info}</span></div>`;};
  const prox=(s.proximos||[]).map(p=>rowLink(p,false)).join('')||'<div class="empty-state">Sin próximos vencimientos.</div>';
  const venc=(s.vencidos_list||[]).map(p=>rowLink(p,true)).join('')||'<div class="empty-state" style="padding:var(--sp-4)">Nada vencido. 👌</div>';
  const comLabel=team?'Comunicados':'Mis comunicados';
  const estTitle=team?'Comunicados por estado':'Mis comunicados por estado';
  if(!team && totCom===0){
    body.innerHTML=`<div class="empty-state" style="padding:var(--sp-6)">No tienes comunicados asignados como responsable “${esc(s.responsable)}”.</div>`;
    return;
  }
  body.innerHTML=`
    <div class="kpi-row">
      <div class="kpi kpi--info"><span class="kpi-value">${totCom}</span><span class="kpi-label">${comLabel}</span></div>
      <div class="kpi ${pctClass(pctCom)}"><span class="kpi-value">${pctCom}%</span><span class="kpi-label">Comunicados completados</span></div>
      <div class="kpi kpi--info"><span class="kpi-value">${s.clientes_afectados||0}</span><span class="kpi-label">Clientes afectados</span></div>
      <div class="kpi ${t.vencidos>0?'kpi--danger':'kpi--ok'}"><span class="kpi-value">${t.vencidos}</span><span class="kpi-label">Comunicados vencidos</span></div>
    </div>
    <div class="cards">
      <div class="card"><div class="card__head"><div class="card__title">${svg('check')}Progreso de revisión</div><span class="caption mono">${comDone}/${totCom}</span></div>
        <div class="donut-wrap">${donut([{value:comDone,color:'var(--ok)'},{value:comPend,color:'var(--warn)'}])}
          <div class="legend"><div><span class="dot" style="background:var(--ok)"></span>Completados <b>${comDone}</b></div>
            <div><span class="dot" style="background:var(--warn)"></span>Pendientes <b>${comPend}</b></div>
            <div><span class="dot" style="background:var(--surface-2)"></span>Total <b>${totCom}</b></div></div></div></div>
      <div class="card"><div class="card__head"><div class="card__title">${svg('warning')}Acción requerida · vencidos</div><span class="badge" style="background:var(--danger-bg);border-color:var(--danger-border);color:var(--danger)">${t.vencidos}</span></div>${venc}</div>
    </div>
    <div class="cards">
      <div class="card"><div class="card__head"><div class="card__title">${svg('notice')}Comunicados por categoría</div><span class="caption">comunicados</span></div>${catBars}</div>
      <div class="card"><div class="card__head"><div class="card__title">${svg('clock')}Próximos vencimientos</div></div>${prox}</div>
    </div>
    <div class="cards">
      <div class="card"><div class="card__head"><div class="card__title">${svg('notice')}${estTitle}</div><span class="caption mono">${t.comunicados} total</span></div>${estStack}${estLegend}</div>
      <div class="card"><div class="card__head"><div class="card__title">${svg('building')}Clientes afectados</div><span class="caption mono">${s.clientes_afectados} clientes</span></div>${cliBars}</div>
    </div>`;
}

// ---------- COMUNICADOS ----------
function comStatus(c){   // estado simple derivado del avance de revisión
  if(!c.n_recursos||c.n_revisados===0)return 'sin';        // sin revisar
  if(c.n_revisados>=c.n_recursos)return 'done';            // completado
  return 'proc';                                           // en proceso
}
// Estado autocalculado (etiqueta + color) desde el avance de revisión — reemplaza al antiguo campo manual.
function comEstadoInfo(c){
  const nr=c.n_recursos||0, nv=c.n_revisados||0;
  if(!nr)     return {label:'Sin recursos', st:''};
  if(nv>=nr)  return {label:'Completado',  st:'status--ok'};
  if(nv===0)  return {label:'Sin revisar', st:'status--danger'};
  return              {label:'En proceso', st:'status--warn'};
}
function comMatch(c,q){
  if(STATE.verArch?!c.archivado:!!c.archivado)return false;   // archivados: ocultos salvo en "Ver archivados"
  if(STATE.cat&&c.categoria!==STATE.cat)return false;
  // Filtros por cliente/suscripción: un comunicado "afecta a todo Azure" siempre entra.
  if(STATE.comCli.length&&!c.afecta_todas&&!STATE.comCli.some(x=>(c.clientes||[]).includes(x)))return false;
  if(STATE.comSub.length&&!c.afecta_todas&&!STATE.comSub.some(x=>(c.suscripciones||[]).includes(x)))return false;
  const vencido=c.fecha_limite&&c.fecha_limite<today;
  if(vencido&&!STATE.verVenc)return false;                 // por defecto solo vigentes
  const st=comStatus(c);
  if(STATE.est==='faltan'&&st==='done')return false;       // "los que faltan" = no completados
  if((STATE.est==='sin'||STATE.est==='proc'||STATE.est==='done')&&st!==STATE.est)return false;
  if(q){const b=[c.titulo,c.resumen,c.categoria,c.responsable,c.archivo].join(' ').toLowerCase();if(!b.includes(q))return false;}
  return true;
}
function anyComFilter(){return STATE.q||STATE.cat||STATE.est!=='faltan'||STATE.verVenc||STATE.comCli.length||STATE.comSub.length;}
// ---- Popover de filtro (pestañas Cliente/Suscripción · buscador · checks · scroll) ----
function comFilterOptions(tab){
  if(tab==='cliente') return (CLI.list||[]).map(c=>c.nombre).filter(Boolean).sort((a,b)=>a.localeCompare(b,'es'));
  return [...new Set((CLI.list||[]).flatMap(c=>(c.suscripciones||[]).map(s=>s.nombre).filter(Boolean)))].sort((a,b)=>a.localeCompare(b,'es'));
}
function comFilterListHTML(){
  const sel=STATE.comFilterTab==='cliente'?STATE.comCli:STATE.comSub;
  const q=(STATE.comFilterQ||'').trim().toLowerCase();
  const opts=comFilterOptions(STATE.comFilterTab).filter(n=>!q||n.toLowerCase().includes(q));
  if(!opts.length) return '<div class="fp-empty">Sin coincidencias.</div>';
  return opts.map(n=>`<label class="fp-check"><input type="checkbox" data-val="${esc(n)}" ${sel.includes(n)?'checked':''}><span title="${esc(n)}">${esc(n)}</span></label>`).join('');
}
function comFilterTabsHTML(){
  const t=(id,l,n)=>`<button class="fp-tab ${STATE.comFilterTab===id?'active':''}" onclick="setComFilterTab('${id}')">${l}${n?` <span class="fp-tabn">${n}</span>`:''}</button>`;
  return t('cliente','Cliente',STATE.comCli.length)+t('suscripcion','Suscripción',STATE.comSub.length);
}
const COM_ESTADOS=[['faltan','Pendientes'],['sin','Sin revisar'],['proc','En proceso'],['done','Completado'],['','Todos']];
function comEstadoHTML(){
  return COM_ESTADOS.map(([v,l])=>`<button class="fp-est ${STATE.est===v?'active':''}" onclick="setComEstado('${v}')">${l}</button>`).join('');
}
function setComEstado(v){STATE.est=v;STATE.comPage=0;render();}
function comFilters(nShown){
  const nVenc=STATE.comunicados.filter(c=>!c.archivado&&c.fecha_limite&&c.fecha_limite<today).length;
  const nArch=STATE.comunicados.filter(c=>c.archivado).length;
  const catChip=STATE.cat?`<span class="fchip">${svg('filter')}<b>${esc(STATE.cat)}</b><button title="Quitar categoría" onclick="setCat('')">${svg('close')}</button></span>`:'';
  const nActivos=STATE.comCli.length+STATE.comSub.length+(STATE.est!=='faltan'?1:0);
  const vBtn=(m,l)=>`<button class="seg ${STATE.comView===m?'active':''}" aria-pressed="${STATE.comView===m}" onclick="setComView('${m}')">${l}</button>`;
  return `<div class="toolbar">
    <div class="search search-lg"><span>${svg('search')}</span><input id="fsearch" placeholder="Buscar por título, resumen, responsable…" value="${esc(STATE.q)}"></div>
    <div class="tb-filters">
      <div class="comfilter" id="comFilter">
        <button class="btn sm ${STATE.comFiltersOpen||nActivos?'primary':''}" id="btnFiltrar" onclick="toggleComFilters()" aria-expanded="${STATE.comFiltersOpen}" title="Filtrar por cliente y suscripción">
          ${svg('filter')}Filtrar${nActivos?` <span class="chip-n">${nActivos}</span>`:''}
        </button>
        <div class="fpop" id="comFilterPop" ${STATE.comFiltersOpen?'':'hidden'}>
          <div class="fp-block">
            <div class="fp-label">Estado del comunicado</div>
            <div class="fp-ests" id="fpEsts">${comEstadoHTML()}</div>
          </div>
          <div class="fp-sep"></div>
          <div class="fp-tabs" id="fpTabs">${comFilterTabsHTML()}</div>
          <div class="fp-search"><span>${svg('search')}</span><input id="fpSearch" placeholder="Buscar…" value="${esc(STATE.comFilterQ)}" autocomplete="off"></div>
          <div class="fp-list" id="fpList">${comFilterListHTML()}</div>
          <div class="fp-foot">
            <span class="fp-count" id="fpCount">${STATE.comCli.length+STATE.comSub.length} seleccionado(s)</span>
            <button class="link-ghost" onclick="clearComCliSub()">Limpiar</button>
          </div>
        </div>
      </div>
      <button class="btn sm ${STATE.verVenc?'primary':''}" id="btnVenc" onclick="toggleVenc()" title="${STATE.verVenc?'Ocultar':'Mostrar'} comunicados vencidos">
        ${svg(STATE.verVenc?'eye':'eyeoff')}Ver vencidos${nVenc?` <span class="chip-n">${nVenc}</span>`:''}
      </button>
      <button class="btn sm ${STATE.verArch?'primary':''}" id="btnArch" onclick="toggleArch()" title="${STATE.verArch?'Volver a los activos':'Ver comunicados archivados'}">
        ${svg('archive')}Archivados${nArch?` <span class="chip-n">${nArch}</span>`:''}
      </button>
      ${catChip}
    </div>
    <div class="tb-spacer"></div>
    <div class="tb-actions">
      <div class="segbar" role="group" aria-label="Ver comunicados agrupados">
        ${vBtn('','Lista')}${vBtn('cliente','Por cliente')}${vBtn('suscripcion','Por suscripción')}
      </div>
      <button class="btn primary sm" onclick="openForm()">${svg('add')}Nuevo comunicado</button>
    </div>
  </div>`;
}
function renderComunicados(){
  const list=comFilteredList();
  const revLabel=STATE.comView==='cliente'?'Suscripciones revisadas':STATE.comView==='suscripcion'?'Recursos revisados':'Clientes revisados';
  // En vista Lista las columnas son ordenables; en vistas agrupadas se muestran planas.
  const th=(label,col,style='')=>STATE.comView?`<th style="${style}">${label}</th>`:comSortTh(label,col,style);
  const head=STATE.comScope
    ?`<button class="back-link" onclick="navigate('/clientes')"><span style="transform:rotate(180deg);display:inline-flex">${svg('chev','icon')}</span>Clientes</button>
      <h1 class="page">${esc(STATE.comScope.nombre)}</h1>`
    :`<h1 class="page">Comunicados</h1>`;
  $('#content').innerHTML=`${head}    ${comFilters(list.length)}
    <div class="tblwrap" style="max-height:none">
      <table class="comtbl">
        <thead><tr>
          ${th('N°','n','width:56px')}${th('Comunicado','titulo')}${th('Categoría','categoria','width:210px')}
          ${th('Fecha límite','fecha_limite','width:190px')}${th(revLabel,'rev','width:180px')}<th style="width:120px">Acciones</th>
        </tr></thead>
        <tbody>${comTbody(list)}</tbody>
      </table></div>
    <div id="comPager">${comPagerHTML(list)}</div>`;
  const fs=$('#fsearch');
  fs.oninput=e=>{STATE.q=e.target.value;STATE.comPage=0;syncGlobalSearch();renderComListOnly();};
  // Popover de filtro: buscador (rebuild solo de la lista) + checks (multi-selección, delegado)
  const fpq=$('#fpSearch');
  if(fpq)fpq.oninput=e=>{STATE.comFilterQ=e.target.value;const l=$('#fpList');if(l)l.innerHTML=comFilterListHTML();};
  const fpl=$('#fpList');
  if(fpl)fpl.addEventListener('change',e=>{
    const cb=e.target.closest('input[type=checkbox]');if(!cb)return;
    const arr=STATE.comFilterTab==='cliente'?STATE.comCli:STATE.comSub, i=arr.indexOf(cb.dataset.val);
    if(cb.checked){if(i<0)arr.push(cb.dataset.val);}else if(i>=0)arr.splice(i,1);
    STATE.comPage=0;renderComListOnly();updateFiltrarBadge();
  });
}
function updateFiltrarBadge(){                     // refresca botón + contadores sin cerrar el popover
  const n=STATE.comCli.length+STATE.comSub.length, b=$('#btnFiltrar');
  if(b){b.classList.toggle('primary',!!(STATE.comFiltersOpen||n));b.innerHTML=`${svg('filter')}Filtrar${n?` <span class="chip-n">${n}</span>`:''}`;}
  const c=$('#fpCount');if(c)c.textContent=`${n} seleccionado(s)`;
  const tabs=$('#fpTabs');if(tabs)tabs.innerHTML=comFilterTabsHTML();
}
function setComFilterTab(t){STATE.comFilterTab=t;STATE.comFilterQ='';render();}
const COM_EMPTY='<tr><td colspan="6"><div class="empty-state">Sin resultados para estos filtros.</div></td></tr>';
// Suscripciones registradas bajo algún cliente (nunca se agrupa/filtra por las sin cliente).
function subsConClienteSet(){
  return new Set((CLI.list||[]).flatMap(c=>(c.suscripciones||[]).map(s=>s.nombre).filter(Boolean)));
}
function comAfectaKeys(c,by,okSubs){
  if(c.afecta_todas)return ['Afecta a todo Azure'];
  let arr=(by==='cliente'?c.clientes:c.suscripciones)||[];
  if(by==='suscripcion'&&okSubs) arr=arr.filter(s=>okSubs.has(s));   // excluye suscripciones sin cliente
  return arr;   // sin cliente/suscripción → no aparece en la vista agrupada (sin grupo comodín)
}
// ---- Orden y paginación de la lista de comunicados (solo vista Lista) ----
function comRevRatio(c){   // avance de la columna Revisión según el toggle actual
  let rev,tot;
  if(STATE.comView==='cliente'){ rev=c.n_subs_rev; tot=c.n_subs; }
  else if(STATE.comView==='suscripcion'){ rev=c.n_revisados; tot=c.n_recursos; }
  else { rev=c.n_clientes_rev; tot=c.n_clientes; }
  return tot?(rev||0)/tot:-1;
}
function comSortRows(list){
  const {col,dir}=STATE.comSort;
  const arr=[...list];
  arr.sort((a,b)=>{
    if(col==='fecha_limite'){                       // fecha: sin fecha siempre al final
      const av=a.fecha_limite||'', bv=b.fecha_limite||'';
      if(!av&&!bv) return (+a.id)-(+b.id);
      if(!av) return 1; if(!bv) return -1;
      return av<bv?-dir:av>bv?dir:0;
    }
    let av,bv;
    if(col==='n'){ av=+a.id||0; bv=+b.id||0; }
    else if(col==='rev'){ av=comRevRatio(a); bv=comRevRatio(b); }
    else { av=(a[col]||'').toString().toLowerCase(); bv=(b[col]||'').toString().toLowerCase(); }
    if(typeof av==='number'&&typeof bv==='number') return (av-bv)*dir||((+a.id)-(+b.id));
    return String(av).localeCompare(String(bv),'es',{numeric:true,sensitivity:'base'})*dir;
  });
  return arr;
}
function setComSort(col){
  const s=STATE.comSort;
  if(s.col===col)s.dir*=-1;else{s.col=col;s.dir=1;}
  STATE.comPage=0; render();
}
function comSortArrow(col){return STATE.comSort.col===col?`<span class="sarrow">${STATE.comSort.dir>0?'↑':'↓'}</span>`:'';}
function comSortTh(label,col,style=''){
  const on=STATE.comSort.col===col;
  return `<th style="${style}" class="sortable ${on?'sorted':''}" role="button" tabindex="0" aria-sort="${on?(STATE.comSort.dir>0?'ascending':'descending'):'none'}" onclick="setComSort('${col}')" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();setComSort('${col}')}">${label}${comSortArrow(col)}</th>`;
}
function clienteIdPorNombre(nombre){const c=(CLI.list||[]).find(x=>x.nombre===nombre);return c?c.id:null;}
function comFilteredList(){
  let base=STATE.comunicados;
  if(STATE.comScope){   // acotado a un cliente: comunicados que le afectan (directos + "todo Azure")
    const cn=STATE.comScope.nombre;
    base=base.filter(c=>c.afecta_todas||(c.clientes||[]).includes(cn));
  }
  return base.filter(c=>comMatch(c,STATE.q.trim().toLowerCase()));
}
function comPagerHTML(list){
  if(STATE.comView) return '';                      // paginación solo en vista Lista
  const size=STATE.comPageSize, pages=Math.max(1,Math.ceil(list.length/size));
  if(pages<=1) return '';
  const p=Math.min(Math.max(STATE.comPage,0),pages-1);
  const desde=list.length?p*size+1:0, hasta=Math.min((p+1)*size,list.length);
  return `<div class="pager">
    <span class="pager-info">${desde}–${hasta} de ${list.length}</span>
    <button class="btn sm btn-icon" title="Anterior" ${p<=0?'disabled':''} onclick="comGoPage(${p-1})"><span style="transform:rotate(180deg);display:inline-flex">${svg('chev','icon')}</span></button>
    <span class="pager-info">Página ${p+1} de ${pages}</span>
    <button class="btn sm btn-icon" title="Siguiente" ${p>=pages-1?'disabled':''} onclick="comGoPage(${p+1})">${svg('chev','icon')}</button>
  </div>`;
}
function comGoPage(p){STATE.comPage=p;renderComListOnly();}
function comTbody(list){
  if(!list.length)return COM_EMPTY;
  if(!STATE.comView){                               // vista Lista: ordenada + paginada
    const sorted=comSortRows(list), size=STATE.comPageSize;
    const pages=Math.max(1,Math.ceil(sorted.length/size));
    STATE.comPage=Math.min(Math.max(STATE.comPage,0),pages-1);
    return sorted.slice(STATE.comPage*size,(STATE.comPage+1)*size).map(comRow).join('');
  }
  const by=STATE.comView,map=new Map();
  const okSubs=by==='suscripcion'?subsConClienteSet():null;
  list.forEach(c=>comAfectaKeys(c,by,okSubs).forEach(k=>{let g=map.get(k);if(!g){g=[];map.set(k,g);}g.push(c);}));
  const keys=[...map.keys()].sort((a,b)=>{
    const pa=a==='Afecta a todo Azure'?0:1,pb=b==='Afecta a todo Azure'?0:1;   // "todo Azure" primero
    return pa-pb||a.localeCompare(b,'es',{numeric:true,sensitivity:'base'});
  });
  COMGRP.keys=keys;
  if(!keys.length)return COM_EMPTY;   // ninguno con cliente/suscripción en esta agrupación
  return keys.map((k,i)=>{
    const rows=map.get(k),col=COM_COLLAPSED.has(k);
    const head=`<tr class="grp-head" onclick="toggleComGrp(${i})">
      <td colspan="6"><span class="grp-arrow">${col?'▸':'▾'}</span> <b>${esc(k)}</b> <span class="caption">· ${rows.length} comunicado${rows.length===1?'':'s'}</span></td></tr>`;
    return head+(col?'':rows.map(comRow).join(''));
  }).join('');
}
function setComView(m){STATE.comView=m;STATE.comPage=0;render();}
function toggleComFilters(){STATE.comFiltersOpen=!STATE.comFiltersOpen;render();}
function clearComCliSub(){STATE.comCli=[];STATE.comSub=[];STATE.comFilterQ='';STATE.comPage=0;render();}
function toggleComGrp(i){const k=COMGRP.keys[i];if(k==null)return;COM_COLLAPSED.has(k)?COM_COLLAPSED.delete(k):COM_COLLAPSED.add(k);renderComListOnly();}
function setCat(c){STATE.cat=c;STATE.comPage=0;render();}
function toggleVenc(){STATE.verVenc=!STATE.verVenc;STATE.comPage=0;render();}
function toggleArch(){STATE.verArch=!STATE.verArch;STATE.comPage=0;render();}
function renderComListOnly(){
  const list=comFilteredList();
  const tb=document.querySelector('.comtbl tbody');
  if(tb)tb.innerHTML=comTbody(list);
  const pg=$('#comPager');if(pg)pg.innerHTML=comPagerHTML(list);
}
function syncGlobalSearch(){}   // el buscador del navbar ahora es un selector de objetos, no el filtro de comunicados
function clearComFilters(){STATE.q='';STATE.cat='';STATE.est='faltan';STATE.verVenc=false;STATE.comCli=[];STATE.comSub=[];STATE.comFilterQ='';STATE.comPage=0;syncGlobalSearch();render();}
// Celda "Revisión" según el toggle: Lista → clientes · Por cliente → suscripciones · Por suscripción → recursos
function comRevCell(c){
  let rev, tot, unit, empty;
  if(STATE.comView==='cliente'){ rev=c.n_subs_rev||0; tot=c.n_subs||0; unit='suscripciones'; empty='sin suscripciones'; }
  else if(STATE.comView==='suscripcion'){ rev=c.n_revisados||0; tot=c.n_recursos||0; unit='recursos'; empty='sin recursos'; }
  else { rev=c.n_clientes_rev||0; tot=c.n_clientes||0; unit='clientes'; empty='sin clientes'; }
  if(!tot) return `<span class="caption">${empty}</span>`;
  const pct=Math.round(rev/tot*100);
  return `<div class="cellprog" title="${rev} de ${tot} ${unit} revisados"><div class="track"><div class="fill ${pct===100?'full':''}" style="width:${pct}%"></div></div><span class="mono">${rev}/${tot}</span></div>`;
}
function comRow(c){
  const q=STATE.q.trim();
  const cl=dueClass(c.fecha_limite);
  const due=c.fecha_limite?`<span class="status ${cl==='--danger'?'status--danger':cl==='--warn'?'status--warn':'status--ok'}">${svg('clock')}${fmtFechaLarga(c.fecha_limite)}</span>`:'<span class="caption">—</span>';
  return `<tr>
    <td class="mono">#${esc(c.id)}</td>
    <td class="ctitle"><b class="comlink" onclick="openRecursos(${c.id})" title="Ver detalle del comunicado">${hl(c.titulo,q)}</b>${c.archivado?` <span class="tag-arch">Archivado</span>`:''}${c.responsable?`<div class="caption" style="text-transform:none">${esc(c.responsable)}</div>`:''}</td>
    <td>${catBadge(c.categoria)}</td>
    <td>${due}</td>
    <td>${comRevCell(c)}</td>
    <td><div class="acts">
      <button class="btn sm btn-icon" title="Editar" onclick="openForm(${c.id})">${svg('edit')}</button>
      ${c.archivado
        ?`<button class="btn sm btn-icon" title="Restaurar" onclick="archiveCom(${c.id},0)">${svg('unarchive')}</button>`
        :`<button class="btn sm btn-icon" title="Archivar" onclick="archiveCom(${c.id},1)">${svg('archive')}</button>`}
      <button class="btn sm btn-icon danger" title="Eliminar" onclick="delCom(${c.id})">${svg('trash')}</button>
    </div></td></tr>`;
}

// ---------- PÁGINA RECURSOS ----------
let RES={cid:null,rows:[],com:null,_groups:[],_groupBy:'',selected:new Set(),invKqlOpen:null};
// Nombre del usuario logueado para el sello de "revisado por" (optimista; el servidor lo re-sella).
function meName(){const m=STATE.me||{};return `${m.nombre||''} ${m.apellido||''}`.trim()||m.correo||'usuario';}
function openRecursos(cid){navigate('/comunicados/'+cid+'/recursos');}  // navega al endpoint
async function loadRecursos(cid){
  RES.cid=cid;RES.com=STATE.comunicados.find(c=>c.id===cid);
  if(!RES.com){RES.rows=[];RES.invs=[];return;}
  RES.rows=await api(`/api/comunicados/${cid}/recursos`);
  try{RES.invs=await api(`/api/comunicados/${cid}/inventarios`);}
  catch(e){RES.invs=[];}   // servidor antiguo sin la ruta: no rompas la página
  RES.invEditing=null;RES.invKqlOpen=null;
  STATE.recMode='cliente';
  STATE.recQ='';STATE.recCli=[];STATE.recSub=[];STATE.recRG='';STATE.recRev='';
  STATE.recFiltersOpen=false;STATE.recFilterTab='cliente';STATE.recFilterQ='';
  // Siempre debe haber un lote de inventario seleccionado: por defecto el más reciente.
  STATE.recInv=(RES.invs&&RES.invs.length)?RES.invs[0].id:'';
}
function backToComunicados(){navigate('/comunicados');}
function setRecMode(m){STATE.recMode=m;render();}
function clearRecFilters(){STATE.recQ='';STATE.recCli=[];STATE.recSub=[];STATE.recRG='';STATE.recRev='';STATE.recFilterQ='';render();}
function setLocal(r,val){r.revisado=val?1:0;r.revisado_por=val?meName():null;r.revisado_at=val?new Date().toISOString():null;}
function recStructural(){  // filtro por cliente + suscripción + RG (base para conteos)
  return RES.rows.filter(r=>{
    if(STATE.recInv&&String(r.inventario_id)!==String(STATE.recInv))return false;
    if(STATE.recCli.length&&!STATE.recCli.includes(r.cliente||'(sin cliente)'))return false;
    if(STATE.recSub.length&&!STATE.recSub.includes(r.suscripcion))return false;
    if(STATE.recRG&&r.grupo_recurso!==STATE.recRG)return false;
    return true;
  });
}
function recFiltered(){
  const q=(STATE.recQ||'').toLowerCase();
  return recStructural().filter(r=>{
    if(STATE.recRev==='rev'&&!r.revisado)return false;
    if(STATE.recRev==='pend'&&r.revisado)return false;
    if(q){const b=[r.suscripcion,r.grupo_recurso,r.nombre_recurso,r.estado,r.gestor].join(' ').toLowerCase();if(!b.includes(q))return false;}
    return true;
  });
}
function setRecRev(v){STATE.recRev=v;RES.selected.clear();updateBody();const el=$('#fpRecEsts');if(el)el.innerHTML=recEstadoHTML();updateRecFiltrarBadge();}
function setSort(col){
  const s=STATE.recSort;
  if(s.col===col)s.dir*=-1;else{s.col=col;s.dir=1;}
  RES.selected.clear();updateBody();
}
function sortArrow(col){return STATE.recSort.col===col?`<span class="sarrow">${STATE.recSort.dir>0?'↑':'↓'}</span>`:'';}
function sortTh(label,col,cls=''){
  const on=STATE.recSort.col===col;
  return `<th class="${cls} sortable ${on?'sorted':''}" role="button" tabindex="0" aria-sort="${on?(STATE.recSort.dir>0?'ascending':'descending'):'none'}" onclick="setSort('${col}')" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();setSort('${col}')}">${label}${sortArrow(col)}</th>`;
}
function sortRows(rows){
  const {col,dir}=STATE.recSort;if(!col)return rows;
  const val=r=>(col==='cliente'?r.cliente:col==='suscripcion'?r.suscripcion:r.nombre_recurso)||'';
  return [...rows].sort((a,b)=>val(a).localeCompare(val(b),'es',{numeric:true,sensitivity:'base'})*dir);
}
// ---- Popover de filtro de recursos (espejo del de comunicados: Estado de revisión · pestañas Cliente/Suscripción · buscador · checks) ----
function recFilterOptions(tab){
  if(tab==='cliente') return [...new Set(RES.rows.map(r=>r.cliente||'(sin cliente)'))].sort((a,b)=>a.localeCompare(b,'es'));
  // Solo suscripciones con cliente asignado, igual que antes.
  const conCli=new Set(RES.rows.filter(r=>(r.cliente||'').trim()).map(r=>r.suscripcion).filter(Boolean));
  return [...conCli].sort((a,b)=>a.localeCompare(b,'es'));
}
function recFilterListHTML(){
  const sel=STATE.recFilterTab==='cliente'?STATE.recCli:STATE.recSub;
  const q=(STATE.recFilterQ||'').trim().toLowerCase();
  const opts=recFilterOptions(STATE.recFilterTab).filter(n=>!q||n.toLowerCase().includes(q));
  if(!opts.length) return '<div class="fp-empty">Sin coincidencias.</div>';
  return opts.map(n=>`<label class="fp-check"><input type="checkbox" data-val="${esc(n)}" ${sel.includes(n)?'checked':''}><span title="${esc(n)}">${esc(n)}</span></label>`).join('');
}
function recFilterTabsHTML(){
  const t=(id,l,n)=>`<button class="fp-tab ${STATE.recFilterTab===id?'active':''}" onclick="setRecFilterTab('${id}')">${l}${n?` <span class="fp-tabn">${n}</span>`:''}</button>`;
  return t('cliente','Cliente',STATE.recCli.length)+t('suscripcion','Suscripción',STATE.recSub.length);
}
const REC_ESTADOS=[['','Todos'],['pend','Pendientes'],['rev','Revisados']];
function recEstadoHTML(){
  return REC_ESTADOS.map(([v,l])=>`<button class="fp-est ${STATE.recRev===v?'active':''}" onclick="setRecRev('${v}')">${l}</button>`).join('');
}
// Ficha del comunicado sobre la tabla: descripción/observaciones/fuentes a la izquierda, campos clave a la derecha.
function recInfoHTML(c){
  const fuentes=(c.fuente||'').split(/\r?\n/).map(s=>s.trim()).filter(Boolean);
  const main=[];
  if((c.resumen||'').trim()) main.push(`<div class="rec-block"><span class="rec-k">Descripción</span><p class="rec-desc">${esc(c.resumen)}</p></div>`);
  if((c.observaciones||'').trim()) main.push(`<div class="rec-block"><span class="rec-k">Observaciones</span><p class="rec-desc">${esc(c.observaciones)}</p></div>`);
  if(fuentes.length) main.push(`<div class="rec-block"><span class="rec-k">Fuentes</span><div class="rec-fuentes">${fuentes.map(u=>`<a href="${esc(u)}" target="_blank" rel="noopener" title="${esc(u)}">${esc(u.replace(/^https?:\/\//,''))}</a>`).join('')}</div></div>`);
  const est=comEstadoInfo(c);
  const estHtml=est.st?`<span class="status ${est.st}">${est.label}</span>`:`<span class="caption">${est.label}</span>`;
  const fields=[
    ['Responsable', c.responsable?esc(c.responsable):''],
    ['Fecha límite', c.fecha_limite?fmtFechaLarga(c.fecha_limite):''],
    ['Estado', estHtml],
    ['Categoría', c.categoria?catBadge(c.categoria):''],
  ].filter(x=>x[1]);
  if(!main.length&&!fields.length&&!c.afecta_todas) return '';
  return `<div class="rec-info">
    <div class="rec-info-main">${main.join('')||'<span class="caption">Sin descripción.</span>'}</div>
    <div class="rec-info-side">
      ${fields.map(([k,v])=>`<div class="rec-field"><span class="rec-k">${k}</span><span class="rec-v">${v}</span></div>`).join('')}
      ${c.afecta_todas?`<div class="afecta-badge">${svg('notice','icon')}Afecta a todo Azure</div>`:''}
    </div>
  </div>`;
}
function recFilters(){
  const nActivos=STATE.recCli.length+STATE.recSub.length+(STATE.recRev?1:0);
  const gBtn=(m,label)=>`<button class="seg ${STATE.recMode===m?'active':''}" aria-pressed="${STATE.recMode===m}" onclick="setRecMode('${m}')">${label}</button>`;
  return `<div class="toolbar">
    <div class="search search-lg"><span>${svg('search')}</span><input id="recq" placeholder="Buscar recurso…" value="${esc(STATE.recQ)}"></div>
    <div class="tb-filters">
      <div class="recfilter" id="recFilter">
        <button class="btn sm ${STATE.recFiltersOpen||nActivos?'primary':''}" id="btnRecFiltrar" onclick="toggleRecFilters()" aria-expanded="${STATE.recFiltersOpen}" title="Filtrar por cliente, suscripción y revisión">
          ${svg('filter')}Filtrar${nActivos?` <span class="chip-n">${nActivos}</span>`:''}
        </button>
        <div class="fpop" id="recFilterPop" ${STATE.recFiltersOpen?'':'hidden'}>
          <div class="fp-block">
            <div class="fp-label">Estado de revisión</div>
            <div class="fp-ests" id="fpRecEsts">${recEstadoHTML()}</div>
          </div>
          <div class="fp-sep"></div>
          <div class="fp-tabs" id="fpRecTabs">${recFilterTabsHTML()}</div>
          <div class="fp-search"><span>${svg('search')}</span><input id="fpRecSearch" placeholder="Buscar…" value="${esc(STATE.recFilterQ)}" autocomplete="off"></div>
          <div class="fp-list" id="fpRecList">${recFilterListHTML()}</div>
          <div class="fp-foot">
            <span class="fp-count" id="fpRecCount">${STATE.recCli.length+STATE.recSub.length} seleccionado(s)</span>
            <button class="link-ghost" onclick="clearRecCliSub()">Limpiar</button>
          </div>
        </div>
      </div>
    </div>
    <div class="tb-spacer"></div>
    <div class="tb-actions">
      <div class="segbar" role="group" aria-label="Agrupar por">
        ${gBtn('recurso','Lista')}${gBtn('cliente','Por cliente')}${gBtn('suscripcion','Por suscripción')}
      </div>
      <button class="btn sm" title="Ver el query KQL del inventario seleccionado" ${STATE.recInv?`onclick="openInvKql(${STATE.recInv})"`:'disabled'}>${svg('search')}Ver KQL</button>
      <button class="btn-icon-ghost" aria-label="Descargar CSV" title="Descargar CSV" onclick="exportCSV()">${svg('export')}</button>
      <button class="btn primary sm" onclick="openInvForm(${RES.cid})">${svg('add')}Nuevo inventario</button>
    </div>
  </div>`;
}
function toggleRecFilters(){STATE.recFiltersOpen=!STATE.recFiltersOpen;render();}
function setRecFilterTab(t){STATE.recFilterTab=t;STATE.recFilterQ='';render();}
function clearRecCliSub(){STATE.recCli=[];STATE.recSub=[];STATE.recFilterQ='';render();}
function updateRecFiltrarBadge(){                  // refresca botón + contadores sin cerrar el popover
  const n=STATE.recCli.length+STATE.recSub.length, b=$('#btnRecFiltrar');
  const nAct=n+(STATE.recRev?1:0);
  if(b){b.classList.toggle('primary',!!(STATE.recFiltersOpen||nAct));b.innerHTML=`${svg('filter')}Filtrar${nAct?` <span class="chip-n">${nAct}</span>`:''}`;}
  const c=$('#fpRecCount');if(c)c.textContent=`${n} seleccionado(s)`;
  const tabs=$('#fpRecTabs');if(tabs)tabs.innerHTML=recFilterTabsHTML();
}
function renderRecursos(){
  RES.selected=new Set();   // la selección no sobrevive a un re-render de filtros/modo
  const c=RES.com;
  // Descarta selecciones de suscripción que ya no tienen cliente asignado.
  const subsConCliente=new Set(RES.rows.filter(r=>(r.cliente||'').trim()).map(r=>r.suscripcion).filter(Boolean));
  STATE.recSub=STATE.recSub.filter(s=>subsConCliente.has(s));
  const clientesAll=[...new Set(RES.rows.map(r=>r.cliente||'(sin cliente)'))];
  const subsAll=[...new Set(RES.rows.map(r=>r.suscripcion).filter(Boolean))];
  const pctTot=Math.round(RES.rows.filter(r=>r.revisado).length/(RES.rows.length||1)*100);
  const pc=pctTot>=90?'ok':pctTot>=50?'warn':'danger';
  $('#content').innerHTML=`
    <button class="back-link" onclick="backToComunicados()"><span style="transform:rotate(180deg);display:inline-flex">${svg('chev','icon')}</span>Comunicados</button>
    <div class="rechead">
      <h1 class="page" style="margin:0">${esc(c.titulo)}${c.archivado?` <span class="tag-arch">Archivado</span>`:''}</h1>
      <div class="statstrip"><b>${clientesAll.length}</b> clientes · <b>${subsAll.length}</b> suscripciones · <b>${RES.rows.length}</b> recursos · <span class="status status--${pc}">${pctTot}% revisado</span></div>
      <div class="rechead-acts">
        <button class="btn sm" title="Editar comunicado" onclick="openForm(${c.id})">${svg('edit')}Editar</button>
        ${c.archivado
          ?`<button class="btn sm" title="Restaurar comunicado" onclick="archiveCom(${c.id},0)">${svg('unarchive')}Restaurar</button>`
          :`<button class="btn sm" title="Archivar comunicado" onclick="archiveCom(${c.id},1)">${svg('archive')}Archivar</button>`}
        <button class="btn sm danger" title="Eliminar comunicado" onclick="delCom(${c.id})">${svg('trash')}Eliminar</button>
      </div>
    </div>
    ${recInfoHTML(c)}
    <div id="invBox" class="inv-hist"></div>
    ${recFilters()}
    <!-- FRANJA 2 / barra de selección -->
    <div class="status-row" id="statusRow"></div>
    <div id="recbody"></div>`;
  renderInvHistory();
  $('#recq').oninput=e=>{STATE.recQ=e.target.value;RES.selected.clear();updateBody();};
  // Popover de filtro: buscador (rebuild solo de la lista) + checks (multi-selección, delegado)
  const fpq=$('#fpRecSearch');
  if(fpq)fpq.oninput=e=>{STATE.recFilterQ=e.target.value;const l=$('#fpRecList');if(l)l.innerHTML=recFilterListHTML();};
  const fpl=$('#fpRecList');
  if(fpl)fpl.addEventListener('change',e=>{
    const cb=e.target.closest('input[type=checkbox]');if(!cb)return;
    const arr=STATE.recFilterTab==='cliente'?STATE.recCli:STATE.recSub, i=arr.indexOf(cb.dataset.val);
    if(cb.checked){if(i<0)arr.push(cb.dataset.val);}else if(i>=0)arr.splice(i,1);
    RES.selected.clear();updateBody();updateRecFiltrarBadge();
  });
  updateBody();
}
function setRecCli(v){STATE.recCli=v?[v]:[];STATE.recSub=[];STATE.recRG='';render();}
function setRecSub(v){STATE.recSub=v?[v]:[];STATE.recRG='';render();}
function setRecRG(v){STATE.recRG=v;render();}
function setRecQ(v){STATE.recQ=v;render();}
// ---- Historial de inventarios (lotes: fecha + query + recursos) ----
function renderInvHistory(){
  const el=$('#invBox');if(!el||!RES.com)return;
  const invs=RES.invs||[];
  // Cada lote = chip para seleccionar/filtrar por fecha. El KQL se ve desde el botón "Ver KQL" de la barra de filtros.
  const chips=invs.map(inv=>{
    const active=String(STATE.recInv)===String(inv.id);
    return `<button class="inv-chip ${active?'active':''}" title="${inv.n_recursos} recursos · ${invAgo(inv.fecha)}" onclick="filterInv(${inv.id})">${svg('clock')}<span>${fmtInv(inv.fecha)}</span></button>`;
  }).join('');
  el.innerHTML=`
    <div class="inv-bar">
      <span class="inv-label">${svg('clock')}Inventarios</span>
      <div class="inv-chips">${chips||'<span class="caption">Sin lotes aún</span>'}</div>
    </div>`;
}
// ---- Popup con el KQL del lote ----
function openInvKql(id){RES.invKqlOpen=id;RES.invEditing=null;renderInvKqlModal();openModal();}
function renderInvKqlModal(){   // solo lectura: ver el KQL del lote (sin editar/añadir ni eliminar)
  const inv=(RES.invs||[]).find(i=>String(i.id)===String(RES.invKqlOpen));
  if(!inv){closeModal();return;}
  const c=RES.com||{};
  const meta=`${fmtInv(inv.fecha)} · <span class="mono">${inv.n_recursos}</span> recursos · <span class="mono">${inv.n_clientes}</span> clientes · <span class="mono">${inv.n_subs}</span> susc`;
  const body=inv.kql?`<pre class="kql-code">${esc(inv.kql)}</pre>`:`<div class="kql-empty">Sin query guardado para este lote.</div>`;
  const foot=`${inv.kql?`<button class="btn" onclick="copyInv(${inv.id})">${svg('export')}Copiar</button>`:''}
       <button class="btn primary" onclick="closeModal()">Cerrar</button>`;
  $('#modal').className='modal md';
  $('#modal').innerHTML=`
    <div class="mhead"><div><h2>Query KQL</h2><div class="sub">#${esc(RES.cid)} · ${esc(c.titulo||'')}</div></div><button class="x" onclick="closeModal()">${svg('close')}</button></div>
    <div class="mbody"><div class="caption" style="margin-bottom:8px">${meta}</div>${body}<div class="form-foot">${foot}</div></div>`;
}
function filterInv(id){STATE.recInv=id;STATE.recCli=[];STATE.recSub=[];STATE.recRG='';render();}
function editInv(id){RES.invEditing=id;RES.invKqlOpen=id;renderInvKqlModal();}
function cancelInvEdit(){RES.invEditing=null;renderInvKqlModal();}
async function saveInvKql(id){
  const kql=$('#invText').value;
  try{
    await api('/api/inventarios/'+id,{method:'PUT',body:JSON.stringify({kql})});
    const inv=RES.invs.find(x=>x.id===id);if(inv)inv.kql=kql;
    RES.invEditing=null;renderInvKqlModal();toast('Query KQL guardado.');
  }catch(e){toast('Error: '+e.message);}
}
function copyInv(id){
  const inv=RES.invs.find(x=>x.id===id);const t=(inv&&inv.kql)||'';
  navigator.clipboard?.writeText(t).then(()=>toast('Query copiado.'),()=>toast('No se pudo copiar.'));
}
async function delInv(id){
  const inv=RES.invs.find(x=>x.id===id);
  if(!confirm(`¿Eliminar este lote de inventario y sus ${inv?inv.n_recursos:''} recursos?`))return;
  try{
    const r=await api('/api/inventarios/'+id,{method:'DELETE'});
    if(String(STATE.recInv)===String(id))STATE.recInv='';
    await loadRecursos(RES.cid);await refreshCounts();closeModal();
    toast(`Lote eliminado · ${r.recursos_eliminados} recursos.`);
  }catch(e){toast('Error: '+e.message);}
}
function updateBody(){
  const rows=recFiltered();
  $('#recbody').innerHTML=STATE.recMode==='recurso'?recTable(rows):groupView(STATE.recMode,rows);
  renderStatusRow();
}
function renderStatusRow(){
  const el=$('#statusRow');if(!el)return;
  const sel=RES.selected.size;
  if(sel>0){
    el.className='status-row selbar';
    el.innerHTML=`<div class="sel-info"><b>${sel}</b> seleccionado${sel>1?'s':''}</div>
      <div class="sel-acts">
        <button class="btn sm" onclick="markSelected(true)">${svg('check')}Marcar revisado</button>
        <button class="btn sm danger" onclick="markSelected(false)">Quitar</button>
        <button class="link-ghost" onclick="clearSelection()">Limpiar selección</button>
      </div>`;
    return;
  }
  el.className='status-row';
  const rows=recFiltered();
  el.innerHTML=`<span class="result-count">Mostrando ${rows.length} recurso(s)</span>`;
}
function toggleSelect(id,cb){
  if(cb.checked)RES.selected.add(id);else RES.selected.delete(id);
  cb.closest('tr').classList.toggle('sel',cb.checked);
  const rows=recFiltered();
  const h=document.querySelector('#recbody thead .chk input');
  if(h)h.checked=rows.length>0&&rows.every(r=>RES.selected.has(r.id));
  renderStatusRow();
}
function selectAllVisible(on){
  recFiltered().forEach(r=>on?RES.selected.add(r.id):RES.selected.delete(r.id));
  updateBody();
}
function clearSelection(){RES.selected.clear();updateBody();}
function markSelected(val){reviewIds([...RES.selected],val);}   // reviewIds → render() limpia la selección
function groupView(by,rows){
  const noneLbl=by==='cliente'?'(sin cliente)':'(sin suscripción)';
  const keyOf=r=>(by==='cliente'?(r.cliente||'(sin cliente)'):r.suscripcion)||noneLbl;
  const map=new Map();
  rows.forEach(r=>{
    const key=keyOf(r);
    let g=map.get(key);if(!g){g={key,n:0,rev:0,ids:[],subs:new Set()};map.set(key,g);}
    g.n++;if(r.revisado)g.rev++;g.ids.push(r.id);
    if(r.suscripcion)g.subs.add(r.suscripcion);
  });
  const keyCol=by==='cliente'?'cliente':'suscripcion';
  let groups=[...map.values()].sort((a,b)=>b.n-a.n);   // por defecto: por cantidad desc
  if(STATE.recSort.col===keyCol)  // orden alfabético si se pidió por esa columna
    groups.sort((a,b)=>a.key.localeCompare(b.key,'es',{numeric:true,sensitivity:'base'})*STATE.recSort.dir);
  RES._groups=groups;RES._groupBy=by;
  const hdr2=by==='cliente'?'Suscripciones':'Recursos';
  const trs=groups.map((g,i)=>{
    const pct=Math.round(g.rev/g.n*100);
    const second=by==='cliente'?`<span class="mono">${g.subs.size}</span> susc`
      :`<span class="mono">${g.n}</span> recurso(s)`;
    const cid=by==='cliente'?clienteIdPorNombre(g.key):null;   // clic en el cliente → su vista por cliente
    const keyHtml=cid?`<span class="lnk" onclick="navigate('/clientes/${cid}/comunicados')" title="Ver comunicados de ${esc(g.key)}">${esc(g.key)}</span>`:esc(g.key);
    return `<tr>
      <td class="key">${keyHtml}</td>
      <td>${second}</td>
      <td><div class="cellprog"><div class="track"><div class="fill ${pct===100?'full':''}" style="width:${pct}%"></div></div><span class="mono">${g.rev}/${g.n}</span></div></td>
      <td><div class="acts">
        <button class="btn sm" onclick="drillIdx(${i})">${svg(by==='cliente'?'subscription':'resource')}Ver</button>
        <button class="btn sm" onclick="reviewIdx(${i},true)" ${g.rev===g.n?'disabled':''}>${svg('check')}Revisar</button>
        <button class="btn sm" onclick="reviewIdx(${i},false)" ${g.rev===0?'disabled':''}>Quitar</button>
      </div></td></tr>`;
  }).join('');
  return `<div class="tblwrap"><table><thead><tr>
    ${sortTh(by==='cliente'?'Cliente':'Suscripción',keyCol,'key')}
    <th>${hdr2}</th>
    <th style="width:190px">Revisión</th><th style="width:240px">Acciones</th>
  </tr></thead><tbody>${trs||'<tr><td colspan="4"><div class="empty-state">Sin resultados.</div></td></tr>'}</tbody></table></div>`;
}
function recTable(rows){
  rows=sortRows(rows);
  const allSel=rows.length>0&&rows.every(r=>RES.selected.has(r.id));
  return `<div class="tblwrap"><table>
    <thead><tr><th class="chk"><input type="checkbox" ${allSel?'checked':''} aria-label="Seleccionar todos los recursos visibles" onchange="selectAllVisible(this.checked)"></th>
      ${sortTh('Cliente','cliente','key')}${sortTh('Suscripción','suscripcion','key')}${sortTh('Nombre del Recurso','nombre_recurso','key')}
      <th>Estado</th><th>Gestor</th><th>Añadido</th><th>Revisado por</th></tr></thead>
    <tbody>${rows.map(r=>`<tr class="${r.revisado?'done':''} ${RES.selected.has(r.id)?'sel':''}">
      <td class="chk"><input type="checkbox" ${RES.selected.has(r.id)?'checked':''} aria-label="Seleccionar recurso ${esc(r.nombre_recurso||'')}" onchange="toggleSelect(${r.id},this)"></td>
      <td class="key ${r.cliente?'':'empty'}">${r.cliente?esc(r.cliente):'—'}</td>
      <td class="key ${r.suscripcion?'':'empty'}">${r.suscripcion?esc(r.suscripcion):'—'}</td>
      <td class="key ${r.nombre_recurso?'':'empty'}">${r.nombre_recurso?esc(r.nombre_recurso):'—'}</td>
      <td class="${r.estado?'':'empty'}">${r.estado?esc(r.estado):'—'}</td>
      <td class="${r.gestor?'':'empty'}">${r.gestor?esc(r.gestor):'—'}</td>
      <td class="${r.created_at?'mono':'empty'}" title="${esc(r.created_at?fmtInv(r.created_at)+' · '+invAgo(r.created_at):'')}">${r.created_at?fmtInv(r.created_at):'—'}</td>
      <td class="${r.revisado_por?'':'empty'}">${r.revisado_por?`<span class="stamp" title="Revisado por ${esc(r.revisado_por)}${r.revisado_at?' · '+r.revisado_at.slice(0,10):''}">${svg('check')}<span class="stamp-name">${esc(r.revisado_por)}</span>${r.revisado_at?`<span class="stamp-date">${r.revisado_at.slice(0,10)}</span>`:''}</span>`:'—'}</td>
    </tr>`).join('')||'<tr><td colspan="8"><div class="empty-state">Sin recursos con estos filtros.</div></td></tr>'}</tbody></table></div>`;
}
function drillIdx(i){
  const g=RES._groups[i],by=RES._groupBy;
  if(by==='cliente'){STATE.recCli=[g.key];STATE.recSub=[];STATE.recMode='suscripcion';}   // cliente → sus suscripciones
  else{STATE.recSub=[g.key];STATE.recMode='recurso';}                                     // suscripción → sus recursos
  render();
}
async function reviewIdx(i,val){await reviewIds(RES._groups[i].ids,val);}
async function toggleRev(id,val){
  await api(`/api/recursos/${id}`,{method:'PATCH',body:JSON.stringify({revisado:val})});
  setLocal(RES.rows.find(x=>x.id===id),val);
  await refreshCounts();updateBody();
}
async function reviewIds(ids,val){
  if(!ids.length)return;
  const res=await api('/api/recursos/bulk-review',{method:'POST',body:JSON.stringify({ids,revisado:val})});
  ids.forEach(id=>{const r=RES.rows.find(x=>x.id===id);if(r)setLocal(r,val);});
  await refreshCounts();render();toast(`${res.actualizados} recurso(s) ${val?'revisados':'sin revisar'}.`);
}
function reviewFiltered(val){reviewIds(recFiltered().map(r=>r.id),val);}
async function refreshCounts(){
  [STATE.stats,STATE.comunicados]=await Promise.all([api('/api/stats'),api('/api/comunicados')]);
}
function exportCSV(){
  const cols=['Cliente','Suscripción','Suscripción ID','Grupo de Recurso','Nombre del Recurso','Estado','Gestor','Añadido (inventario)','Revisado','Revisado por','Notas'];
  const q=v=>`"${(v??'').toString().replace(/"/g,'""')}"`;
  const lines=[cols.map(q).join(',')];
  sortRows(recFiltered()).forEach(r=>lines.push([r.cliente,r.suscripcion,r.suscripcion_id,r.grupo_recurso,r.nombre_recurso,r.estado,r.gestor,(r.created_at||'').slice(0,10),r.revisado?'Sí':'No',r.revisado_por,r.notas].map(q).join(',')));
  const blob=new Blob(['﻿'+lines.join('\r\n')],{type:'text/csv;charset=utf-8'});
  const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=`recursos_${RES.cid}.csv`;a.click();
}

// ---------- PÁGINA MIEMBROS (base para el login futuro) ----------
let MIEM={list:[],pendingQ:''};
async function renderMiembros(){
  try{MIEM.list=await api('/api/miembros');}catch(e){$('#content').innerHTML=`<div class="empty-state">Error: ${esc(e.message)}</div>`;return;}
  $('#content').innerHTML=`
    <div class="rechead"><h1 class="page" style="margin:0">Miembros</h1>
      <div class="statstrip"><b>${MIEM.list.length}</b> miembros</div></div>    <div class="toolbar">
      <div class="search search-lg"><span>${svg('search')}</span><input id="miemq" placeholder="Buscar por correo, nombre o apellido…" oninput="renderMiemList()"></div>
      <div class="tb-spacer"></div>
      <div class="tb-actions"><button class="btn primary sm" onclick="openMiemForm()">${svg('add')}Nuevo miembro</button></div>
    </div>
    <div class="tblwrap" style="max-height:none"><table class="clitbl">
      <thead><tr><th>Correo</th><th style="width:200px">Nombre</th><th style="width:200px">Apellido</th><th style="width:88px">Acciones</th></tr></thead>
      <tbody id="miemList"></tbody></table></div>`;
  if(MIEM.pendingQ){const i=$('#miemq');if(i)i.value=MIEM.pendingQ;MIEM.pendingQ='';}
  renderMiemList();
}
function renderMiemList(){
  const q=($('#miemq')?.value||'').toLowerCase();
  const list=MIEM.list.filter(m=>!q||[m.correo,m.nombre,m.apellido].filter(Boolean).join(' ').toLowerCase().includes(q));
  const el=$('#miemList');if(!el)return;
  el.innerHTML=list.map(m=>`<tr>
    <td><div class="member-id"><span class="tbl-avatar">${esc(inicialDe(m))}</span><span>${hl(m.correo,q)}</span></div></td>
    <td class="${m.nombre?'':'empty'}">${m.nombre?hl(m.nombre,q):'—'}</td>
    <td class="${m.apellido?'':'empty'}">${m.apellido?hl(m.apellido,q):'—'}</td>
    <td><div class="acts">
      <button class="btn sm btn-icon" title="Editar miembro" onclick="openMiemForm(${m.id})">${svg('edit')}</button>
      <button class="btn sm btn-icon danger" title="Eliminar miembro" onclick="delMiem(${m.id})">${svg('trash')}</button>
    </div></td></tr>`).join('')||'<tr><td colspan="4"><div class="empty-state">Sin miembros que coincidan.</div></td></tr>';
}
function openMiemForm(id){
  const m=id?MIEM.list.find(x=>x.id===id):null;
  $('#modal').className='modal sm';
  $('#modal').innerHTML=`<div class="mhead"><div><h2>${id?'Editar':'Nuevo'} miembro</h2></div><button class="x" onclick="closeModal()">${svg('close')}</button></div>
    <div class="mbody">
      <div class="field full"><label>Correo</label><input id="m_correo" type="email" autocomplete="off" value="${m?esc(m.correo):''}"></div>
      <div class="field-pair">
        <div class="field"><label>Nombre</label><input id="m_nombre" value="${m?esc(m.nombre||''):''}" ${id?'readonly':''}></div>
        <div class="field"><label>Apellido</label><input id="m_apellido" value="${m?esc(m.apellido||''):''}" ${id?'readonly':''}></div>
      </div>
      ${id?'<div class="caption" style="text-transform:none;margin:-4px 0 4px">El nombre y apellido los edita cada miembro desde su “Mi perfil”.</div>':''}
      <div class="field full"><label>Contraseña ${id?'<span class="caption" style="text-transform:none">(dejar en blanco para mantener la actual)</span>':''}</label>
        <input id="m_pwd" type="password" autocomplete="new-password" placeholder="${id?'••••••••':'Contraseña de acceso'}"></div>
      <div id="formErr" class="formerr hidden"></div>
      <div class="form-foot"><button class="btn" onclick="closeModal()">Cancelar</button>
        <button class="btn primary" onclick="saveMiem(${id||0})">${svg('check')}Guardar</button></div></div>`;
  openModal();setTimeout(()=>$('#m_correo')&&$('#m_correo').focus(),50);
}
async function saveMiem(id){
  const correo=$('#m_correo').value.trim(),nombre=$('#m_nombre').value.trim(),
        apellido=$('#m_apellido').value.trim(),password=$('#m_pwd').value;
  if(!correo){showFormErr('El correo es obligatorio.');return;}
  if(!id&&!password){showFormErr('La contraseña es obligatoria para un miembro nuevo.');return;}
  try{
    if(id)await api('/api/miembros/'+id,{method:'PUT',body:JSON.stringify({correo,nombre,apellido,password})});
    else await api('/api/miembros',{method:'POST',body:JSON.stringify({correo,nombre,apellido,password})});
    MIEM.list=await api('/api/miembros');closeModal();toast(id?'Miembro actualizado.':'Miembro creado.');
  }catch(e){showFormErr(esc(e.message));}
}
async function delMiem(id){
  if(!confirm('¿Eliminar este miembro?'))return;
  try{await api('/api/miembros/'+id,{method:'DELETE'});MIEM.list=await api('/api/miembros');renderMiemList();toast('Miembro eliminado.');}
  catch(e){toast('Error: '+e.message);}
}
function gotoMiembros(term){MIEM.pendingQ=term||'';navigate('/miembros');}

// ---------- PÁGINA CLIENTES (tabla con desplegables) ----------
let CLI={list:[],expanded:new Set()};
async function renderClientes(){
  try{CLI.list=await api('/api/clientes');}catch(e){$('#content').innerHTML=`<div class="empty-state">Error: ${esc(e.message)}</div>`;return;}
  const nsub=CLI.list.reduce((a,c)=>a+c.suscripciones.length,0);
  $('#content').innerHTML=`
    <div class="rechead"><h1 class="page" style="margin:0">Clientes</h1>
      <div class="statstrip"><b>${CLI.list.length}</b> clientes · <b>${nsub}</b> suscripciones</div></div>    <div class="toolbar">
      <div class="search search-lg"><span>${svg('search')}</span><input id="cliq" placeholder="Buscar cliente, suscripción o id…" oninput="renderCliList()"></div>
      <div class="tb-spacer"></div>
      <div class="tb-actions"><button class="btn primary sm" onclick="openCliForm()">${svg('add')}Nuevo cliente</button></div>
    </div>
    <div class="tblwrap" style="max-height:none"><table class="clitbl comtbl">
      <thead><tr><th style="width:34px"></th><th>Cliente</th><th style="width:300px">ID</th><th style="width:88px">Acciones</th></tr></thead>
      <tbody id="cliList"></tbody></table></div>
    <div class="sincli-foot">
      <button class="link-ghost" id="btnSinCli" onclick="toggleSinCliente()">Ver suscripciones sin cliente</button>
      <div id="sinCliBox"></div>
    </div>`;
  SINCLI.open=false;
  if(CLI.pendingQ){const i=$('#cliq');if(i)i.value=CLI.pendingQ;CLI.pendingQ='';}   // filtro traído del buscador global
  renderCliList();
}
let SINCLI={open:false,rows:[]};
async function toggleSinCliente(){
  SINCLI.open=!SINCLI.open;
  const box=$('#sinCliBox'),btn=$('#btnSinCli');
  if(!box)return;
  if(!SINCLI.open){box.innerHTML='';if(btn)btn.textContent='Ver suscripciones sin cliente';return;}
  if(btn)btn.textContent='Ocultar suscripciones sin cliente';
  box.innerHTML='<div class="empty-state" style="padding:var(--sp-4)">Cargando…</div>';
  try{renderSinCli(await api('/api/suscripciones-sin-cliente'));}
  catch(e){box.innerHTML=`<div class="empty-state">Error: ${esc(e.message)}</div>`;}
}
function renderSinCli(l){
  const box=$('#sinCliBox');if(!box)return;
  SINCLI.rows=l;
  if(!l.length){box.innerHTML='<div class="empty-state" style="padding:var(--sp-4)">No hay suscripciones sin cliente. 👌</div>';return;}
  box.innerHTML=`<div class="tblwrap" style="max-height:none;margin-top:8px"><table class="clitbl">
    <thead><tr><th>Suscripción</th><th style="width:300px">ID</th><th style="width:88px">Acciones</th></tr></thead>
    <tbody>${l.map((s,i)=>`<tr>
      <td class="s-name">${svg('subscription','icon')}<span>${esc(s.suscripcion||'(sin nombre)')}</span></td>
      <td class="mono ${s.suscripcion_id?'':'empty'}">${s.suscripcion_id?esc(s.suscripcion_id):'sin id'}</td>
      <td><div class="acts">
        <button class="btn sm btn-icon" title="Editar suscripción" onclick="openSinCliEdit(${i})">${svg('edit')}</button>
        <button class="btn sm btn-icon" title="Asignar a un cliente" onclick="openAsignarCli(${i})">${svg('building')}</button>
      </div></td></tr>`).join('')}</tbody></table></div>`;
}
async function refreshSinCli(){renderSinCli(await api('/api/suscripciones-sin-cliente'));}
function openSinCliEdit(i){
  const s=SINCLI.rows[i];if(!s)return;
  $('#modal').className='modal sm';
  $('#modal').innerHTML=`<div class="mhead"><div><h2>Editar suscripción</h2><div class="sub">Sin cliente asignado</div></div><button class="x" onclick="closeModal()">${svg('close')}</button></div>
    <div class="mbody">
      <div class="field full"><label>Nombre de la suscripción</label><input id="sc_nombre" value="${esc(s.suscripcion||'')}"></div>
      <div class="field full"><label>ID de la suscripción</label><input id="sc_id" class="mono" value="${esc(s.suscripcion_id||'')}"></div>
      <div id="formErr" class="formerr hidden"></div>
      <div class="form-foot"><button class="btn" onclick="closeModal()">Cancelar</button>
        <button class="btn primary" onclick="doSinCliEdit(${i})">${svg('check')}Guardar</button></div></div>`;
  openModal();setTimeout(()=>$('#sc_nombre')&&$('#sc_nombre').focus(),50);
}
async function doSinCliEdit(i){
  const s=SINCLI.rows[i];if(!s)return;
  const nombre=$('#sc_nombre').value.trim(),sub_id=$('#sc_id').value.trim();
  if(!nombre&&!sub_id){showFormErr('Ingresa el nombre o el id.');return;}
  try{
    const r=await api('/api/suscripciones-sin-cliente',{method:'PUT',body:JSON.stringify(
      {suscripcion:s.suscripcion||'',suscripcion_id:s.suscripcion_id||'',nuevo_nombre:nombre,nuevo_id:sub_id})});
    closeModal();await refreshCli();await refreshSinCli();
    toast('Suscripción actualizada'+(r.recursos_asignados?` · ${r.recursos_asignados} recurso(s) asignados a cliente`:'')+'.');
  }catch(e){showFormErr(esc(e.message));}
}
function openAsignarCli(i){
  const s=SINCLI.rows[i];if(!s)return;
  const opts=CLI.list.map(c=>`<option value="${c.id}">${esc(c.nombre)}</option>`).join('');
  $('#modal').className='modal sm';
  $('#modal').innerHTML=`<div class="mhead"><div><h2>Asignar cliente</h2><div class="sub">${esc(s.suscripcion||s.suscripcion_id||'(sin nombre)')}</div></div><button class="x" onclick="closeModal()">${svg('close')}</button></div>
    <div class="mbody">
      <div class="field full"><label>Cliente</label>
        <select id="asig_cli" onchange="document.getElementById('asig_new_wrap').classList.toggle('hidden',this.value!=='__new__')">
          <option value="">Selecciona un cliente</option>
          ${opts}
          <option value="__new__">➕ Nuevo cliente…</option>
        </select></div>
      <div class="field full hidden" id="asig_new_wrap"><label>Nombre del nuevo cliente</label><input id="asig_new"></div>
      <div id="formErr" class="formerr hidden"></div>
      <div class="form-foot"><button class="btn" onclick="closeModal()">Cancelar</button>
        <button class="btn primary" onclick="doAsignar(${i})">${svg('check')}Asignar</button></div></div>`;
  openModal();setTimeout(()=>$('#asig_cli')&&$('#asig_cli').focus(),50);
}
async function doAsignar(i){
  const s=SINCLI.rows[i];if(!s)return;
  const sel=$('#asig_cli').value;
  if(!sel){showFormErr('Selecciona un cliente.');return;}
  try{
    let cid;
    if(sel==='__new__'){
      const nombre=$('#asig_new').value.trim();
      if(!nombre){showFormErr('Escribe el nombre del nuevo cliente.');return;}
      cid=(await api('/api/clientes',{method:'POST',body:JSON.stringify({nombre})})).id;
    }else cid=+sel;
    const r=await api(`/api/clientes/${cid}/suscripciones`,{method:'POST',
      body:JSON.stringify({nombre:s.suscripcion||'',sub_id:s.suscripcion_id||''})});
    closeModal();await refreshCli();await refreshSinCli();
    toast('Suscripción asignada'+(r.recursos_asociados?` · ${r.recursos_asociados} recurso(s) asociados`:'')+'.');
  }catch(e){showFormErr(esc(e.message));}
}
function renderCliList(){
  const q=($('#cliq')?.value||'').toLowerCase();
  const list=CLI.list.filter(c=>!q||c.nombre.toLowerCase().includes(q)||c.suscripciones.some(s=>(s.nombre||'').toLowerCase().includes(q)||(s.sub_id||'').toLowerCase().includes(q)));
  const el=$('#cliList');if(!el)return;
  el.innerHTML=list.map(c=>cliRow(c,q)).join('')||'<tr><td colspan="4"><div class="empty-state">Sin clientes que coincidan.</div></td></tr>';
}
let CLIDET={id:null,cliente:null,comunicados:[],ok:false};
async function loadCliComs(id){
  try{const d=await api(`/api/clientes/${id}/comunicados`);
    CLIDET={id,cliente:d.cliente,comunicados:d.comunicados||[],ok:d.cliente!=null};
  }catch(e){CLIDET={id,cliente:null,comunicados:[],ok:false};toast('Error: '+e.message);}
}
function openCliComs(id){navigate('/clientes/'+id+'/comunicados');}   // vista aparte al hacer clic en el nombre
function renderCliComs(){
  const d=CLIDET,coms=d.comunicados||[];
  const rows=coms.map(m=>{
    const cl=dueClass(m.fecha_limite);
    const due=m.fecha_limite
      ?`<span class="status ${cl==='--danger'?'status--danger':cl==='--warn'?'status--warn':'status--ok'}">${svg('clock')}${fmtFechaLarga(m.fecha_limite)}</span>`
      :'<span class="caption">—</span>';
    return `<tr class="clicom-row" onclick="openRecursos(${m.id})" title="Ver detalle del comunicado">
     <td class="mono">#${esc(m.id)}</td>
     <td class="cc-title"><b class="comlink">${esc(m.titulo||'(sin título)')}</b>${m.es_global?` <span class="tag-all" title="Afecta a todas las suscripciones">Todo Azure</span>`:''}</td>
     <td>${m.categoria?catBadge(m.categoria):'<span class="caption">—</span>'}</td>
     <td>${due}</td>
   </tr>`;}).join('');
  $('#content').innerHTML=`
    <button class="back-link" onclick="navigate('/clientes')"><span style="transform:rotate(180deg);display:inline-flex">${svg('chev','icon')}</span>Clientes</button>
    <div class="rechead"><h1 class="page" style="margin:0">${esc(d.cliente||'Cliente')}</h1>
      <div class="statstrip"><b>${coms.length}</b> comunicado${coms.length===1?'':'s'} que le afecta${coms.length===1?'':'n'}</div></div>    ${coms.length?`<div class="tblwrap" style="max-height:none;margin-top:var(--sp-3)"><table class="comtbl cli-coms-tbl">
      <thead><tr><th style="width:56px">N°</th><th>Comunicado</th><th style="width:210px">Categoría</th><th style="width:200px">Fecha límite</th></tr></thead>
      <tbody>${rows}</tbody></table></div>`
     :'<div class="empty-state">Ningún comunicado le afecta todavía.</div>'}`;
}
function cliRow(c,q){
  const open=q?true:CLI.expanded.has(c.id);   // al buscar, se expande para ver coincidencias
  const subRows=c.suscripciones.map(s=>`<tr>
      <td class="s-name">${svg('subscription','icon')}<span>${esc(s.nombre||'(sin nombre)')}</span></td>
      <td class="mono ${s.sub_id?'':'empty'}">${s.sub_id?esc(s.sub_id):'sin id'}</td>
      <td><div class="acts">
        <button class="btn-icon-ghost" title="Editar suscripción" onclick="openSubForm(${s.id})">${svg('edit')}</button>
        <button class="btn-icon-ghost danger" title="Quitar suscripción" onclick="delSub(${s.id})">${svg('close')}</button>
      </div></td></tr>`).join('');
  const detail=!open?'':`<tr class="clidetail"><td></td><td colspan="3">
    <table class="subtbl"><thead><tr><th>Suscripción</th><th>ID</th><th style="width:74px"></th></tr></thead>
      <tbody>
        ${subRows||'<tr><td colspan="3" class="caption" style="padding:8px 4px">Sin suscripciones aún.</td></tr>'}
        <tr class="subadd">
          <td><input id="sn_${c.id}" placeholder="Nombre de suscripción"></td>
          <td><input id="si_${c.id}" class="mono" placeholder="ID de la suscripción"></td>
          <td><button class="btn sm" onclick="addSub(${c.id})">${svg('add')}Agregar</button></td>
        </tr>
      </tbody></table></td></tr>`;
  const nsub=c.suscripciones.length;
  return `<tr class="clirow ${open?'open':''}" style="cursor:pointer" title="Ver comunicados que le afectan" onclick="if(!event.target.closest('.acts')&&!event.target.closest('.chev-cell'))openCliComs(${c.id})">
    <td class="chev-cell" title="Ver/ocultar suscripciones" onclick="event.stopPropagation();toggleCli(${c.id})"><span class="chev-ic">${svg('chev','icon')}</span></td>
    <td class="ctitle"><b class="comlink">${hl(c.nombre,q)}</b><div class="caption" style="text-transform:none">${nsub} ${nsub===1?'suscripción':'suscripciones'}</div></td>
    <td class="mono ${c.ext_id?'':'empty'}">${c.ext_id?esc(c.ext_id):'—'}</td>
    <td><div class="acts">
      <button class="btn sm btn-icon" title="Editar cliente" onclick="openCliForm(${c.id})">${svg('edit')}</button>
      <button class="btn sm btn-icon danger" title="Eliminar cliente" onclick="delCli(${c.id})">${svg('trash')}</button>
    </div></td></tr>${detail}`;
}
function toggleCli(id){CLI.expanded.has(id)?CLI.expanded.delete(id):CLI.expanded.add(id);renderCliList();}
async function refreshCli(){CLI.list=await api('/api/clientes');renderCliList();}
async function addSub(cid){
  const nombre=$('#sn_'+cid).value.trim(),sub_id=$('#si_'+cid).value.trim();
  if(!nombre&&!sub_id){toast('Ingresa el nombre o el id de la suscripción.');return;}
  try{const r=await api(`/api/clientes/${cid}/suscripciones`,{method:'POST',body:JSON.stringify({nombre,sub_id})});
    CLI.expanded.add(cid);await refreshCli();toast('Suscripción agregada'+(r.recursos_asociados?` · ${r.recursos_asociados} recursos asociados`:'')+'.');
  }catch(e){toast('Error: '+e.message);}
}
async function delSub(sid){if(!confirm('¿Quitar esta suscripción del cliente?'))return;
  try{await api('/api/suscripciones/'+sid,{method:'DELETE'});await refreshCli();toast('Suscripción quitada.');}catch(e){toast('Error: '+e.message);}}
async function delCli(cid){if(!confirm('¿Eliminar este cliente y todas sus suscripciones?'))return;
  try{await api('/api/clientes/'+cid,{method:'DELETE'});await refreshCli();toast('Cliente eliminado.');}catch(e){toast('Error: '+e.message);}}
function openCliForm(id){
  const c=id?CLI.list.find(x=>x.id===id):null;
  $('#modal').className='modal sm';
  $('#modal').innerHTML=`<div class="mhead"><div><h2>${id?'Editar':'Nuevo'} cliente</h2></div><button class="x" onclick="closeModal()">${svg('close')}</button></div>
    <div class="mbody">
      <div class="field full"><label>Nombre del cliente</label><input id="cli_nombre" value="${c?esc(c.nombre):''}"></div>
      <div class="field full"><label>ID del cliente (tenant)</label><input id="cli_ext" class="mono" value="${c?esc(c.ext_id||''):''}"></div>
      <div id="formErr" class="formerr hidden"></div>
      <div class="form-foot"><button class="btn" onclick="closeModal()">Cancelar</button>
        <button class="btn primary" onclick="saveCli(${id||0})">${svg('check')}Guardar</button></div></div>`;
  openModal();setTimeout(()=>$('#cli_nombre')&&$('#cli_nombre').focus(),50);
}
async function saveCli(id){
  const nombre=$('#cli_nombre').value.trim(),ext_id=$('#cli_ext').value.trim();
  if(!nombre){showFormErr('El nombre es obligatorio.');return;}
  try{
    if(id)await api('/api/clientes/'+id,{method:'PUT',body:JSON.stringify({nombre,ext_id})});
    else await api('/api/clientes',{method:'POST',body:JSON.stringify({nombre,ext_id})});
    closeModal();toast(id?'Cliente actualizado.':'Cliente creado.');
  }catch(e){showFormErr(esc(e.message));}
}
function openSubForm(sid){
  let sub=null,cli=null;
  for(const c of CLI.list){const s=c.suscripciones.find(x=>x.id===sid);if(s){sub=s;cli=c;break;}}
  if(!sub)return;
  $('#modal').className='modal sm';
  $('#modal').innerHTML=`<div class="mhead"><div><h2>Editar suscripción</h2><div class="sub">Cliente: ${esc(cli.nombre)}</div></div><button class="x" onclick="closeModal()">${svg('close')}</button></div>
    <div class="mbody">
      <div class="field full"><label>Nombre de la suscripción</label><input id="sub_nombre" value="${esc(sub.nombre||'')}"></div>
      <div class="field full"><label>ID de la suscripción</label><input id="sub_id" class="mono" value="${esc(sub.sub_id||'')}"></div>
      <div id="formErr" class="formerr hidden"></div>
      <div class="form-foot"><button class="btn" onclick="closeModal()">Cancelar</button>
        <button class="btn primary" onclick="saveSub(${sid},${cli.id})">${svg('check')}Guardar</button></div></div>`;
  openModal();setTimeout(()=>$('#sub_nombre')&&$('#sub_nombre').focus(),50);
}
async function saveSub(sid,cid){
  const nombre=$('#sub_nombre').value.trim(),sub_id=$('#sub_id').value.trim();
  if(!nombre&&!sub_id){showFormErr('Ingresa el nombre o el id.');return;}
  try{const r=await api('/api/suscripciones/'+sid,{method:'PUT',body:JSON.stringify({nombre,sub_id})});
    CLI.expanded.add(cid);closeModal();toast('Suscripción actualizada'+(r.recursos_asociados?` · ${r.recursos_asociados} recursos asociados`:'')+'.');
  }catch(e){showFormErr(esc(e.message));}
}

// ---------- FORM comunicado ----------
const CATS=["Compute","Almacenamiento","Redes","Bases de datos","Datos y Analítica",
 "Contenedores","Seguridad e Identidad","Gobernanza y Monitoreo","FinOps y Reservas","Otros"];
function fuenteRow(val=''){
  return `<div class="link-row"><input class="fuente-link" type="url" placeholder="https://…" value="${esc(val)}">
    <button type="button" class="btn-icon-ghost danger" title="Quitar link" onclick="this.closest('.link-row').remove()">${svg('close')}</button></div>`;
}
function addFuenteLink(val){$('#fuenteLinks')?.insertAdjacentHTML('beforeend',fuenteRow(typeof val==='string'?val:''));}
function getFuente(){return [...document.querySelectorAll('#fuenteLinks .fuente-link')].map(i=>i.value.trim()).filter(Boolean).join('\n');}
const F=[['titulo','Título *'],['categoria','Categoría'],['fecha_recepcion','Fecha recepción'],
 ['fecha_limite','Fecha límite'],['responsable','Responsable'],['fuente','Fuente oficial'],
 ['resumen','Resumen'],['observaciones','Observaciones']];
async function openForm(id){
  let c={};if(id){c=await api('/api/comunicados/'+id);}
  const cur=id?STATE.comunicados.find(x=>x.id===id):null;
  const nRes=cur?cur.n_recursos:0;
  const f=(k,l)=>{
    if(k==='titulo')return '';   // el título va en la cabecera (editable)
    if(k==='categoria'){
      const val=c[k]||'';
      const opts=CATS;
      const extra=val&&!opts.includes(val)?`<option value="${esc(val)}" selected>${esc(val)}</option>`:'';
      return `<div class="field"><label>${l}</label><select id="f_${k}">
        <option value="">Selecciona</option>${extra}
        ${opts.map(x=>`<option ${x===val?'selected':''}>${esc(x)}</option>`).join('')}</select></div>`;
    }
    if(k==='responsable'){   // selector de miembros (el nombre completo se guarda como responsable)
      const val=c[k]||'';
      const opts=[...new Set((MIEM.list||[])
        .map(m=>`${m.nombre||''} ${m.apellido||''}`.trim()||m.correo).filter(Boolean))]
        .sort((a,b)=>a.localeCompare(b,'es'));
      const extra=val&&!opts.includes(val)?`<option value="${esc(val)}" selected>${esc(val)}</option>`:'';
      return `<div class="field"><label>${l}</label><select id="f_${k}">
        <option value="">Selecciona</option>${extra}
        ${opts.map(x=>`<option ${x===val?'selected':''}>${esc(x)}</option>`).join('')}</select></div>`;
    }
    if(k==='fuente'){
      const links=(c[k]||'').split(/\r?\n/).map(s=>s.trim()).filter(Boolean);
      const rows=(links.length?links:['']).map(fuenteRow).join('');
      return `<div class="field full"><label>${l}</label>
        <div id="fuenteLinks" class="link-list">${rows}</div>
        <button type="button" class="btn sm" style="align-self:flex-start;margin-top:6px" onclick="addFuenteLink()">${svg('add')}Añadir link</button></div>`;
    }
    const long=['resumen','observaciones'].includes(k);const date=k.startsWith('fecha');
    const cls=k==='resumen'?' class="bigtext"':k==='observaciones'?' class="medtext"':'';
    return `<div class="field ${long?'full':''}"><label>${l}</label>${long?`<textarea id="f_${k}"${cls}>${esc(c[k]||'')}</textarea>`:`<input id="f_${k}" ${date?'type="date"':''} value="${esc(c[k]||'')}">`}</div>`;};
  $('#modal').className='modal md';
  $('#modal').innerHTML=`<div class="mhead">
      <div style="flex:1;min-width:0">
        <input id="f_titulo" class="title-edit" placeholder="Nombre del comunicado" value="${esc(c.titulo||'')}">
        ${id?`<div class="sub">#${id} · editar comunicado</div>`:''}
      </div>
      <button class="x" onclick="closeModal()">${svg('close')}</button></div>
    <div class="mbody">
      <div class="form-2col">
        <div class="col">
          <div class="form-section">Datos del comunicado</div>
          ${f('categoria','Categoría')}
          ${f('responsable','Responsable')}
          <div class="field-pair">${f('fecha_recepcion','Fecha recepción')}${f('fecha_limite','Fecha límite')}</div>
          ${f('fuente','Fuente oficial')}
          <div class="afecta-row" title="Aplica a todas las suscripciones de todos los clientes">
            <span>Afecta a todo Azure</span>
            <label class="switch"><input type="checkbox" id="f_afecta_todas" ${c.afecta_todas?'checked':''}><span class="track"></span><span class="thumb"></span></label>
          </div>
        </div>
        <div class="col">
          <div class="form-section">Descripción</div>
          ${f('resumen','Resumen')}
          ${f('observaciones','Observaciones')}
        </div>
      </div>
      <div id="formErr" class="formerr hidden"></div>
      <div class="form-foot"><button class="btn" onclick="closeModal()">Cancelar</button>
        <button class="btn primary" id="saveBtn" onclick="saveCom(${id||0})">${svg('check')}${id?'Guardar cambios':'Crear comunicado'}</button></div>
    </div>`;
  openModal();setTimeout(()=>$('#f_titulo')&&$('#f_titulo').focus(),50);
}
function showFormErr(m){const e=$('#formErr');if(e){e.innerHTML=m;e.classList.remove('hidden');}else toast(m);}
// ---- Nuevo inventario (lote): solo archivo (subir/arrastrar) + KQL (nuevo o existente) ----
function openInvForm(cid){
  const c=RES.com||{};
  const invsKql=(RES.invs||[]).filter(i=>i.kql&&i.kql.trim());
  const opts=invsKql.map(i=>`<option value="${i.id}">${esc(fmtInv(i.fecha))} · ${i.n_recursos} rec</option>`).join('');
  $('#modal').className='modal md';
  $('#modal').innerHTML=`
    <div class="mhead"><div><h2>Nuevo inventario</h2><div class="sub">#${esc(cid)} · ${esc(c.titulo||'')}</div></div><button class="x" onclick="closeModal()">${svg('close')}</button></div>
    <div class="mbody">
      <div class="inv-2col">
        <div class="col">
          <label class="field-lbl">Archivo — Excel (.xlsx) o CSV *</label>
          <label class="dropzone" id="iv_drop">
            <input type="file" id="iv_file" accept=".csv,.xlsx,.xlsm" hidden>
            <div class="dz-inner">
              ${svg('export','dz-icon')}
              <div class="dz-title" id="iv_dzname">Arrastra el archivo aquí o haz clic para elegir</div>
              <div class="dz-sub">.xlsx · .csv</div>
            </div>
          </label>
          <div class="upload-note">Debe incluir columnas para
            <b style="color:var(--accent)">Suscripción</b>, <b style="color:var(--accent)">Grupo de Recurso (RG)</b> y
            <b style="color:var(--accent)">Nombre del Recurso</b>. Al guardar se crea un <b>lote nuevo</b> y se cargan las tablas.
            <a onclick="downloadTemplate()">Descargar plantilla CSV</a>.</div>
        </div>
        <div class="col">
          <label class="field-lbl">Query KQL de este lote</label>
          <div class="seg-choice">
            <label><input type="radio" name="iv_kqlmode" value="nuevo" checked onchange="ivKqlMode('nuevo')"> Agregar otro KQL</label>
            <label${invsKql.length?'':' style="opacity:.5"'}><input type="radio" name="iv_kqlmode" value="existente" ${invsKql.length?'':'disabled'} onchange="ivKqlMode('existente')"> Usar existente</label>
          </div>
          <select id="iv_kqlsel" hidden onchange="ivKqlPick()">${opts}</select>
          <textarea id="iv_kql" class="mono iv-kql-ta" placeholder="Resources&#10;| where type =~ 'microsoft.compute/virtualmachines'&#10;| project subscriptionId, resourceGroup, name"></textarea>
        </div>
      </div>
      <div id="ivErr" class="formerr hidden"></div>
      <div class="form-foot"><button class="btn" onclick="closeModal()">Cancelar</button>
        <button class="btn primary" id="ivSave" onclick="saveInvNew(${cid})">${svg('check')}Guardar</button></div>
    </div>`;
  openModal();
  // Drag & drop: resaltar la zona y reflejar el nombre del archivo elegido.
  const dz=$('#iv_drop'), fi=$('#iv_file');
  const showName=()=>{const f=fi.files[0];$('#iv_dzname').textContent=f?f.name:'Arrastra el archivo aquí o haz clic para elegir';dz.classList.toggle('has-file',!!f);};
  fi.onchange=showName;
  ['dragenter','dragover'].forEach(ev=>dz.addEventListener(ev,e=>{e.preventDefault();dz.classList.add('drag');}));
  ['dragleave','drop'].forEach(ev=>dz.addEventListener(ev,e=>{e.preventDefault();dz.classList.remove('drag');}));
  dz.addEventListener('drop',e=>{if(e.dataTransfer.files&&e.dataTransfer.files.length){fi.files=e.dataTransfer.files;showName();}});
}
function ivKqlMode(mode){
  const sel=$('#iv_kqlsel'), ta=$('#iv_kql');
  if(mode==='existente'){ sel.hidden=false; ta.readOnly=true; ivKqlPick(); }
  else{ sel.hidden=true; ta.readOnly=false; }
}
function ivKqlPick(){
  const sel=$('#iv_kqlsel'); if(!sel)return;
  const inv=(RES.invs||[]).find(i=>String(i.id)===String(sel.value));
  $('#iv_kql').value=(inv&&inv.kql)||'';
}
function ivFormErr(m){const e=$('#ivErr');if(e){e.innerHTML=m;e.classList.remove('hidden');}else toast(m);}
async function saveInvNew(cid){
  const file=$('#iv_file').files[0];
  if(!file){ivFormErr('Debes seleccionar un archivo .xlsx o .csv.');return;}
  const kql=$('#iv_kql').value||'';
  const btn=$('#ivSave');btn.disabled=true;
  try{
    const ext=(file.name.split('.').pop()||'').toLowerCase();
    const buf=await file.arrayBuffer();
    const qs=[]; if(kql.trim())qs.push('kql='+encodeURIComponent(kql));
    const r=await fetch(`/api/comunicados/${cid}/import`+(qs.length?'?'+qs.join('&'):''),{method:'POST',headers:{'X-Ext':ext},body:buf});
    const j=await r.json();
    if(!r.ok){ivFormErr('El archivo fue <b>rechazado</b>:<br>'+esc(j.error));btn.disabled=false;return;}
    await loadRecursos(cid);await refreshCounts();
    if(j.inventario_id)STATE.recInv=j.inventario_id;   // selecciona el lote recién creado
    closeModal();
    toast(`Inventario agregado · ${j.importados} recurso(s) en un nuevo lote.`);
  }catch(e){ivFormErr('Error: '+esc(e.message));btn.disabled=false;}
}
function downloadTemplate(){
  const csv='Suscripcion,Grupo de Recurso,Nombre del Recurso,Estado,Gestor\nMi-Suscripcion-Prod,RG-ejemplo,vm-ejemplo-01,Pendiente,Nombre Gestor\n';
  const blob=new Blob(['﻿'+csv],{type:'text/csv;charset=utf-8'});
  const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='plantilla_recursos.csv';a.click();
}
async function saveCom(id){
  const data={};F.forEach(x=>{if(x[0]==='fuente')return;const el=$('#f_'+x[0]);if(el)data[x[0]]=el.value.trim();});
  data.fuente=getFuente();
  data.afecta_todas=$('#f_afecta_todas')?.checked?1:0;
  if(!data.titulo){showFormErr('El título (nombre del comunicado) es obligatorio.');return;}
  const btn=$('#saveBtn');btn.disabled=true;
  try{
    let cid=id;
    if(id) await api('/api/comunicados/'+id,{method:'PUT',body:JSON.stringify(data)});
    else cid=(await api('/api/comunicados',{method:'POST',body:JSON.stringify(data)})).id;
    await loadAll();
    closeModal();
    if(!id){                                   // nuevo → entra al comunicado para cargar el inventario ahí
      navigate('/comunicados/'+cid+'/recursos');
      toast('Comunicado creado. Agrega un inventario para cargar sus recursos.');
      return;
    }
    if(STATE.view==='recursos'&&RES.cid===cid)await loadRecursos(cid);
    render();
    toast('Comunicado actualizado.');
  }catch(e){showFormErr('Error: '+esc(e.message));btn.disabled=false;}
}
async function delCom(id){
  if(!confirm('¿Eliminar este comunicado y todos sus recursos? Esta acción no se puede deshacer.'))return;
  await api('/api/comunicados/'+id,{method:'DELETE'});
  await loadAll();
  if(STATE.view==='recursos'&&RES.cid===id)navigate('/comunicados');else render();
  toast('Comunicado eliminado.');
}
// Archivar (val=1) o restaurar (val=0). Reversible, sin confirmación.
async function archiveCom(id,val){
  await api('/api/comunicados/'+id,{method:'PUT',body:JSON.stringify({archivado:val?1:0})});
  await loadAll();
  if(STATE.view==='recursos'&&RES.cid===id&&val)navigate('/comunicados');else render();
  toast(val?'Comunicado archivado.':'Comunicado restaurado.');
}

// ---------- modal helpers ----------
function openModal(){$('#overlay').classList.add('open');document.body.style.overflow='hidden';}
function closeModal(){$('#overlay').classList.remove('open');document.body.style.overflow='';render();}
$('#overlay').addEventListener('click',e=>{if(e.target.id==='overlay')closeModal();});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&$('#overlay').classList.contains('open'))closeModal();});
document.addEventListener('keydown',e=>{
  const t=e.target;
  if((e.key==='Enter'||e.key===' ')&&t.classList&&t.classList.contains('kpi')&&t.classList.contains('clickable')){e.preventDefault();t.click();}
});

// ---------- init ----------
// Arranque: login obligatorio. Sin sesión no se carga nada de la plataforma.
async function boot(){
  let me=null;
  try{ me=(await api('/api/me')).miembro; }
  catch(e){ $('#content').innerHTML=`<div class="empty-state">No se pudo conectar al servidor.<br>Ejecuta <b>python app.py</b> y abre <b>http://localhost:8765</b>.<br><br>${esc(e.message)}</div>`; return; }
  STATE.me=me||null;
  if(!STATE.me){ showLoginGate(); return; }
  document.body.classList.remove('locked');
  try{ await loadAll(); }
  catch(e){ $('#content').innerHTML=`<div class="empty-state">No se pudo cargar la plataforma.<br><br>${esc(e.message)}</div>`; return; }
  updateNavProfile();
  route();
}
boot();
