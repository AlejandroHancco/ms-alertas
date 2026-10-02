// Buscador global (comunicados, clientes, suscripciones, miembros) y cierre de popovers.

// ---------- buscador global estilo Azure (objetos: cliente, encargado, comunicado…) ----------
const GS={items:[],active:-1,open:false};
function gsSources(q){
  const ql=q.toLowerCase(),out=[];
  // Comunicados (por título, resumen o categoría)
  const qn=ql.replace(/^#/,'').trim();   // permite buscar por "#5" o "5" (número de comunicado)
  STATE.comunicados.forEach(c=>{
    const byText=[c.titulo,c.resumen,c.categoria].filter(Boolean).join(' ').toLowerCase().includes(ql);
    const byId=/^\d+$/.test(qn)&&String(c.id).includes(qn);
    if(byText||byId)
      out.push({type:'Comunicado',icon:'notice',name:`#${c.id} · ${c.titulo||'(sin título)'}`,
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
