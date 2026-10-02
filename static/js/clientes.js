// Clientes, suscripciones y suscripciones sin cliente.

// ---------- PÁGINA CLIENTES (tabla con desplegables) ----------
let CLI={list:[],expanded:new Set(),showArch:false};
async function renderClientes(){
  try{CLI.list=await api('/api/clientes');}catch(e){$('#content').innerHTML=`<div class="empty-state">Error: ${esc(e.message)}</div>`;return;}
  const nArch=CLI.list.filter(c=>c.archivado).length;
  const nAct=CLI.list.length-nArch;
  const nsub=CLI.list.reduce((a,c)=>a+c.suscripciones.length,0);
  $('#content').innerHTML=`
    <div class="rechead"><h1 class="page" style="margin:0">Clientes</h1>
      <div class="statstrip"><b>${nAct}</b> clientes · <b>${nsub}</b> suscripciones</div></div>    <div class="toolbar">
      <div class="search search-lg"><span>${svg('search')}</span><input id="cliq" placeholder="Buscar cliente, suscripción o id…" oninput="renderCliList()"></div>
      <div class="tb-filters">
        <button class="btn sm ${CLI.showArch?'primary':''}" onclick="toggleCliArch()" title="${CLI.showArch?'Volver a los activos':'Ver clientes archivados'}">${svg('archive')}Archivados${nArch?` <span class="chip-n">${nArch}</span>`:''}</button>
      </div>
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
  if(!l.length){box.innerHTML='<div class="empty-state" style="padding:var(--sp-4)">No hay suscripciones sin cliente.</div>';return;}
  box.innerHTML=`<div class="tblwrap" style="max-height:none;margin-top:8px"><table class="clitbl">
    <thead><tr><th>Suscripción</th><th style="width:300px">ID</th><th style="width:88px">Acciones</th></tr></thead>
    <tbody>${l.map((s,i)=>`<tr>
      <td class="s-name">${svg('subscription','icon')}<span>${esc(s.suscripcion||'(sin nombre)')}</span></td>
      <td class="mono ${s.suscripcion_id?'':'empty'}">${s.suscripcion_id?esc(s.suscripcion_id):'sin id'}</td>
      <td><div class="acts">
        <button class="btn sm btn-icon" title="Editar suscripción" onclick="openSinCliEdit(${i})">${svg('edit')}</button>
        <button class="btn sm btn-icon" title="Asignar a un cliente" onclick="openAsignarCli(${i})">${svg('building')}</button>
        <button class="btn sm btn-icon danger" title="Eliminar (borra sus recursos huérfanos)" onclick="delSinCli(${i})">${svg('trash')}</button>
      </div></td></tr>`).join('')}</tbody></table></div>`;
}
async function refreshSinCli(){renderSinCli(await api('/api/suscripciones-sin-cliente'));}
async function delSinCli(i){
  const s=SINCLI.rows[i];if(!s)return;
  if(!confirm(`¿Eliminar la suscripción sin cliente "${s.suscripcion||s.suscripcion_id||'(sin nombre)'}" y sus ${s.n_recursos} recurso(s) huérfanos? Esta acción no se puede deshacer.`))return;
  try{
    const r=await api('/api/suscripciones-sin-cliente',{method:'DELETE',body:JSON.stringify({suscripcion:s.suscripcion||'',suscripcion_id:s.suscripcion_id||''})});
    await refreshCli();await refreshSinCli();
    toast(`Eliminado · ${r.recursos_eliminados} recurso(s).`);
  }catch(e){toast('Error: '+e.message);}
}
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
function toggleCliArch(){CLI.showArch=!CLI.showArch;renderClientes();}
async function archiveCli(id,val){
  try{
    await api('/api/clientes/'+id,{method:'PUT',body:JSON.stringify({archivado:val?1:0})});
    await refreshCli();
    toast(val?'Cliente archivado.':'Cliente restaurado.');
  }catch(e){toast('Error: '+e.message);}
}
function renderCliList(){
  const q=($('#cliq')?.value||'').toLowerCase();
  const list=CLI.list.filter(c=>(CLI.showArch?c.archivado:!c.archivado)   // archivados ocultos salvo en "Ver archivados"
    &&(!q||c.nombre.toLowerCase().includes(q)||c.suscripciones.some(s=>(s.nombre||'').toLowerCase().includes(q)||(s.sub_id||'').toLowerCase().includes(q))));
  const el=$('#cliList');if(!el)return;
  el.innerHTML=list.map(c=>cliRow(c,q)).join('')||`<tr><td colspan="4"><div class="empty-state">${CLI.showArch?'No hay clientes archivados.':'Sin clientes que coincidan.'}</div></td></tr>`;
}
function openCliComs(id){navigate('/clientes/'+id+'/comunicados');}   // vista aparte al hacer clic en el nombre
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
    <td class="ctitle"><b class="comlink">${hl(c.nombre,q)}</b>${c.archivado?` <span class="tag-arch">Archivado</span>`:''}<div class="caption" style="text-transform:none">${nsub} ${nsub===1?'suscripción':'suscripciones'}</div></td>
    <td class="mono ${c.ext_id?'':'empty'}">${c.ext_id?esc(c.ext_id):'—'}</td>
    <td><div class="acts">
      <button class="btn sm btn-icon" title="Editar cliente" onclick="openCliForm(${c.id})">${svg('edit')}</button>
      ${c.archivado
        ?`<button class="btn sm btn-icon" title="Restaurar cliente" onclick="event.stopPropagation();archiveCli(${c.id},0)">${svg('unarchive')}</button>`
        :`<button class="btn sm btn-icon" title="Archivar cliente" onclick="event.stopPropagation();archiveCli(${c.id},1)">${svg('archive')}</button>`}
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
