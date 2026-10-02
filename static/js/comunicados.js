// Comunicados: lista, filtros, orden, paginación y vistas agrupadas.

// ---------- COMUNICADOS ----------
function comStatus(c){   // estado simple derivado del avance de revisión
  if(!c.n_recursos||c.n_revisados===0)return 'sin';        // sin revisar
  if(c.n_revisados>=c.n_recursos)return 'done';            // completado
  return 'proc';                                           // en proceso
}
// Estado autocalculado: Completado (último lote 100% revisado) o, si no, Vigente/Vencido según la fecha límite.
function comEstadoInfo(c){
  const nr=c.n_recursos||0, nv=c.n_revisados||0;
  if(nr>0&&nv>=nr) return {label:'Completado', st:'status--ok'};
  const vencido=c.fecha_limite&&c.fecha_limite<today;
  return vencido?{label:'Vencido', st:'status--danger'}:{label:'Vigente', st:'status--info'};
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
  const nActivos=STATE.comCli.length+STATE.comSub.length+(STATE.est!==''?1:0);
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
      <button class="btn sm" id="btnPap" onclick="openPapelera()" title="Comunicados eliminados (se pueden recuperar)">
        ${svg('trash')}Papelera${STATE.nPap?` <span class="chip-n">${STATE.nPap}</span>`:''}
      </button>
      ${catChip}
    </div>
    <div class="tb-spacer"></div>
    <div class="tb-actions">
      <div class="segbar" role="group" aria-label="Ver comunicados agrupados">
        ${vBtn('','Lista')}${STATE.comScope?'':vBtn('cliente','Por cliente')}${vBtn('suscripcion','Por suscripción')}
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
          ${th('N°','n','width:56px')}${th('Comunicado','titulo')}${th('Última revisión','ultima_revision','width:180px')}
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
// Suscripciones del cliente acotado (vista /clientes/:id/comunicados).
function scopedSubsSet(){
  if(!STATE.comScope)return null;
  const c=(CLI.list||[]).find(x=>x.id===STATE.comScope.id);
  return new Set(((c&&c.suscripciones)||[]).map(s=>s.nombre).filter(Boolean));
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
    if(col==='fecha_limite'||col==='ultima_revision'){   // fechas: sin fecha siempre al final
      const av=a[col]||'', bv=b[col]||'';
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
function comSortArrow(col){return STATE.comSort.col===col?`<span class="sarrow">${STATE.comSort.dir>0?'▲':'▼'}</span>`:'';}
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
  // En vista acotada a un cliente, "Por suscripción" solo agrupa sus suscripciones.
  const okSubs=by==='suscripcion'?(STATE.comScope?scopedSubsSet():subsConClienteSet()):null;
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
    <td class="ctitle"><div class="ctitle-row">
      <div class="ctitle-main">
        <b class="comlink" onclick="openRecursos(${c.id})" title="Ver detalle del comunicado">${hl(c.titulo,q)}</b>${c.archivado?` <span class="tag-arch">Archivado</span>`:''}
        ${c.responsable?`<div class="caption" style="text-transform:none">${esc(c.responsable)}</div>`:''}
      </div>
      ${c.categoria?`<span class="ctitle-cat">${catBadge(c.categoria)}</span>`:''}
    </div></td>
    <td>${c.ultima_revision?`<span class="status status--ok" style="background:none;border:none;padding:0;color:var(--text)">${svg('clock')}${fmtInv(c.ultima_revision)}</span>`:'<span class="caption">—</span>'}</td>
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
