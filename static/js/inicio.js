// Inicio: dashboard personal y del equipo.

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
function splitBar(rev,total,max,clickAttr=''){
  const wTot=(total/max*100).toFixed(1);
  const wRev=total?(rev/total*100).toFixed(1):0;
  return `<div class="bar-track" ${clickAttr}><div class="bar-outer" style="width:${wTot}%"><div class="rev" style="width:${wRev}%"></div></div></div>`;
}
function daysLeft(d){return Math.round((new Date(d)-new Date(today))/864e5);}
function goCat(cat){STATE.cat=cat;STATE.est='';STATE.verVenc=false;STATE.q='';navigate('/comunicados');}
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
  const vencAll=s.vencidos_list||[];
  const venc=(vencAll.slice(0,5).map(p=>rowLink(p,true)).join('')+(vencAll.length>5?`<div class="dl-more">+${vencAll.length-5} más</div>`:''))||'<div class="empty-state" style="padding:var(--sp-4)">Nada vencido.</div>';
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
