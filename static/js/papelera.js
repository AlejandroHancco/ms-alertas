// Eliminar (a la papelera), papelera y archivar comunicados.

async function delCom(id){
  if(!confirm('¿Eliminar este comunicado? Se moverá a la papelera junto con sus recursos y podrás recuperarlo.'))return;
  try{await api('/api/comunicados/'+id,{method:'DELETE'});}catch(e){toast('Error: '+e.message);return;}
  await loadAll();
  if(STATE.view==='recursos'&&RES.cid===id)navigate('/comunicados');else render();
  toast('Comunicado movido a la papelera.');
}
// ---------- Papelera: comunicados eliminados (restaurar · eliminar definitivo solo admin) ----------
let PAP=[];
async function openPapelera(){
  try{PAP=await api('/api/papelera');}catch(e){toast('Error: '+e.message);return;}
  STATE.nPap=PAP.length;renderPapelera();openModal();
}
function renderPapelera(){
  const rows=PAP.map(p=>`<tr>
    <td><span class="com-num">#${esc(p.comunicado_id)}</span> <b>${esc(p.titulo||'')}</b>
      <div class="caption" style="text-transform:none">${p.categoria?esc(p.categoria)+' · ':''}<span class="mono">${p.n_recursos}</span> recursos · <span class="mono">${p.n_inventarios}</span> lotes</div></td>
    <td><div>${esc(fmtInv(p.eliminado_at))}</div><div class="caption" style="text-transform:none">${esc(p.eliminado_por||'')}</div></td>
    <td><div class="acts">
      <button class="btn sm" onclick="restorePap(${p.id})">${svg('unarchive')}Restaurar</button>
      ${isAdmin()?`<button class="btn sm btn-icon danger" title="Eliminar definitivamente" onclick="purgePap(${p.id})">${svg('trash')}</button>`:''}
    </div></td></tr>`).join('');
  $('#modal').className='modal md';
  $('#modal').innerHTML=`
    <div class="mhead"><div><h2>Papelera</h2><div class="sub">Comunicados eliminados · se pueden restaurar con sus recursos e inventarios</div></div><button class="x" onclick="closeModal()">${svg('close')}</button></div>
    <div class="mbody">
      ${PAP.length?`<div class="tblwrap" style="max-height:60vh"><table class="clitbl">
        <thead><tr><th>Comunicado</th><th style="width:170px">Eliminado</th><th style="width:150px"></th></tr></thead>
        <tbody>${rows}</tbody></table></div>`:'<div class="empty-state">La papelera está vacía.</div>'}
      <div class="form-foot">
        ${isAdmin()&&PAP.length?`<button class="btn danger" onclick="purgePap()">${svg('trash')}Vaciar papelera</button>`:''}
        <button class="btn primary" onclick="closeModal()">Cerrar</button></div>
    </div>`;
}
async function restorePap(pid){
  try{
    const r=await api(`/api/papelera/${pid}/restaurar`,{method:'POST',body:'{}'});
    PAP=PAP.filter(p=>p.id!==pid);STATE.nPap=PAP.length;
    await loadAll();renderPapelera();toast(`Comunicado #${r.comunicado_id} restaurado.`);
  }catch(e){toast('Error: '+e.message);}
}
async function purgePap(pid){
  const msg=pid?'¿Eliminar definitivamente este comunicado? No se podrá recuperar.'
               :'¿Vaciar la papelera? Todos los comunicados se eliminarán definitivamente.';
  if(!confirm(msg))return;
  try{
    await api(pid?`/api/papelera/${pid}`:'/api/papelera',{method:'DELETE'});
    PAP=pid?PAP.filter(p=>p.id!==pid):[];STATE.nPap=PAP.length;
    renderPapelera();toast(pid?'Eliminado definitivamente.':'Papelera vaciada.');
  }catch(e){toast('Error: '+e.message);}
}
// Archivar (val=1) o restaurar (val=0). Reversible, sin confirmación.
async function archiveCom(id,val){
  await api('/api/comunicados/'+id,{method:'PUT',body:JSON.stringify({archivado:val?1:0})});
  await loadAll();
  if(STATE.view==='recursos'&&RES.cid===id&&val)navigate('/comunicados');else render();
  toast(val?'Comunicado archivado.':'Comunicado restaurado.');
}
