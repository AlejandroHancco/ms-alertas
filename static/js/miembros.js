// Miembros: listado y alta/edición (solo admin).

// ---------- PÁGINA MIEMBROS ----------
let MIEM={list:[],pendingQ:''};
async function renderMiembros(){
  try{MIEM.list=await api('/api/miembros');}catch(e){$('#content').innerHTML=`<div class="empty-state">Error: ${esc(e.message)}</div>`;return;}
  $('#content').innerHTML=`
    <div class="rechead"><h1 class="page" style="margin:0">Miembros</h1>
      <div class="statstrip"><b>${MIEM.list.length}</b> miembros</div></div>    <div class="toolbar">
      <div class="search search-lg"><span>${svg('search')}</span><input id="miemq" placeholder="Buscar por correo, nombre o apellido…" oninput="renderMiemList()"></div>
      <div class="tb-spacer"></div>
      <div class="tb-actions">${isAdmin()?`<button class="btn primary sm" onclick="openMiemForm()">${svg('add')}Nuevo miembro</button>`:''}</div>
    </div>
    ${isAdmin()?'':'<div class="caption" style="text-transform:none;margin:0 0 8px">Solo un admin puede crear miembros o cambiar sus roles.</div>'}
    <div class="tblwrap" style="max-height:none"><table class="clitbl">
      <thead><tr><th>Correo</th><th style="width:200px">Nombre</th><th style="width:200px">Apellido</th><th style="width:110px">Rol</th>${isAdmin()?'<th style="width:88px">Acciones</th>':''}</tr></thead>
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
    <td>${rolBadge(m.rol)}</td>
    ${isAdmin()?`<td><div class="acts">
      <button class="btn sm btn-icon" title="Editar miembro" onclick="openMiemForm(${m.id})">${svg('edit')}</button>
      <button class="btn sm btn-icon danger" title="Eliminar miembro" onclick="delMiem(${m.id})">${svg('trash')}</button>
    </div></td>`:''}</tr>`).join('')||`<tr><td colspan="${isAdmin()?5:4}"><div class="empty-state">Sin miembros que coincidan.</div></td></tr>`;
}
function openMiemForm(id){
  const m=id?MIEM.list.find(x=>x.id===id):null;
  $('#modal').className='modal sm';
  $('#modal').innerHTML=`<div class="mhead"><div><h2>${id?'Editar':'Nuevo'} miembro</h2></div><button class="x" onclick="closeModal()">${svg('close')}</button></div>
    <div class="mbody mstack">
      <div class="field full"><label>Correo</label><input id="m_correo" type="email" autocomplete="off" value="${m?esc(m.correo):''}"></div>
      <div class="field-pair">
        <div class="field"><label>Nombre</label><input id="m_nombre" value="${m?esc(m.nombre||''):''}" ${id?'readonly':''}></div>
        <div class="field"><label>Apellido</label><input id="m_apellido" value="${m?esc(m.apellido||''):''}" ${id?'readonly':''}></div>
      </div>
      ${id?'<div class="caption" style="text-transform:none;margin-top:calc(-1 * var(--sp-2))">El nombre y apellido los edita cada miembro desde su “Mi perfil”.</div>':''}
      <div class="field full"><label>Rol</label>
        <select id="m_rol">${['admin','lector','editor'].map(r=>`<option value="${r}" ${(m?m.rol:'lector')===r?'selected':''}>${ROL_LBL[r]}</option>`).join('')}</select></div>
      <div class="field full"><label>Contraseña temporal ${id?'<span class="caption" style="text-transform:none">(en blanco = mantener la actual)</span>':''}</label>
        <input id="m_pwd" type="password" autocomplete="new-password" placeholder="${id?'••••••••':`Mínimo ${PWD_MIN} caracteres`}">
        <div class="caption" style="text-transform:none;margin-top:4px">El miembro deberá cambiarla al iniciar sesión.</div></div>
      <div id="formErr" class="formerr hidden"></div>
      <div class="form-foot"><button class="btn" onclick="closeModal()">Cancelar</button>
        <button class="btn primary" onclick="saveMiem(${id||0})">${svg('check')}Guardar</button></div></div>`;
  openModal();setTimeout(()=>$('#m_correo')&&$('#m_correo').focus(),50);
}
async function saveMiem(id){
  const correo=$('#m_correo').value.trim(),nombre=$('#m_nombre').value.trim(),
        apellido=$('#m_apellido').value.trim(),password=$('#m_pwd').value,rol=$('#m_rol').value;
  if(!correo){showFormErr('El correo es obligatorio.');return;}
  if(!id&&!password){showFormErr('La contraseña es obligatoria para un miembro nuevo.');return;}
  if(password&&password.length<PWD_MIN){showFormErr(`La contraseña debe tener al menos ${PWD_MIN} caracteres.`);return;}
  try{
    if(id)await api('/api/miembros/'+id,{method:'PUT',body:JSON.stringify({correo,nombre,apellido,password,rol})});
    else await api('/api/miembros',{method:'POST',body:JSON.stringify({correo,nombre,apellido,password,rol})});
    MIEM.list=await api('/api/miembros');
    if(STATE.me&&id===STATE.me.id){STATE.me=(await api('/api/me')).miembro;updateNavProfile();}   // cambió su propio rol
    closeModal();toast(id?'Miembro actualizado.':'Miembro creado.');
  }catch(e){showFormErr(esc(e.message));}
}
async function delMiem(id){
  if(!confirm('¿Eliminar este miembro?'))return;
  try{await api('/api/miembros/'+id,{method:'DELETE'});MIEM.list=await api('/api/miembros');renderMiemList();toast('Miembro eliminado.');}
  catch(e){toast('Error: '+e.message);}
}
function gotoMiembros(term){MIEM.pendingQ=term||'';navigate('/miembros');}
