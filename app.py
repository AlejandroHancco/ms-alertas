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
    con.close()
    return [dict(r) for r in rows]

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
    for f in ("kql","nota","fecha"):
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
    con.close()
    return {
        "totales": {"comunicados": tot_com, "recursos": tot_rec, "revisados": rev,
                    "pendientes": tot_rec-rev, "com_con_recursos": com_con,
                    "pct_revisado": round(rev*100/tot_rec,1) if tot_rec else 0,
                    "vencidos": vencidos},
        "por_categoria": por_cat, "por_suscripcion": por_sub,
        "proximos": prox, "vencidos_list": vencidos_list, "hoy": hoy,
    }

# ------------------------- mutaciones -------------------------
COM_FIELDS = ["n","titulo","categoria","fecha_recepcion","fecha_limite","resumen",
              "fuente","archivo","estado","responsable","ultima_actualizacion",
              "proxima_actualizacion","observaciones","kql"]

def add_comunicado(data):
    con = db()
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
    for c in cls:
        c["suscripciones"] = [dict(r) for r in con.execute(
            "SELECT id,nombre,sub_id FROM suscripciones WHERE cliente_id=? ORDER BY nombre", (c["id"],)).fetchall()]
        c["n_recursos"] = con.execute("SELECT COUNT(*) FROM recursos WHERE cliente=?", (c["nombre"],)).fetchone()[0]
    con.close()
    return cls

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
    # agrupa las altas manuales del dia en un mismo lote
    inv = con.execute("""SELECT id FROM inventarios
        WHERE comunicado_id=? AND nota='Altas manuales'
          AND left(fecha,10)=to_char(now(),'YYYY-MM-DD')""", (cid,)).fetchone()
    inv = inv[0] if inv else con.execute(
        "INSERT INTO inventarios(comunicado_id,fecha,kql,nota,created_at) VALUES(?,?,?,?,?)",
        (cid, ts, "", "Altas manuales", ts)).lastrowid
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


def import_recursos(cid, ext, raw, replace=False, kql="", nota=""):
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
    inv = con.execute("INSERT INTO inventarios(comunicado_id,fecha,kql,nota,created_at) VALUES(?,?,?,?,?)",
                      (cid, ts, kql or "", nota or "", ts)).lastrowid
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
    def _send(self, code, body, ctype="application/json"):
        if ctype == "application/json": body = json.dumps(body, ensure_ascii=False).encode("utf-8")
        elif isinstance(body, str): body = body.encode("utf-8")
        self.send_response(code)
        self.send_header("Content-Type", ctype+"; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers(); self.wfile.write(body)
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
                if p == "/api/stats": return self._send(200, stats())
                if p == "/api/clientes": return self._send(200, list_clientes())
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
        m_imp = re.match(r"/api/comunicados/(\d+)/import$", p)
        if m_imp:
            try:
                n = int(self.headers.get("Content-Length", 0))
                raw = self.rfile.read(n) if n else b""
                ext = self.headers.get("X-Ext", "csv")
                qs = parse_qs(parsed.query)
                replace = "replace" in qs
                kql = (qs.get("kql") or [""])[0]
                nota = (qs.get("nota") or [""])[0]
                with LOCK:
                    return self._send(200, import_recursos(int(m_imp.group(1)), ext, raw, replace, kql, nota))
            except Exception as e:
                return self._send(400, {"error": str(e)})
        try:
            data = self._json_body()
            with LOCK:
                if p == "/api/comunicados": return self._send(201, add_comunicado(data))
                if p == "/api/clientes": return self._send(201, add_cliente(data))
                if p == "/api/miembros": return self._send(201, add_miembro(data))
                if p == "/api/recursos/bulk-review": return self._send(200, bulk_review(data))
                m = re.match(r"/api/clientes/(\d+)/suscripciones$", p)
                if m: return self._send(201, add_suscripcion(int(m.group(1)), data))
                m = re.match(r"/api/comunicados/(\d+)/recursos$", p)
                if m: return self._send(201, add_recurso(int(m.group(1)), data))
            return self._send(404, {"error":"ruta no encontrada"})
        except Exception as e:
            return self._send(400, {"error": str(e)})

    def do_PUT(self):
        p = urlparse(self.path).path
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
        m = re.match(r"/api/recursos/(\d+)$", urlparse(self.path).path)
        if not m: return self._send(404, {"error":"ruta"})
        try:
            with LOCK: return self._send(200, patch_recurso(int(m.group(1)), self._json_body()))
        except Exception as e: return self._send(400, {"error": str(e)})

    def do_DELETE(self):
        p = urlparse(self.path).path
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
