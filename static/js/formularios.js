// Formularios: comunicado y nuevo inventario (subida de archivo / lote vacío).

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
          <div class="afecta-row" style="margin-top:10px" title="Registra un lote sin recursos: historial de que se revisó y no hay nada afectado (no exige archivo)">
            <span>No hay recursos afectados</span>
            <label class="switch"><input type="checkbox" id="iv_nores" onchange="ivToggleNoRes()"><span class="track"></span><span class="thumb"></span></label>
          </div>
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
      <div class="form-foot">
        <button class="btn" onclick="closeModal()">Cancelar</button>
        <button class="btn primary" id="ivSave" onclick="saveInvNew(${cid})">${svg('check')}Guardar</button>
      </div>
    </div>`;
  openModal();
  // Drag & drop: resaltar la zona y reflejar el nombre del archivo elegido.
  const dz=$('#iv_drop'), fi=$('#iv_file');
  const showName=()=>{const f=fi.files[0];$('#iv_dzname').textContent=f?f.name:'Arrastra el archivo aquí o haz clic para elegir';dz.classList.toggle('has-file',!!f);};
  fi.onchange=showName;
  ['dragenter','dragover'].forEach(ev=>dz.addEventListener(ev,e=>{e.preventDefault();dz.classList.add('drag');}));
  ['dragleave','drop'].forEach(ev=>dz.addEventListener(ev,e=>{e.preventDefault();dz.classList.remove('drag');}));
  dz.addEventListener('drop',e=>{if($('#iv_nores')?.checked)return;if(e.dataTransfer.files&&e.dataTransfer.files.length){fi.files=e.dataTransfer.files;showName();}});
}
// Toggle "No hay recursos afectados": bloquea la subida de archivo.
function ivToggleNoRes(){
  const on=$('#iv_nores').checked, dz=$('#iv_drop'), fi=$('#iv_file');
  fi.disabled=on; dz.classList.toggle('disabled',on);
  if(on){ fi.value=''; dz.classList.remove('has-file'); $('#iv_dzname').textContent='Sin recursos afectados — no se subirá archivo'; }
  else{ $('#iv_dzname').textContent='Arrastra el archivo aquí o haz clic para elegir'; }
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
  if($('#iv_nores')?.checked) return saveInvEmpty(cid);   // lote sin recursos afectados
  const file=$('#iv_file').files[0];
  if(!file){ivFormErr('Selecciona un archivo .xlsx/.csv o activa "No hay recursos afectados".');return;}
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
// Lote sin recursos: historial de "revisado, nada afectado" (no exige archivo).
async function saveInvEmpty(cid){
  const kql=$('#iv_kql').value||'';
  const btn=$('#ivSave');btn.disabled=true;
  try{
    const j=await api(`/api/comunicados/${cid}/inventarios`,{method:'POST',body:JSON.stringify({kql})});
    await loadRecursos(cid);await refreshCounts();
    if(j.inventario_id)STATE.recInv=j.inventario_id;
    closeModal();
    toast('Lote registrado · sin recursos afectados.');
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
