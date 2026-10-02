// Sesión: login, cambio de contraseña obligatorio, roles (RBAC), menú de usuario y Mi perfil.

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
// Contraseña temporal (o la antigua nombre.apellido): hay que cambiarla antes de entrar.
const PWD_MIN=8;
function showPwdGate(){
  document.body.classList.add('locked');
  let scr=$('#loginScreen');
  if(!scr){ scr=document.createElement('div'); scr.id='loginScreen'; document.body.appendChild(scr); }
  scr.innerHTML=`
    <div class="login-card">
      <img class="login-logo" src="/logo.png" alt="G&amp;S · Gestión y Sistemas">
      <div class="login-head"><b>Cambia tu contraseña</b></div>
      <div class="login-sub">Tu contraseña actual es temporal. Elige una nueva de al menos ${PWD_MIN} caracteres para continuar.</div>
      <form id="pwdGateForm" autocomplete="off">
        <label class="field"><span>Contraseña actual</span><input type="password" id="pgActual" required autocomplete="current-password"></label>
        <label class="field"><span>Nueva contraseña</span><input type="password" id="pgNueva" required minlength="${PWD_MIN}" autocomplete="new-password"></label>
        <label class="field"><span>Confirmar nueva contraseña</span><input type="password" id="pgConf" required autocomplete="new-password"></label>
        <div class="login-err" id="pgErr" hidden></div>
        <button class="btn primary" type="submit" style="width:100%;justify-content:center">Guardar y entrar</button>
        <button class="btn" type="button" onclick="doLogout()" style="width:100%;justify-content:center">Cerrar sesión</button>
      </form>
    </div>`;
  $('#pwdGateForm').addEventListener('submit',async e=>{
    e.preventDefault();
    const actual=$('#pgActual').value, nueva=$('#pgNueva').value, conf=$('#pgConf').value;
    const err=$('#pgErr'); err.hidden=true;
    if(nueva.length<PWD_MIN){ err.textContent=`La nueva contraseña debe tener al menos ${PWD_MIN} caracteres.`; err.hidden=false; return; }
    if(nueva!==conf){ err.textContent='La nueva contraseña y su confirmación no coinciden.'; err.hidden=false; return; }
    try{
      await api('/api/cambiar-password',{method:'POST',body:JSON.stringify({actual,nueva})});
      toast('Contraseña actualizada.'); hideLoginGate();
    }catch(ex){ err.textContent=ex.message||'No se pudo cambiar la contraseña'; err.hidden=false; }
  });
  setTimeout(()=>$('#pgActual')&&$('#pgActual').focus(),40);
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
// RBAC: admin (todo + miembros/roles) · editor (lee y edita) · lector (solo lee).
// El backend es quien hace cumplir los permisos; aquí solo se ocultan los controles
// que el rol no puede usar (vía CSS con body[data-rol]).
const ROL_LBL={admin:'Admin',editor:'Editor',lector:'Lector'};
const myRol=()=>(STATE.me&&STATE.me.rol)||'lector';
const isAdmin=()=>myRol()==='admin';
function rolBadge(r){return `<span class="rol-badge rol-${esc(r||'editor')}">${ROL_LBL[r]||esc(r||'')}</span>`;}
function updateNavProfile(){
  document.body.dataset.rol=myRol();
  const el=$('#navProfile'); if(!el) return;
  el.textContent=inicialDe(STATE.me);
}
// ---------- menú de perfil en el navbar (tema oscuro + cerrar sesión) ----------
function userMenuHTML(){
  const me=STATE.me||{};
  const nombre=`${me.nombre||''} ${me.apellido||''}`.trim()||me.correo||'Usuario';
  return `<div class="nav-menu-head">
      <div class="nav-menu-name">${esc(nombre)}</div>
      <div class="nav-menu-mail">${esc(me.correo||'')}</div>
      <div style="margin-top:6px">${rolBadge(me.rol)}</div></div>
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
            <label class="field"><span>Nueva contraseña</span><input type="password" id="pwNueva" required minlength="${PWD_MIN}" autocomplete="new-password"></label>
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
    if(nueva.length<PWD_MIN){ err.textContent=`La nueva contraseña debe tener al menos ${PWD_MIN} caracteres.`; err.hidden=false; return; }
    if(nueva!==conf){ err.textContent='La nueva contraseña y su confirmación no coinciden.'; err.hidden=false; return; }
    try{
      await api('/api/cambiar-password',{method:'POST',body:JSON.stringify({actual,nueva})});
      e.target.reset(); toast('Contraseña actualizada.');
    }catch(ex){ err.textContent=ex.message||'No se pudo cambiar la contraseña'; err.hidden=false; }
  });
}
