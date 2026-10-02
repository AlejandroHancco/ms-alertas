// Detalle de un comunicado: recursos afectados, lotes (inventarios), revisión y exportación.

// ---------- PÁGINA RECURSOS ----------
let RES={cid:null,rows:[],com:null,_groups:[],_groupBy:'',selected:new Set(),selGroups:new Set(),invKqlOpen:null};
// Nombre del usuario logueado para el sello de "revisado por" (optimista; el servidor lo re-sella).
function meName(){const m=STATE.me||{};return `${m.nombre||''} ${m.apellido||''}`.trim()||m.correo||'usuario';}
function openRecursos(cid){navigate('/comunicados/'+cid+'/recursos');}  // navega al endpoint
async function loadRecursos(cid){
  RES.cid=cid;RES.com=STATE.comunicados.find(c=>c.id===cid);
  if(!RES.com){RES.rows=[];RES.invs=[];return;}
  RES.rows=await api(`/api/comunicados/${cid}/recursos`);
  try{RES.invs=await api(`/api/comunicados/${cid}/inventarios`);}
  catch(e){RES.invs=[];}   // servidor antiguo sin la ruta: no rompas la página
  RES.invKqlOpen=null;
  STATE.recMode='cliente';
  STATE.recQ='';STATE.recCli=[];STATE.recSub=[];STATE.recRG='';STATE.recRev='';
  STATE.recFiltersOpen=false;STATE.recFilterTab='cliente';STATE.recFilterQ='';
  // Siempre debe haber un lote de inventario seleccionado: por defecto el más reciente.
  STATE.recInv=(RES.invs&&RES.invs.length)?RES.invs[0].id:'';
}
function backToComunicados(){navigate('/comunicados');}
// 'Afecta a todo Azure': trae 1 fila por cada cliente del roster para revisarlos.
async function syncTodoAzure(cid){
  try{
    const j=await api(`/api/comunicados/${cid}/sync-todo-azure`,{method:'POST',body:'{}'});
    await loadRecursos(cid);await refreshCounts();render();
    toast(j.creados?`${j.creados} cliente(s) agregados.`:'Ya estaban todos los clientes.');
  }catch(e){toast('Error: '+e.message);}
}
function setRecMode(m){STATE.recMode=m;render();}
function setLocal(r,val){r.revisado=val?1:0;r.revisado_por=val?meName():null;r.revisado_at=val?new Date().toISOString():null;}
function recStructural(){  // filtro por cliente + suscripción + RG (base para conteos)
  return RES.rows.filter(r=>{
    if(!(r.cliente||'').trim()||!(r.suscripcion||'').trim())return false;   // ocultar recursos sin cliente/suscripción
    if(STATE.recInv&&String(r.inventario_id)!==String(STATE.recInv))return false;
    if(STATE.recCli.length&&!STATE.recCli.includes(r.cliente))return false;
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
function setRecRev(v){STATE.recRev=v;RES.selected.clear();RES.selGroups.clear();updateBody();const el=$('#fpRecEsts');if(el)el.innerHTML=recEstadoHTML();updateRecFiltrarBadge();}
function setSort(col){
  const s=STATE.recSort;
  if(s.col===col)s.dir*=-1;else{s.col=col;s.dir=1;}
  RES.selected.clear();RES.selGroups.clear();updateBody();
}
function sortArrow(col){return STATE.recSort.col===col?`<span class="sarrow">${STATE.recSort.dir>0?'▲':'▼'}</span>`:'';}
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
  if(tab==='cliente') return [...new Set(RES.rows.map(r=>r.cliente).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'es'));
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
  RES.selected=new Set();RES.selGroups=new Set();   // la selección no sobrevive a un re-render de filtros/modo
  const c=RES.com;
  // Descarta selecciones de suscripción que ya no tienen cliente asignado.
  const subsConCliente=new Set(RES.rows.filter(r=>(r.cliente||'').trim()).map(r=>r.suscripcion).filter(Boolean));
  STATE.recSub=STATE.recSub.filter(s=>subsConCliente.has(s));
  // Conteos, % y estado SIEMPRE del último lote (los anteriores son solo historial), con cliente+suscripción.
  const lastInv=(RES.invs&&RES.invs.length)?RES.invs[0].id:null;
  const loteRows=lastInv?RES.rows.filter(r=>String(r.inventario_id)===String(lastInv)):[];
  const vis=loteRows.filter(r=>(r.cliente||'').trim()&&(r.suscripcion||'').trim());
  const clientesAll=[...new Set(vis.map(r=>r.cliente))];
  const subsAll=[...new Set(vis.map(r=>r.suscripcion))];
  const pctTot=Math.round(vis.filter(r=>r.revisado).length/(vis.length||1)*100);
  const completo=vis.length>0&&pctTot>=100;
  const pc=completo?'ok':pctTot>=50?'warn':'danger';
  $('#content').innerHTML=`
    <button class="back-link" onclick="backToComunicados()"><span style="transform:rotate(180deg);display:inline-flex">${svg('chev','icon')}</span>Comunicados</button>
    <div class="rechead">
      <h1 class="page" style="margin:0"><span class="com-num">#${esc(c.id)}</span> ${esc(c.titulo)}${c.archivado?` <span class="tag-arch">Archivado</span>`:''}</h1>
      <div class="statstrip"><b>${clientesAll.length}</b> clientes · <b>${subsAll.length}</b> suscripciones · <b>${vis.length}</b> recursos · <span class="status status--${pc}">${completo?'Completo · 100%':pctTot+'% revisado'}</span></div>
      <div class="rechead-acts">
        ${c.afecta_todas?`<button class="btn sm" title="Traer los clientes nuevos del roster (1 fila por cliente)" onclick="syncTodoAzure(${c.id})">${svg('add')}Sincronizar clientes</button>`:''}
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
  $('#recq').oninput=e=>{STATE.recQ=e.target.value;RES.selected.clear();RES.selGroups.clear();updateBody();};
  // Popover de filtro: buscador (rebuild solo de la lista) + checks (multi-selección, delegado)
  const fpq=$('#fpRecSearch');
  if(fpq)fpq.oninput=e=>{STATE.recFilterQ=e.target.value;const l=$('#fpRecList');if(l)l.innerHTML=recFilterListHTML();};
  const fpl=$('#fpRecList');
  if(fpl)fpl.addEventListener('change',e=>{
    const cb=e.target.closest('input[type=checkbox]');if(!cb)return;
    const arr=STATE.recFilterTab==='cliente'?STATE.recCli:STATE.recSub, i=arr.indexOf(cb.dataset.val);
    if(cb.checked){if(i<0)arr.push(cb.dataset.val);}else if(i>=0)arr.splice(i,1);
    RES.selected.clear();RES.selGroups.clear();updateBody();updateRecFiltrarBadge();
  });
  updateBody();
}
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
function openInvKql(id){RES.invKqlOpen=id;renderInvKqlModal();openModal();}
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
function copyInv(id){
  const inv=RES.invs.find(x=>x.id===id);const t=(inv&&inv.kql)||'';
  navigator.clipboard?.writeText(t).then(()=>toast('Query copiado.'),()=>toast('No se pudo copiar.'));
}
function updateBody(){
  const rows=recFiltered();
  $('#recbody').innerHTML=STATE.recMode==='recurso'?recTable(rows):groupView(STATE.recMode,rows);
  renderStatusRow();
}
function renderStatusRow(){
  const el=$('#statusRow');if(!el)return;
  const grouped=STATE.recMode!=='recurso';
  if(grouped){
    const n=RES.selGroups.size, unit=STATE.recMode==='cliente'?'cliente':'suscripción';
    if(n>0){
      el.className='status-row selbar';
      el.innerHTML=`<div class="sel-info"><b>${n}</b> ${unit}${n>1?'s':''} seleccionado${n>1?'s':''}</div>
        <div class="sel-acts">
          <button class="btn sm" onclick="markSelectedGroups(true)">${svg('check')}Marcar revisado</button>
          <button class="btn sm danger" onclick="markSelectedGroups(false)">Quitar</button>
          <button class="link-ghost" onclick="clearGroupSelection()">Limpiar selección</button>
        </div>`;
      return;
    }
    el.className='status-row';
    el.innerHTML=`<span class="result-count">Mostrando ${(RES._groups||[]).length} ${unit}(s)</span>`;
    return;
  }
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
function clearSelection(){RES.selected.clear();RES.selGroups.clear();updateBody();}
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
  const allSel=groups.length>0&&groups.every(g=>RES.selGroups.has(g.key));
  const trs=groups.map((g,i)=>{
    const pct=Math.round(g.rev/g.n*100);
    const second=by==='cliente'?`<span class="mono">${g.subs.size}</span> susc`
      :`<span class="mono">${g.n}</span> recurso(s)`;
    const cid=by==='cliente'?clienteIdPorNombre(g.key):null;   // clic en el cliente → su vista por cliente
    const keyHtml=cid?`<span class="lnk" onclick="navigate('/clientes/${cid}/comunicados')" title="Ver comunicados de ${esc(g.key)}">${esc(g.key)}</span>`:esc(g.key);
    const gsel=RES.selGroups.has(g.key);
    return `<tr class="${gsel?'sel':''}">
      <td class="chk"><input type="checkbox" ${gsel?'checked':''} aria-label="Seleccionar ${esc(g.key)}" onchange="toggleGroupSelectIdx(${i},this)"></td>
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
    <th class="chk"><input type="checkbox" ${allSel?'checked':''} aria-label="Seleccionar todos" onchange="selectAllGroups(this.checked)"></th>
    ${sortTh(by==='cliente'?'Cliente':'Suscripción',keyCol,'key')}
    <th>${hdr2}</th>
    <th style="width:190px">Revisión</th><th style="width:240px">Acciones</th>
  </tr></thead><tbody>${trs||`<tr><td colspan="5"><div class="empty-state">${by==='cliente'?'No hay clientes afectados':'No hay suscripciones afectadas'}</div></td></tr>`}</tbody></table></div>`;
}
function toggleGroupSelectIdx(i,cb){
  const g=RES._groups[i];if(!g)return;
  if(cb.checked)RES.selGroups.add(g.key);else RES.selGroups.delete(g.key);
  cb.closest('tr').classList.toggle('sel',cb.checked);
  const h=document.querySelector('#recbody thead .chk input');
  if(h)h.checked=RES._groups.length>0&&RES._groups.every(x=>RES.selGroups.has(x.key));
  renderStatusRow();
}
function selectAllGroups(on){
  RES._groups.forEach(g=>on?RES.selGroups.add(g.key):RES.selGroups.delete(g.key));
  updateBody();
}
function clearGroupSelection(){RES.selGroups.clear();updateBody();}
function markSelectedGroups(val){
  const ids=[];RES._groups.forEach(g=>{if(RES.selGroups.has(g.key))ids.push(...g.ids);});
  reviewIds(ids,val);   // reviewIds → render() limpia la selección
}
function recTable(rows){
  rows=sortRows(rows);
  const allSel=rows.length>0&&rows.every(r=>RES.selected.has(r.id));
  // Columnas extra propias del comunicado (del Excel): reemplazan a Estado/Gestor.
  const extraKeys=[];
  rows.forEach(r=>{const e=r.extra||{};Object.keys(e).forEach(k=>{if(e[k]!=null&&String(e[k]).trim()!==''&&!extraKeys.includes(k))extraKeys.push(k);});});
  const colspan=6+extraKeys.length;
  return `<div class="tblwrap"><table>
    <thead><tr><th class="chk"><input type="checkbox" ${allSel?'checked':''} aria-label="Seleccionar todos los recursos visibles" onchange="selectAllVisible(this.checked)"></th>
      ${sortTh('Cliente','cliente','key')}${sortTh('Suscripción','suscripcion','key')}${sortTh('Nombre del Recurso','nombre_recurso','key')}
      ${extraKeys.map(k=>`<th>${esc(k)}</th>`).join('')}<th>Añadido</th><th>Revisado por</th></tr></thead>
    <tbody>${rows.map(r=>`<tr class="${r.revisado?'done':''} ${RES.selected.has(r.id)?'sel':''}">
      <td class="chk"><input type="checkbox" ${RES.selected.has(r.id)?'checked':''} aria-label="Seleccionar recurso ${esc(r.nombre_recurso||'')}" onchange="toggleSelect(${r.id},this)"></td>
      <td class="key ${r.cliente?'':'empty'}">${r.cliente?esc(r.cliente):'—'}</td>
      <td class="key ${r.suscripcion?'':'empty'}">${r.suscripcion?esc(r.suscripcion):'—'}</td>
      <td class="key ${r.nombre_recurso?'':'empty'}">${r.nombre_recurso?esc(r.nombre_recurso):'—'}</td>
      ${extraKeys.map(k=>{const v=r.extra&&r.extra[k];return `<td class="${v?'':'empty'}" title="${esc(v||'')}">${v?esc(v):'—'}</td>`;}).join('')}
      <td class="${r.created_at?'mono':'empty'}" title="${esc(r.created_at?fmtInv(r.created_at)+' · '+invAgo(r.created_at):'')}">${r.created_at?fmtInv(r.created_at):'—'}</td>
      <td class="${r.revisado_por?'':'empty'}">${r.revisado_por?`<span class="stamp" title="Revisado por ${esc(r.revisado_por)}${r.revisado_at?' · '+r.revisado_at.slice(0,10):''}">${svg('check')}<span class="stamp-name">${esc(r.revisado_por)}</span>${r.revisado_at?`<span class="stamp-date">${r.revisado_at.slice(0,10)}</span>`:''}</span>`:'—'}</td>
    </tr>`).join('')||`<tr><td colspan="${colspan}"><div class="empty-state">No hay recursos afectados</div></td></tr>`}</tbody></table></div>`;
}
function drillIdx(i){
  const g=RES._groups[i],by=RES._groupBy;
  if(by==='cliente'){STATE.recCli=[g.key];STATE.recSub=[];STATE.recMode='suscripcion';}   // cliente → sus suscripciones
  else{STATE.recSub=[g.key];STATE.recMode='recurso';}                                     // suscripción → sus recursos
  render();
}
async function reviewIdx(i,val){await reviewIds(RES._groups[i].ids,val);}
async function reviewIds(ids,val){
  if(!ids.length)return;
  const res=await api('/api/recursos/bulk-review',{method:'POST',body:JSON.stringify({ids,revisado:val})});
  ids.forEach(id=>{const r=RES.rows.find(x=>x.id===id);if(r)setLocal(r,val);});
  await refreshCounts();render();toast(`${res.actualizados} recurso(s) ${val?'revisados':'sin revisar'}.`);
}
async function refreshCounts(){
  [STATE.stats,STATE.comunicados]=await Promise.all([api('/api/stats'),api('/api/comunicados')]);
}
function exportCSV(){
  const rows=sortRows(recFiltered());
  // columnas tal cual el archivo subido (guardadas en r.extra, en orden de aparición)
  const cols=[];
  rows.forEach(r=>{for(const k in (r.extra||{})){if(!cols.includes(k))cols.push(k);}});
  // respaldo para lotes antiguos (importados antes de guardar la fila completa): solo obligatorias
  const useExtra=cols.length>0;
  const fb=[['Suscripción','suscripcion'],['Grupo de Recurso','grupo_recurso'],['Nombre del Recurso','nombre_recurso']];
  const header=useExtra?cols:fb.map(([h])=>h);
  const q=v=>`"${(v??'').toString().replace(/"/g,'""')}"`;
  const lines=[header.map(q).join(',')];
  rows.forEach(r=>{
    const row=useExtra?cols.map(k=>(r.extra||{})[k]):fb.map(([,f])=>r[f]);
    lines.push(row.map(q).join(','));
  });
  const blob=new Blob(['﻿'+lines.join('\r\n')],{type:'text/csv;charset=utf-8'});
  const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=`recursos_${RES.cid}.csv`;a.click();
}
