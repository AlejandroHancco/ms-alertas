// Modal, atajos de teclado y arranque (boot).

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
  if(STATE.me.debe_cambiar){ showPwdGate(); return; }
  document.body.classList.remove('locked');
  try{ await loadAll(); }
  catch(e){ $('#content').innerHTML=`<div class="empty-state">No se pudo cargar la plataforma.<br><br>${esc(e.message)}</div>`; return; }
  updateNavProfile();
  route();
}
boot();
