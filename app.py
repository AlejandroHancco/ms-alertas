# -*- coding: utf-8 -*-
"""
Servidor de la Plataforma de Comunicados (Upgrade MS).
Backend: solo libreria estandar de Python (http.server + sqlite3).
Sirve el dashboard (index.html) y una API REST sobre upgrade_ms.db.

Uso:  python app.py          -> http://localhost:8765
      python app.py 9000     -> otro puerto
"""
import os, sys, json, threading, datetime, re, io, csv, hashlib, secrets
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import urlparse, parse_qs
import import_excel as ie   # reutiliza normalizacion (norm, match_col, columnas)
import pgdb                 # capa de compatibilidad sqlite3 -> PostgreSQL
from pgdb import IntegrityError

HERE = os.path.dirname(os.path.abspath(__file__))
PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 8765
LOCK = threading.Lock()

# mapa suscripcion -> cliente (cacheado desde las tablas clientes/suscripciones)
_CLI_NAME, _CLI_ID = {}, {}
def reload_cli_map():
    global _CLI_NAME, _CLI_ID
    bn, bi = {}, {}
    try:
        con = db()
        for cliente, nombre, sid in con.execute(
            "SELECT c.nombre,s.nombre,s.sub_id FROM suscripciones s JOIN clientes c ON s.cliente_id=c.id"):
            if nombre: bn[ie.norm(nombre)] = cliente
            if sid: bi[(sid or "").strip().lower()] = cliente
        con.close()
    except Exception:
        bn, bi = ie.build_cliente_map()   # respaldo desde el Excel si faltan tablas
    _CLI_NAME, _CLI_ID = bn, bi
def cliente_para(name, sid):
    return ie.cliente_de(name or "", sid or "", _CLI_NAME, _CLI_ID)

def db():
    return pgdb.connect()

TODAY = lambda: datetime.date.today().isoformat()
NOW = lambda: datetime.datetime.now().isoformat(timespec="seconds")

def ensure_schema():
    """Crea el esquema en PostgreSQL si no existe (idempotente)."""
    con = db()
    pgdb.create_schema(con)
    con.close()

# ------------------------- consultas -------------------------
def list_comunicados():
    con = db()
    rows = con.execute("""
      SELECT c.*,
        (SELECT COUNT(*) FROM recursos r WHERE r.comunicado_id=c.id) AS n_recursos,
        (SELECT COUNT(*) FROM recursos r WHERE r.comunicado_id=c.id AND r.revisado=1) AS n_revisados,
        (SELECT MAX(r.created_at) FROM recursos r WHERE r.comunicado_id=c.id) AS ultimo_inventario,
        (SELECT COUNT(*) FROM inventarios i WHERE i.comunicado_id=c.id) AS n_inventarios
      FROM comunicados c ORDER BY (c.fecha_limite IS NULL), c.fecha_limite, c.id
    """).fetchall()
    # Clientes y suscripciones afectadas por cada comunicado (para los filtros de la lista).
    afect = {}
    for r in con.execute("""
        SELECT comunicado_id,
          ARRAY_AGG(DISTINCT cliente)     FILTER (WHERE COALESCE(cliente,'')<>'')     AS clientes,
          ARRAY_AGG(DISTINCT suscripcion) FILTER (WHERE COALESCE(suscripcion,'')<>'') AS suscripciones
        FROM recursos GROUP BY comunicado_id
    """).fetchall():
        afect[r["comunicado_id"]] = (list(r["clientes"] or []), list(r["suscripciones"] or []))
    # Completitud por cliente y por suscripcion (columna "Revision" segun el toggle).
    # Un cliente/suscripcion cuenta como revisado cuando TODOS sus recursos del comunicado lo estan.
    # Las suscripciones sin cliente no se cuentan (mismo criterio que los filtros).
    rev_cli, rev_sub = {}, {}
    for r in con.execute("""
        SELECT comunicado_id, COUNT(*) AS n, COUNT(*) FILTER (WHERE rev = tot) AS n_rev
        FROM (SELECT comunicado_id, cliente, COUNT(*) AS tot, COALESCE(SUM(revisado),0) AS rev
              FROM recursos WHERE COALESCE(cliente,'')<>'' GROUP BY comunicado_id, cliente) t
        GROUP BY comunicado_id""").fetchall():
        rev_cli[r["comunicado_id"]] = (r["n"], r["n_rev"])
    for r in con.execute("""
        SELECT comunicado_id, COUNT(*) AS n, COUNT(*) FILTER (WHERE rev = tot) AS n_rev
        FROM (SELECT comunicado_id, suscripcion, COUNT(*) AS tot, COALESCE(SUM(revisado),0) AS rev
              FROM recursos WHERE COALESCE(suscripcion,'')<>'' AND COALESCE(cliente,'')<>''
              GROUP BY comunicado_id, suscripcion) t
        GROUP BY comunicado_id""").fetchall():
        rev_sub[r["comunicado_id"]] = (r["n"], r["n_rev"])
    con.close()
    out = []
    for r in rows:
        d = dict(r)
        cl, su = afect.get(d["id"], ([], []))
        d["clientes"] = cl
        d["suscripciones"] = su
        d["n_clientes"], d["n_clientes_rev"] = rev_cli.get(d["id"], (0, 0))
        d["n_subs"], d["n_subs_rev"] = rev_sub.get(d["id"], (0, 0))
        out.append(d)
    return out

def list_inventarios(cid):
    con = db()
    rows = con.execute("""
      SELECT i.*,
        (SELECT COUNT(*) FROM recursos r WHERE r.inventario_id=i.id) AS n_recursos,
        (SELECT COUNT(*) FROM recursos r WHERE r.inventario_id=i.id AND r.revisado=1) AS n_revisados,
        (SELECT COUNT(DISTINCT r.cliente) FROM recursos r WHERE r.inventario_id=i.id AND COALESCE(r.cliente,'')<>'') AS n_clientes,
        (SELECT COUNT(DISTINCT r.suscripcion) FROM recursos r WHERE r.inventario_id=i.id AND COALESCE(r.suscripcion,'')<>'') AS n_subs
      FROM inventarios i WHERE i.comunicado_id=? ORDER BY i.fecha DESC, i.id DESC
    """, (cid,)).fetchall()
    con.close()
    return [dict(r) for r in rows]

def update_inventario(iid, data):
    con = db(); sets=[]; vals=[]
    for f in ("kql","fecha"):
        if f in data: sets.append(f+"=?"); vals.append(data[f])
    if sets:
        con.execute(f"UPDATE inventarios SET {','.join(sets)} WHERE id=?", vals+[iid]); con.commit()
    con.close(); return {"ok": True}

def delete_inventario(iid):
    """Elimina un lote y los recursos que trajo."""
    con = db()
    n = con.execute("SELECT COUNT(*) FROM recursos WHERE inventario_id=?", (iid,)).fetchone()[0]
    con.execute("DELETE FROM recursos WHERE inventario_id=?", (iid,))
    con.execute("DELETE FROM inventarios WHERE id=?", (iid,))
    con.commit(); con.close()
    return {"ok": True, "recursos_eliminados": n}

def get_recursos(cid):
    con = db()
    rows = con.execute("SELECT * FROM recursos WHERE comunicado_id=? ORDER BY suscripcion,grupo_recurso,nombre_recurso", (cid,)).fetchall()
    con.close()
    out = []
    for r in rows:
        d = dict(r)
        try: d["extra"] = json.loads(d["extra"]) if d["extra"] else {}
        except Exception: d["extra"] = {}
        out.append(d)
    return out

def stats():
    con = db(); c = con.cursor()
    tot_com = c.execute("SELECT COUNT(*) FROM comunicados").fetchone()[0]
    tot_rec = c.execute("SELECT COUNT(*) FROM recursos").fetchone()[0]
    rev = c.execute("SELECT COUNT(*) FROM recursos WHERE revisado=1").fetchone()[0]
    com_con = c.execute("SELECT COUNT(*) FROM comunicados WHERE id IN (SELECT DISTINCT comunicado_id FROM recursos)").fetchone()[0]
    por_cat = [dict(r) for r in c.execute("""
      SELECT COALESCE(NULLIF(c.categoria,''),'Sin categoría') AS categoria,
             COUNT(DISTINCT c.id) AS comunicados,
             COUNT(r.id) AS recursos,
             COALESCE(SUM(r.revisado),0) AS revisados
      FROM comunicados c LEFT JOIN recursos r ON r.comunicado_id=c.id
      GROUP BY 1 ORDER BY recursos DESC""").fetchall()]
    por_sub = [dict(r) for r in c.execute("""
      SELECT COALESCE(NULLIF(suscripcion,''),'(sin suscripción)') AS suscripcion,
             COUNT(*) AS recursos, SUM(revisado) AS revisados
      FROM recursos GROUP BY 1 ORDER BY recursos DESC LIMIT 12""").fetchall()]
    hoy = TODAY()
    vencidos = c.execute("SELECT COUNT(*) FROM comunicados WHERE fecha_limite IS NOT NULL AND fecha_limite < ?", (hoy,)).fetchone()[0]
    prox = [dict(r) for r in c.execute("""
      SELECT id,n,titulo,categoria,fecha_limite,
        (SELECT COUNT(*) FROM recursos r WHERE r.comunicado_id=comunicados.id) AS n_recursos,
        (SELECT COUNT(*) FROM recursos r WHERE r.comunicado_id=comunicados.id AND r.revisado=1) AS n_revisados
      FROM comunicados WHERE fecha_limite IS NOT NULL AND fecha_limite >= ?
      ORDER BY fecha_limite LIMIT 8""", (hoy,)).fetchall()]
    vencidos_list = [dict(r) for r in c.execute("""
      SELECT id,n,titulo,categoria,fecha_limite,
        (SELECT COUNT(*) FROM recursos r WHERE r.comunicado_id=comunicados.id) AS n_recursos,
        (SELECT COUNT(*) FROM recursos r WHERE r.comunicado_id=comunicados.id AND r.revisado=1) AS n_revisados
      FROM comunicados WHERE fecha_limite IS NOT NULL AND fecha_limite < ?
      ORDER BY fecha_limite LIMIT 10""", (hoy,)).fetchall()]
    # --- Clientes: recursos afectados y avance de revisión por cliente ---
    cli_rows = [dict(r) for r in c.execute("""
      SELECT cliente,
             COUNT(*) AS recursos,
             COALESCE(SUM(revisado),0) AS revisados
      FROM recursos WHERE COALESCE(cliente,'')<>''
      GROUP BY cliente ORDER BY recursos DESC""").fetchall()]
    clientes_afectados = len(cli_rows)
    # clientes tocados por comunicados vencidos (para marcar riesgo alto)
    venc_cli = {r[0] for r in c.execute("""
      SELECT DISTINCT cliente FROM recursos
      WHERE COALESCE(cliente,'')<>'' AND comunicado_id IN
        (SELECT id FROM comunicados WHERE fecha_limite IS NOT NULL AND fecha_limite < ?)
      """, (hoy,)).fetchall()}
    for r in cli_rows:
        r["pendientes"] = r["recursos"] - r["revisados"]
        r["vencido"] = 1 if r["cliente"] in venc_cli else 0
    clientes_top = cli_rows[:10]
    clientes_riesgo = sorted((r for r in cli_rows if r["pendientes"] > 0),
                             key=lambda r: (r["vencido"], r["pendientes"]), reverse=True)[:8]

    # --- Comunicados por estado (derivado del avance de revisión) ---
    com_estado = {"sin_recursos": 0, "sin_revisar": 0, "en_progreso": 0, "completado": 0}
    for r in c.execute("""
      SELECT COUNT(r.id) AS n_rec, COALESCE(SUM(r.revisado),0) AS n_rev
      FROM comunicados co LEFT JOIN recursos r ON r.comunicado_id=co.id
      GROUP BY co.id""").fetchall():
        nr, nv = r["n_rec"], r["n_rev"]
        if nr == 0:        com_estado["sin_recursos"] += 1
        elif nv >= nr:     com_estado["completado"]   += 1
        elif nv == 0:      com_estado["sin_revisar"]  += 1
        else:              com_estado["en_progreso"]  += 1

    con.close()
    return {
        "totales": {"comunicados": tot_com, "recursos": tot_rec, "revisados": rev,
                    "pendientes": tot_rec-rev, "com_con_recursos": com_con,
                    "pct_revisado": round(rev*100/tot_rec,1) if tot_rec else 0,
                    "vencidos": vencidos},
        "por_categoria": por_cat, "por_suscripcion": por_sub,
        "proximos": prox, "vencidos_list": vencidos_list, "hoy": hoy,
        "clientes_top": clientes_top, "clientes_afectados": clientes_afectados,
        "clientes_riesgo": clientes_riesgo, "com_estado": com_estado,
    }

# ------------------------- mutaciones -------------------------
COM_FIELDS = ["n","titulo","categoria","fecha_recepcion","fecha_limite","resumen",
              "fuente","archivo","estado","responsable","ultima_actualizacion",
              "proxima_actualizacion","observaciones","kql","afecta_todas","archivado"]

def _norm_com(data):
    """Normaliza el flag booleano 'afecta a todas las suscripciones' a 0/1."""
    if "afecta_todas" in data:
        data["afecta_todas"] = 1 if data.get("afecta_todas") in (1, "1", True, "true", "on") else 0
    return data

def add_comunicado(data):
    con = db()
    _norm_com(data)
    if not data.get("titulo"): raise ValueError("titulo requerido")
    cols = [f for f in COM_FIELDS if f in data and f != "n"]  # 'n' se autoasigna
    q = f"INSERT INTO comunicados ({','.join(cols)},origen) VALUES ({','.join('?' for _ in cols)},'manual')"
    cur = con.execute(q, [data.get(f) for f in cols])
    cid = cur.lastrowid
    con.execute("UPDATE comunicados SET n=? WHERE id=?", (str(cid), cid))  # numero = id
    con.commit(); con.close()
    return {"id": cid}

def update_comunicado(cid, data):
    con = db()
    _norm_com(data)
    cols = [f for f in COM_FIELDS if f in data]
    if cols:
        con.execute(f"UPDATE comunicados SET {','.join(f+'=?' for f in cols)} WHERE id=?",
                    [data[f] for f in cols]+[cid])
        con.commit()
    con.close(); return {"ok": True}

def delete_comunicado(cid):
    con = db(); con.execute("DELETE FROM comunicados WHERE id=?", (cid,)); con.commit(); con.close()
    return {"ok": True}

# ---- clientes (base editable) ----
def list_clientes():
    con = db()
    cls = [dict(r) for r in con.execute("SELECT * FROM clientes ORDER BY LOWER(nombre)").fetchall()]
    # Evita el N+1 (2 queries por cliente): trae todo en 2 queries agregadas.
    subs_by_cli = {}
    for r in con.execute("SELECT id,nombre,sub_id,cliente_id FROM suscripciones ORDER BY nombre"):
        subs_by_cli.setdefault(r["cliente_id"], []).append(
            {"id": r["id"], "nombre": r["nombre"], "sub_id": r["sub_id"]})
    counts = {r["cliente"]: r["n"] for r in con.execute(
        "SELECT cliente, COUNT(*) AS n FROM recursos GROUP BY cliente")}
    con.close()
    for c in cls:
        c["suscripciones"] = subs_by_cli.get(c["id"], [])
        c["n_recursos"] = counts.get(c["nombre"], 0)
    return cls

def comunicados_de_cliente(cid):
    """Comunicados que afectan a un cliente: los que tienen recursos en alguna de sus
    suscripciones, MÁS todos los marcados 'afecta a todas las suscripciones' (todo Azure).
    Cada comunicado trae dos banderas: es_global (afecta a todas) y directo (toca sus subs)."""
    con = db()
    cli = con.execute("SELECT nombre FROM clientes WHERE id=?", (cid,)).fetchone()
    if not cli:
        con.close(); return {"cliente": None, "comunicados": []}
    cli_nombre = cli["nombre"]
    subs = con.execute("SELECT nombre, sub_id FROM suscripciones WHERE cliente_id=?", (cid,)).fetchall()
    nombres = [s["nombre"] for s in subs if (s["nombre"] or "").strip()]
    ids     = [s["sub_id"] for s in subs if (s["sub_id"] or "").strip()]

    # condiciones de coincidencia directa (por nombre de cliente, suscripción o id)
    conds, params = ["r.cliente = ?"], [cli_nombre]
    if nombres:
        conds.append("r.suscripcion IN (%s)" % ",".join("?" for _ in nombres)); params += nombres
    if ids:
        conds.append("r.suscripcion_id IN (%s)" % ",".join("?" for _ in ids)); params += ids
    where_rec = " OR ".join(conds)

    direct_ids = {r[0] for r in con.execute(
        f"SELECT DISTINCT comunicado_id FROM recursos r WHERE {where_rec}", params).fetchall()}
    global_ids = {r[0] for r in con.execute(
        "SELECT id FROM comunicados WHERE afecta_todas=1").fetchall()}

    todos = direct_ids | global_ids
    if not todos:
        con.close(); return {"cliente": cli_nombre, "comunicados": []}

    ph = ",".join("?" for _ in todos)
    rows = con.execute(
        f"""SELECT * FROM comunicados WHERE id IN ({ph})
            ORDER BY COALESCE(NULLIF(fecha_limite,''),'9999-99-99'), LOWER(titulo)""",
        list(todos)).fetchall()
    con.close()
    out = []
    for r in rows:
        d = dict(r)
        d["es_global"] = 1 if d["id"] in global_ids else 0
        d["directo"]   = 1 if d["id"] in direct_ids else 0
        out.append(d)
    return {"cliente": cli_nombre, "comunicados": out}

def suscripciones_sin_cliente():
    """Suscripciones presentes en recursos que no están mapeadas a ningún cliente."""
    con = db()
    rows = con.execute("""
      SELECT suscripcion, suscripcion_id,
             COUNT(*) AS n_recursos,
             COUNT(DISTINCT comunicado_id) AS n_comunicados
      FROM recursos
      WHERE COALESCE(cliente,'')=''
        AND (COALESCE(suscripcion,'')<>'' OR COALESCE(suscripcion_id,'')<>'')
      GROUP BY suscripcion, suscripcion_id
      ORDER BY n_recursos DESC
    """).fetchall()
    con.close()
    return [dict(r) for r in rows]

# ---- miembros (base para el login futuro) ----
def hash_pwd(p):
    """PBKDF2-SHA256 con sal por usuario. Formato guardado: 'salt$hash' (hex)."""
    salt = secrets.token_hex(8)
    h = hashlib.pbkdf2_hmac("sha256", p.encode("utf-8"), salt.encode("utf-8"), 100_000).hex()
    return salt + "$" + h

def verify_pwd(p, stored):
    if not stored or "$" not in stored: return False
    salt, h = stored.split("$", 1)
    calc = hashlib.pbkdf2_hmac("sha256", p.encode("utf-8"), salt.encode("utf-8"), 100_000).hex()
    return secrets.compare_digest(calc, h)

def list_miembros():
    con = db()
    rows = [dict(r) for r in con.execute(   # nunca se expone el hash de la contraseña
        "SELECT id,correo,nombre,apellido,created_at FROM miembros "
        "ORDER BY LOWER(apellido), LOWER(nombre), LOWER(correo)").fetchall()]
    con.close(); return rows

def add_miembro(data):
    correo = (data.get("correo") or "").strip().lower()
    nombre = (data.get("nombre") or "").strip()
    apellido = (data.get("apellido") or "").strip()
    pwd = data.get("password") or ""
    if not correo: raise ValueError("correo requerido")
    if "@" not in correo: raise ValueError("correo inválido")
    if not pwd: raise ValueError("contraseña requerida")
    con = db()
    try:
        cur = con.execute("INSERT INTO miembros(correo,nombre,apellido,pwd) VALUES(?,?,?,?)",
                          (correo, nombre, apellido, hash_pwd(pwd)))
    except IntegrityError:
        con.close(); raise ValueError("Ya existe un miembro con ese correo")
    con.commit(); mid = cur.lastrowid; con.close(); return {"id": mid}

def update_miembro(mid, data):
    correo = (data.get("correo") or "").strip().lower()
    nombre = (data.get("nombre") or "").strip()
    apellido = (data.get("apellido") or "").strip()
    pwd = data.get("password") or ""
    if not correo: raise ValueError("correo requerido")
    if "@" not in correo: raise ValueError("correo inválido")
    con = db()
    if not con.execute("SELECT 1 FROM miembros WHERE id=?", (mid,)).fetchone():
        con.close(); raise ValueError("miembro no existe")
    try:
        con.execute("UPDATE miembros SET correo=?,nombre=?,apellido=? WHERE id=?",
                    (correo, nombre, apellido, mid))
        if pwd:   # solo se cambia si se escribe una nueva
            con.execute("UPDATE miembros SET pwd=? WHERE id=?", (hash_pwd(pwd), mid))
    except IntegrityError:
        con.close(); raise ValueError("Ya existe un miembro con ese correo")
    con.commit(); con.close(); return {"ok": True}

def delete_miembro(mid):
    con = db(); con.execute("DELETE FROM miembros WHERE id=?", (mid,)); con.commit(); con.close()
    return {"ok": True}

# ---- sesiones / login (cada miembro ve SUS comunicados como 'responsable') ----
SESSIONS = {}   # sid -> {id, correo, nombre, apellido}

def login(data):
    correo = (data.get("correo") or "").strip().lower()
    pwd = data.get("password") or ""
    con = db()
    row = con.execute("SELECT id,correo,nombre,apellido,pwd FROM miembros WHERE correo=?",
                      (correo,)).fetchone()
    con.close()
    if not row or not verify_pwd(pwd, row["pwd"]):
        raise ValueError("Correo o contraseña incorrectos")
    sid = secrets.token_urlsafe(24)
    m = {"id": row["id"], "correo": row["correo"],
         "nombre": row["nombre"], "apellido": row["apellido"]}
    SESSIONS[sid] = m
    return sid, m

def member_from_sid(sid):
    return SESSIONS.get(sid) if sid else None

def update_mi_perfil(mid, data):
    """Cada miembro edita su propio nombre/apellido (no el de otros)."""
    nombre = (data.get("nombre") or "").strip()
    apellido = (data.get("apellido") or "").strip()
    con = db()
    con.execute("UPDATE miembros SET nombre=?, apellido=? WHERE id=?", (nombre, apellido, mid))
    con.commit(); con.close()
    return {"nombre": nombre, "apellido": apellido}

def change_password(mid, data):
    """Cambia la contraseña del propio miembro; exige la contraseña actual correcta."""
    actual = data.get("actual") or ""
    nueva = data.get("nueva") or ""
    if len(nueva) < 4:
        raise ValueError("La nueva contraseña debe tener al menos 4 caracteres")
    con = db()
    row = con.execute("SELECT pwd FROM miembros WHERE id=?", (mid,)).fetchone()
    if not row:
        con.close(); raise ValueError("miembro no existe")
    if not verify_pwd(actual, row["pwd"]):
        con.close(); raise ValueError("La contraseña actual es incorrecta")
    con.execute("UPDATE miembros SET pwd=? WHERE id=?", (hash_pwd(nueva), mid))
    con.commit(); con.close()
    return {"ok": True}

def mi_stats(responsable):
    """Dashboard personal: solo los comunicados donde el miembro es 'responsable'."""
    con = db(); c = con.cursor(); hoy = TODAY()
    com_ids = [r[0] for r in c.execute(
        "SELECT id FROM comunicados WHERE responsable=?", (responsable,)).fetchall()]
    tot_com = len(com_ids)
    empty = {"responsable": responsable, "hoy": hoy,
             "totales": {"comunicados": 0, "recursos": 0, "revisados": 0,
                         "pendientes": 0, "pct_revisado": 0, "vencidos": 0},
             "por_categoria": [], "proximos": [], "vencidos_list": [],
             "com_estado": {"sin_recursos": 0, "sin_revisar": 0, "en_progreso": 0, "completado": 0},
             "clientes_top": [], "clientes_afectados": 0}
    if not com_ids:
        con.close(); return empty
    ph = ",".join("?" for _ in com_ids)
    tot_rec = c.execute(f"SELECT COUNT(*) FROM recursos WHERE comunicado_id IN ({ph})", com_ids).fetchone()[0]
    rev = c.execute(f"SELECT COUNT(*) FROM recursos WHERE revisado=1 AND comunicado_id IN ({ph})", com_ids).fetchone()[0]
    vencidos = c.execute(
        f"SELECT COUNT(*) FROM comunicados WHERE fecha_limite IS NOT NULL AND fecha_limite < ? AND id IN ({ph})",
        [hoy]+com_ids).fetchone()[0]
    por_cat = [dict(r) for r in c.execute(f"""
      SELECT COALESCE(NULLIF(co.categoria,''),'Sin categoría') AS categoria,
             COUNT(DISTINCT co.id) AS comunicados,
             COUNT(r.id) AS recursos, COALESCE(SUM(r.revisado),0) AS revisados
      FROM comunicados co LEFT JOIN recursos r ON r.comunicado_id=co.id
      WHERE co.id IN ({ph}) GROUP BY 1 ORDER BY recursos DESC""", com_ids).fetchall()]
    prox = [dict(r) for r in c.execute(f"""
      SELECT id,n,titulo,categoria,fecha_limite,
        (SELECT COUNT(*) FROM recursos r WHERE r.comunicado_id=comunicados.id) AS n_recursos,
        (SELECT COUNT(*) FROM recursos r WHERE r.comunicado_id=comunicados.id AND r.revisado=1) AS n_revisados
      FROM comunicados WHERE fecha_limite IS NOT NULL AND fecha_limite >= ? AND id IN ({ph})
      ORDER BY fecha_limite LIMIT 8""", [hoy]+com_ids).fetchall()]
    vencidos_list = [dict(r) for r in c.execute(f"""
      SELECT id,n,titulo,categoria,fecha_limite,
        (SELECT COUNT(*) FROM recursos r WHERE r.comunicado_id=comunicados.id) AS n_recursos,
        (SELECT COUNT(*) FROM recursos r WHERE r.comunicado_id=comunicados.id AND r.revisado=1) AS n_revisados
      FROM comunicados WHERE fecha_limite IS NOT NULL AND fecha_limite < ? AND id IN ({ph})
      ORDER BY fecha_limite LIMIT 10""", [hoy]+com_ids).fetchall()]
    com_estado = {"sin_recursos": 0, "sin_revisar": 0, "en_progreso": 0, "completado": 0}
    for r in c.execute(f"""
      SELECT COUNT(r.id) AS n_rec, COALESCE(SUM(r.revisado),0) AS n_rev
      FROM comunicados co LEFT JOIN recursos r ON r.comunicado_id=co.id
      WHERE co.id IN ({ph}) GROUP BY co.id""", com_ids).fetchall():
        nr, nv = r["n_rec"], r["n_rev"]
        if nr == 0:    com_estado["sin_recursos"] += 1
        elif nv >= nr: com_estado["completado"]   += 1
        elif nv == 0:  com_estado["sin_revisar"]  += 1
        else:          com_estado["en_progreso"]  += 1
    cli_rows = [dict(r) for r in c.execute(f"""
      SELECT cliente, COUNT(*) AS recursos, COALESCE(SUM(revisado),0) AS revisados
      FROM recursos WHERE COALESCE(cliente,'')<>'' AND comunicado_id IN ({ph})
      GROUP BY cliente ORDER BY recursos DESC""", com_ids).fetchall()]
    con.close()
    return {"responsable": responsable, "hoy": hoy,
            "totales": {"comunicados": tot_com, "recursos": tot_rec, "revisados": rev,
                        "pendientes": tot_rec-rev,
                        "pct_revisado": round(rev*100/tot_rec, 1) if tot_rec else 0,
                        "vencidos": vencidos},
            "por_categoria": por_cat, "proximos": prox, "vencidos_list": vencidos_list,
            "com_estado": com_estado, "clientes_top": cli_rows[:10],
            "clientes_afectados": len(cli_rows)}

def rename_suscripcion_sin_cliente(data):
    """Edita el nombre/id de una suscripción huérfana (sin cliente) en los recursos.
    Si el nombre/id corregido ya mapea a un cliente conocido, los recursos se asignan."""
    old_n = data.get("suscripcion") or ""
    old_i = data.get("suscripcion_id") or ""
    new_n = (data.get("nuevo_nombre") or "").strip()
    new_i = (data.get("nuevo_id") or "").strip()
    if not new_n and not new_i:
        raise ValueError("nombre o id de suscripción requerido")
    cli = cliente_para(new_n, new_i)   # ¿el nombre/id corregido ya mapea a un cliente?
    con = db()
    con.execute("""UPDATE recursos SET suscripcion=?, suscripcion_id=?, cliente=?
        WHERE COALESCE(cliente,'')='' AND COALESCE(suscripcion,'')=? AND COALESCE(suscripcion_id,'')=?""",
        (new_n, new_i, cli or "", old_n, old_i))
    n = con.total_changes
    con.commit(); con.close()
    return {"ok": True, "recursos_actualizados": n, "recursos_asignados": n if cli else 0}

def add_cliente(data):
    nombre = (data.get("nombre") or "").strip()
    ext_id = (data.get("ext_id") or "").strip()
    if not nombre: raise ValueError("nombre requerido")
    con = db()
    try:
        cur = con.execute("INSERT INTO clientes(nombre,ext_id) VALUES(?,?)", (nombre, ext_id))
    except IntegrityError:
        con.close(); raise ValueError("Ya existe un cliente con ese nombre")
    con.commit(); cid = cur.lastrowid; con.close(); reload_cli_map()
    return {"id": cid}

def update_cliente(cid, data):
    nombre = (data.get("nombre") or "").strip()
    ext_id = (data.get("ext_id") or "").strip()
    if not nombre: raise ValueError("nombre requerido")
    con = db()
    old = con.execute("SELECT nombre FROM clientes WHERE id=?", (cid,)).fetchone()
    if not old: con.close(); raise ValueError("cliente no existe")
    try:
        con.execute("UPDATE clientes SET nombre=?, ext_id=? WHERE id=?", (nombre, ext_id, cid))
    except IntegrityError:
        con.close(); raise ValueError("Ya existe un cliente con ese nombre")
    con.execute("UPDATE recursos SET cliente=? WHERE cliente=?", (nombre, old["nombre"]))
    con.commit(); con.close(); reload_cli_map()
    return {"ok": True}

def delete_cliente(cid):
    con = db(); con.execute("DELETE FROM clientes WHERE id=?", (cid,)); con.commit(); con.close(); reload_cli_map()
    return {"ok": True}

def add_suscripcion(cid, data):
    nombre = (data.get("nombre") or "").strip()
    sid = (data.get("sub_id") or "").strip()
    if not nombre and not sid: raise ValueError("nombre o id de suscripción requerido")
    con = db()
    cl = con.execute("SELECT nombre FROM clientes WHERE id=?", (cid,)).fetchone()
    if not cl: con.close(); raise ValueError("cliente no existe")
    con.execute("INSERT INTO suscripciones(cliente_id,nombre,sub_id) VALUES(?,?,?)", (cid, nombre, sid))
    n = 0
    if nombre:  # asocia recursos ya cargados con esa suscripción a este cliente
        con.execute("UPDATE recursos SET cliente=? WHERE suscripcion=?", (cl["nombre"], nombre))
        n = con.total_changes
    con.commit(); con.close(); reload_cli_map()
    return {"ok": True, "recursos_asociados": n}

def update_suscripcion(sid, data):
    nombre = (data.get("nombre") or "").strip()
    sub_id = (data.get("sub_id") or "").strip()
    if not nombre and not sub_id: raise ValueError("nombre o id de suscripción requerido")
    con = db()
    row = con.execute("""SELECT c.nombre AS cli FROM suscripciones s
                         JOIN clientes c ON s.cliente_id=c.id WHERE s.id=?""", (sid,)).fetchone()
    if not row: con.close(); raise ValueError("suscripción no existe")
    con.execute("UPDATE suscripciones SET nombre=?, sub_id=? WHERE id=?", (nombre, sub_id, sid))
    n = 0
    if nombre:
        con.execute("UPDATE recursos SET cliente=? WHERE suscripcion=?", (row["cli"], nombre))
        n = con.total_changes
    con.commit(); con.close(); reload_cli_map()
    return {"ok": True, "recursos_asociados": n}

def delete_suscripcion(sid):
    con = db(); con.execute("DELETE FROM suscripciones WHERE id=?", (sid,)); con.commit(); con.close(); reload_cli_map()
    return {"ok": True}

def add_recurso(cid, data):
    con = db()
    cli = cliente_para(data.get("suscripcion",""), data.get("suscripcion_id",""))
    ts = NOW()
    # cada alta manual crea su propio lote (sin campo nota)
    inv = con.execute(
        "INSERT INTO inventarios(comunicado_id,fecha,kql,created_at) VALUES(?,?,?,?)",
        (cid, ts, "", ts)).lastrowid
    con.execute("""INSERT INTO recursos
      (comunicado_id,hoja,cliente,suscripcion,suscripcion_id,grupo_recurso,nombre_recurso,gestor,estado,extra,revisado,notas,created_at,inventario_id)
      VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?)""",
      (cid, data.get("hoja","manual"), cli, data.get("suscripcion",""), data.get("suscripcion_id",""),
       data.get("grupo_recurso",""), data.get("nombre_recurso",""), data.get("gestor",""),
       data.get("estado",""), "{}", 1 if data.get("revisado") else 0, data.get("notas",""), ts, inv))
    con.commit(); con.close(); return {"ok": True}

def _read_table(ext, raw):
    """Devuelve (header:list[str], rows:list[list[str]]) desde CSV o XLSX."""
    ext = (ext or "").lower().lstrip(".")
    if ext == "csv" or ext == "txt":
        text = raw.decode("utf-8-sig", errors="replace")
        sample = text[:3000]
        delim = ";" if sample.count(";") > sample.count(",") else ","
        rows = [[ie.to_str(c) for c in r] for r in csv.reader(io.StringIO(text), delimiter=delim)]
    elif ext in ("xlsx", "xlsm"):
        import openpyxl
        wb = openpyxl.load_workbook(io.BytesIO(raw), read_only=True, data_only=True)
        # elige la hoja con mas filas util
        best, bestn = None, -1
        for ws in wb.worksheets:
            n = ws.max_row or 0
            if n > bestn:
                best, bestn = ws, n
        rows = [[ie.to_str(c) for c in r] for r in best.iter_rows(values_only=True)]
        wb.close()
    else:
        raise ValueError("Formato no soportado: usa .csv o .xlsx")
    rows = [r for r in rows if any(c.strip() for c in r)]
    if not rows:
        raise ValueError("El archivo esta vacio.")
    hidx = ie.header_row(rows)
    header = rows[hidx]
    last = len(header)
    while last > 0 and header[last - 1].strip() == "":
        last -= 1
    return header[:last], [r[:last] for r in rows[hidx + 1:]]


def import_recursos(cid, ext, raw, replace=False, kql=""):
    con = db()
    if not con.execute("SELECT 1 FROM comunicados WHERE id=?", (cid,)).fetchone():
        con.close(); raise ValueError("Comunicado no existe.")
    header, data = _read_table(ext, raw)
    hn = [ie.norm(h) for h in header]
    i_subn = ie.match_col(hn, ie.SUB_NAME)
    i_subid = ie.match_col(hn, ie.SUB_ID)
    i_rg = ie.match_col(hn, ie.RG)
    i_res = ie.match_col(hn, ie.RES)
    i_gestor = ie.match_col(hn, ie.GESTOR, loose=False)
    i_estado = ie.match_col(hn, ie.ESTADO, loose=False)

    missing = []
    if i_subn is None and i_subid is None: missing.append("Suscripción")
    if i_rg is None: missing.append("Grupo de Recurso (RG)")
    if i_res is None: missing.append("Nombre del Recurso")
    if missing:
        con.close()
        raise ValueError("Faltan columnas obligatorias: " + ", ".join(missing) +
                         ". Columnas detectadas en el archivo: " + ", ".join(h for h in header if h))

    used = {i for i in (i_subn, i_subid, i_rg, i_res, i_gestor, i_estado) if i is not None}
    if replace:   # empezar de cero: borra recursos y lotes anteriores
        con.execute("DELETE FROM recursos WHERE comunicado_id=?", (cid,))
        con.execute("DELETE FROM inventarios WHERE comunicado_id=?", (cid,))
    ts = NOW()   # un solo sello para todo el lote = un evento de inventariado
    inv = con.execute("INSERT INTO inventarios(comunicado_id,fecha,kql,created_at) VALUES(?,?,?,?)",
                      (cid, ts, kql or "", ts)).lastrowid
    n = 0
    for r in data:
        cell = lambda i: r[i] if (i is not None and i < len(r)) else ""
        res = cell(i_res)
        if not (res or cell(i_rg) or cell(i_subn)):
            continue
        extra = {header[i]: r[i] for i in range(min(len(header), len(r)))
                 if i not in used and i < len(r) and r[i].strip()}
        estado = cell(i_estado)
        revisado = 1 if any(w in estado.lower() for w in ie.DONE_WORDS) else 0
        cli = cliente_para(cell(i_subn), cell(i_subid))   # cliente derivado de la suscripcion
        con.execute("""INSERT INTO recursos
          (comunicado_id,hoja,cliente,suscripcion,suscripcion_id,grupo_recurso,nombre_recurso,gestor,estado,extra,revisado,created_at,inventario_id)
          VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?)""",
          (cid, "importado", cli, cell(i_subn), cell(i_subid), cell(i_rg), res,
           cell(i_gestor), estado, json.dumps(extra, ensure_ascii=False), revisado, ts, inv))
        n += 1
    if n == 0:   # nada válido: no dejes un lote vacío
        con.execute("DELETE FROM inventarios WHERE id=?", (inv,))
    con.commit(); con.close()
    return {"ok": True, "importados": n, "reemplazado": replace, "inventario_id": inv,
            "columnas": {"suscripcion": header[i_subn] if i_subn is not None else (header[i_subid] if i_subid is not None else None),
                         "rg": header[i_rg], "recurso": header[i_res]}}


def patch_recurso(rid, data):
    con = db(); sets=[]; vals=[]
    for f in ("revisado","estado","gestor","notas"):
        if f in data:
            sets.append(f+"=?"); vals.append(1 if (f=="revisado" and data[f]) else (0 if f=="revisado" else data[f]))
    if "revisado" in data:
        sets.append("revisado_at=?"); vals.append(datetime.datetime.now().isoformat(timespec="seconds") if data["revisado"] else None)
        sets.append("revisado_por=?"); vals.append(data.get("revisado_por","usuario") if data["revisado"] else None)
    if sets:
        con.execute(f"UPDATE recursos SET {','.join(sets)} WHERE id=?", vals+[rid]); con.commit()
    con.close(); return {"ok": True}

def bulk_review(data):
    """Marca revisado por lista de ids, o por comunicado + suscripcion."""
    con = db(); val = 1 if data.get("revisado", True) else 0
    who = data.get("revisado_por","usuario")
    at = datetime.datetime.now().isoformat(timespec="seconds") if val else None
    if data.get("ids"):
        ph = ",".join("?" for _ in data["ids"])
        con.execute(f"UPDATE recursos SET revisado=?,revisado_at=?,revisado_por=? WHERE id IN ({ph})",
                    [val,at,who]+data["ids"])
    elif "comunicado_id" in data:
        if data.get("suscripcion"):
            con.execute("UPDATE recursos SET revisado=?,revisado_at=?,revisado_por=? WHERE comunicado_id=? AND suscripcion=?",
                        (val,at,who,data["comunicado_id"],data["suscripcion"]))
        else:
            con.execute("UPDATE recursos SET revisado=?,revisado_at=?,revisado_por=? WHERE comunicado_id=?",
                        (val,at,who,data["comunicado_id"]))
    n = con.total_changes; con.commit(); con.close()
    return {"ok": True, "actualizados": n}

# ------------------------- HTTP -------------------------
class H(BaseHTTPRequestHandler):
    def log_message(self, *a): pass
    def _send(self, code, body, ctype="application/json", extra_headers=None):
        if ctype == "application/json": body = json.dumps(body, ensure_ascii=False).encode("utf-8")
        elif isinstance(body, str): body = body.encode("utf-8")
        self.send_response(code)
        self.send_header("Content-Type", ctype+"; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        for k, v in (extra_headers or []):
            self.send_header(k, v)
        self.end_headers(); self.wfile.write(body)
    def _sid(self):
        for part in (self.headers.get("Cookie", "") or "").split(";"):
            k, _, v = part.strip().partition("=")
            if k == "sid": return v
        return None
    def _me(self):
        return member_from_sid(self._sid())
    def _who(self):
        # Nombre a estampar en "revisado por": el usuario autenticado (no lo que mande el cliente).
        me = self._me() or {}
        return (f"{me.get('nombre','') or ''} {me.get('apellido','') or ''}").strip() or me.get("correo") or "usuario"
    def _json_body(self):
        n = int(self.headers.get("Content-Length", 0))
        return json.loads(self.rfile.read(n) or "{}") if n else {}
    def _static(self, path):
        fp = os.path.join(HERE, "index.html" if path in ("/", "") else path.lstrip("/"))
        fp = os.path.normpath(fp)
        # SPA: si no es un archivo real (y no es /api), sirve index.html para que el router del cliente resuelva la ruta
        if not fp.startswith(HERE) or not os.path.isfile(fp):
            fp = os.path.join(HERE, "index.html")
        ext = os.path.splitext(fp)[1]
        ct = {".html":"text/html",".js":"application/javascript",".css":"text/css",
              ".png":"image/png",".jpg":"image/jpeg",".svg":"image/svg+xml",".ico":"image/x-icon"}.get(ext,"application/octet-stream")
        if ct.startswith("image/"):   # binario: no decodificar
            with open(fp, "rb") as f:
                data = f.read()
            self.send_response(200)
            self.send_header("Content-Type", ct)
            self.send_header("Content-Length", str(len(data)))
            self.end_headers(); self.wfile.write(data)
            return
        with open(fp, "rb") as f: self._send(200, f.read().decode("utf-8"), ct)

    def do_GET(self):
        p = urlparse(self.path).path
        try:
            with LOCK:
                if p == "/api/me": return self._send(200, {"miembro": self._me()})
                # Login obligatorio: toda la API (salvo /api/me) exige sesión activa.
                if p.startswith("/api/") and not self._me():
                    return self._send(401, {"error": "no autenticado"})
                if p == "/api/mi-stats":
                    me = self._me()
                    if not me: return self._send(401, {"error": "no autenticado"})
                    resp = (f"{me['nombre'] or ''} {me['apellido'] or ''}").strip()
                    return self._send(200, mi_stats(resp))
                if p == "/api/stats": return self._send(200, stats())
                if p == "/api/clientes": return self._send(200, list_clientes())
                m = re.match(r"/api/clientes/(\d+)/comunicados$", p)
                if m: return self._send(200, comunicados_de_cliente(int(m.group(1))))
                if p == "/api/miembros": return self._send(200, list_miembros())
                if p == "/api/suscripciones-sin-cliente": return self._send(200, suscripciones_sin_cliente())
                if p == "/api/comunicados": return self._send(200, list_comunicados())
                m = re.match(r"/api/comunicados/(\d+)/recursos$", p)
                if m: return self._send(200, get_recursos(int(m.group(1))))
                m = re.match(r"/api/comunicados/(\d+)/inventarios$", p)
                if m: return self._send(200, list_inventarios(int(m.group(1))))
                m = re.match(r"/api/comunicados/(\d+)$", p)
                if m:
                    con=db(); row=con.execute("SELECT * FROM comunicados WHERE id=?", (int(m.group(1)),)).fetchone(); con.close()
                    return self._send(200, dict(row) if row else {})
            if p.startswith("/api/"):   # ruta API desconocida: JSON claro, no el HTML del SPA
                return self._send(404, {"error": "ruta no encontrada: " + p})
            return self._static(p)
        except Exception as e:
            return self._send(500, {"error": str(e)})

    def do_POST(self):
        parsed = urlparse(self.path)
        p = parsed.path
        # Login obligatorio: solo /api/login es público; el resto exige sesión.
        if p.startswith("/api/") and p != "/api/login" and not self._me():
            return self._send(401, {"error": "no autenticado"})
        m_imp = re.match(r"/api/comunicados/(\d+)/import$", p)
        if m_imp:
            try:
                n = int(self.headers.get("Content-Length", 0))
                raw = self.rfile.read(n) if n else b""
                ext = self.headers.get("X-Ext", "csv")
                qs = parse_qs(parsed.query)
                replace = "replace" in qs
                kql = (qs.get("kql") or [""])[0]
                with LOCK:
                    return self._send(200, import_recursos(int(m_imp.group(1)), ext, raw, replace, kql))
            except Exception as e:
                return self._send(400, {"error": str(e)})
        try:
            data = self._json_body()
            with LOCK:
                if p == "/api/login":
                    sid, m = login(data)
                    return self._send(200, {"miembro": m},
                                      extra_headers=[("Set-Cookie", f"sid={sid}; Path=/; HttpOnly; SameSite=Lax")])
                if p == "/api/logout":
                    SESSIONS.pop(self._sid(), None)
                    return self._send(200, {"ok": True},
                                      extra_headers=[("Set-Cookie", "sid=; Path=/; Max-Age=0")])
                if p == "/api/cambiar-password":
                    return self._send(200, change_password(self._me()["id"], data))
                if p == "/api/mi-perfil":
                    me = self._me()
                    r = update_mi_perfil(me["id"], data)
                    me["nombre"] = r["nombre"]; me["apellido"] = r["apellido"]  # refresca la sesión
                    return self._send(200, {"miembro": me})
                if p == "/api/comunicados": return self._send(201, add_comunicado(data))
                if p == "/api/clientes": return self._send(201, add_cliente(data))
                if p == "/api/miembros": return self._send(201, add_miembro(data))
                if p == "/api/recursos/bulk-review":
                    data["revisado_por"] = self._who()
                    return self._send(200, bulk_review(data))
                m = re.match(r"/api/clientes/(\d+)/suscripciones$", p)
                if m: return self._send(201, add_suscripcion(int(m.group(1)), data))
                m = re.match(r"/api/comunicados/(\d+)/recursos$", p)
                if m: return self._send(201, add_recurso(int(m.group(1)), data))
            return self._send(404, {"error":"ruta no encontrada"})
        except Exception as e:
            return self._send(400, {"error": str(e)})

    def do_PUT(self):
        p = urlparse(self.path).path
        if not self._me(): return self._send(401, {"error": "no autenticado"})
        if p == "/api/suscripciones-sin-cliente":
            try:
                with LOCK: return self._send(200, rename_suscripcion_sin_cliente(self._json_body()))
            except Exception as e: return self._send(400, {"error": str(e)})
        m = re.match(r"/api/comunicados/(\d+)$", p)
        if m:
            try:
                with LOCK: return self._send(200, update_comunicado(int(m.group(1)), self._json_body()))
            except Exception as e: return self._send(400, {"error": str(e)})
        m = re.match(r"/api/clientes/(\d+)$", p)
        if m:
            try:
                with LOCK: return self._send(200, update_cliente(int(m.group(1)), self._json_body()))
            except Exception as e: return self._send(400, {"error": str(e)})
        m = re.match(r"/api/suscripciones/(\d+)$", p)
        if m:
            try:
                with LOCK: return self._send(200, update_suscripcion(int(m.group(1)), self._json_body()))
            except Exception as e: return self._send(400, {"error": str(e)})
        m = re.match(r"/api/inventarios/(\d+)$", p)
        if m:
            try:
                with LOCK: return self._send(200, update_inventario(int(m.group(1)), self._json_body()))
            except Exception as e: return self._send(400, {"error": str(e)})
        m = re.match(r"/api/miembros/(\d+)$", p)
        if m:
            try:
                with LOCK: return self._send(200, update_miembro(int(m.group(1)), self._json_body()))
            except Exception as e: return self._send(400, {"error": str(e)})
        return self._send(404, {"error":"ruta"})

    def do_PATCH(self):
        if not self._me(): return self._send(401, {"error": "no autenticado"})
        m = re.match(r"/api/recursos/(\d+)$", urlparse(self.path).path)
        if not m: return self._send(404, {"error":"ruta"})
        try:
            data = self._json_body(); data["revisado_por"] = self._who()
            with LOCK: return self._send(200, patch_recurso(int(m.group(1)), data))
        except Exception as e: return self._send(400, {"error": str(e)})

    def do_DELETE(self):
        p = urlparse(self.path).path
        if not self._me(): return self._send(401, {"error": "no autenticado"})
        for rx, fn in ((r"/api/comunicados/(\d+)$", delete_comunicado),
                       (r"/api/clientes/(\d+)$", delete_cliente),
                       (r"/api/suscripciones/(\d+)$", delete_suscripcion),
                       (r"/api/inventarios/(\d+)$", delete_inventario),
                       (r"/api/miembros/(\d+)$", delete_miembro)):
            m = re.match(rx, p)
            if m:
                try:
                    with LOCK: return self._send(200, fn(int(m.group(1))))
                except Exception as e: return self._send(400, {"error": str(e)})
        return self._send(404, {"error":"ruta"})

if __name__ == "__main__":
    ensure_schema()
    reload_cli_map()
    # En Azure App Service (Linux) la plataforma inyecta PORT y hay que escuchar
    # en 0.0.0.0. En local se usa 127.0.0.1 con el puerto por argumento/8765.
    port = int(os.environ.get("PORT", PORT))
    host = "0.0.0.0" if os.environ.get("PORT") or os.environ.get("WEBSITE_SITE_NAME") else "127.0.0.1"
    print(f"Plataforma Upgrade MS  ->  http://{host}:{port}")
    print("Ctrl+C para detener.")
    ThreadingHTTPServer((host, port), H).serve_forever()
