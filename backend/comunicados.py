# -*- coding: utf-8 -*-
"""Comunicados: listado con avance (último lote), CRUD, 'afecta a todo Azure' y papelera."""
import json

from . import db

COM_FIELDS = ["n", "titulo", "categoria", "fecha_recepcion", "fecha_limite", "resumen",
              "fuente", "archivo", "estado", "responsable", "ultima_actualizacion",
              "proxima_actualizacion", "observaciones", "kql", "afecta_todas", "archivado"]


def list_comunicados():
    """Comunicados con sus conteos. TODO lo revisado (recursos, clientes, suscripciones) y
    los filtros de cliente/suscripción salen SOLO del último lote (vista recursos_ult)."""
    with db.tx() as con:
        latest = {r["comunicado_id"]: r["created_at"] for r in con.execute("""
            SELECT DISTINCT ON (comunicado_id) comunicado_id, created_at
            FROM inventarios ORDER BY comunicado_id, created_at DESC, id DESC""")}
        base = con.execute("""
          SELECT c.*, (SELECT COUNT(*) FROM inventarios i WHERE i.comunicado_id=c.id) AS n_inventarios
          FROM comunicados c ORDER BY (c.fecha_limite IS NULL), c.fecha_limite, c.id""").fetchall()
        agg = {r["comunicado_id"]: r for r in con.execute("""
            SELECT comunicado_id, COUNT(*) AS n, COALESCE(SUM(revisado),0) AS rev,
              ARRAY_AGG(DISTINCT cliente)     FILTER (WHERE COALESCE(cliente,'')<>'')     AS clientes,
              ARRAY_AGG(DISTINCT suscripcion) FILTER (WHERE COALESCE(suscripcion,'')<>'') AS suscripciones
            FROM recursos_ult GROUP BY comunicado_id""")}
        # clientes / suscripciones afectados y cuántos están 100% revisados
        rev_cli = _rev_por(con, "cliente", "COALESCE(cliente,'')<>''")
        rev_sub = _rev_por(con, "suscripcion", "COALESCE(suscripcion,'')<>'' AND COALESCE(cliente,'')<>''")
    for d in base:
        cid = d["id"]
        a = agg.get(cid) or {}
        d["n_recursos"], d["n_revisados"] = a.get("n", 0), a.get("rev", 0)
        d["clientes"] = list(a.get("clientes") or [])
        d["suscripciones"] = list(a.get("suscripciones") or [])
        d["n_clientes"], d["n_clientes_rev"] = rev_cli.get(cid, (0, 0))
        d["n_subs"], d["n_subs_rev"] = rev_sub.get(cid, (0, 0))
        d["ultima_revision"] = latest.get(cid)   # created_at del último lote
    return base


def _rev_por(con, col, cond):
    return {r["comunicado_id"]: (r["n"], r["n_rev"]) for r in con.execute(f"""
        SELECT comunicado_id, COUNT(*) AS n, COUNT(*) FILTER (WHERE rev = tot) AS n_rev
        FROM (SELECT comunicado_id, {col}, COUNT(*) AS tot, COALESCE(SUM(revisado),0) AS rev
              FROM recursos_ult WHERE {cond} GROUP BY comunicado_id, {col}) t
        GROUP BY comunicado_id""")}


def get_comunicado(cid):
    return db.one("SELECT * FROM comunicados WHERE id=%s", (cid,)) or {}


def _norm_com(data):
    """Normaliza el flag 'afecta a todo Azure' a 0/1."""
    if "afecta_todas" in data:
        data["afecta_todas"] = 1 if data.get("afecta_todas") in (1, "1", True, "true", "on") else 0
    return data


def add_comunicado(data):
    _norm_com(data)
    if not data.get("titulo"):
        raise ValueError("titulo requerido")
    cols = [f for f in COM_FIELDS if f in data and f != "n"]   # 'n' = id, se autoasigna
    with db.tx() as con:
        cid = con.execute(
            f"INSERT INTO comunicados ({','.join(cols + ['origen'])}) "
            f"VALUES ({','.join(['%s'] * len(cols))},'manual') RETURNING id",
            [data.get(f) for f in cols]).fetchone()["id"]
        con.execute("UPDATE comunicados SET n=%s WHERE id=%s", (str(cid), cid))
    if data.get("afecta_todas"):
        sync_todo_azure(cid)   # 1 placeholder por cliente
    return {"id": cid}


def update_comunicado(cid, data):
    _norm_com(data)
    cols = [f for f in COM_FIELDS if f in data]
    if cols:
        db.run(f"UPDATE comunicados SET {','.join(f + '=%s' for f in cols)} WHERE id=%s",
               [data[f] for f in cols] + [cid])
    if "afecta_todas" in data:
        sync_todo_azure(cid)   # ajusta los placeholders al cambiar el flag
    return {"ok": True}


def sync_todo_azure(cid):
    """Comunicado 'Afecta a todo Azure': asegura 1 recurso-placeholder por cliente
    (suscripción = 'Afecta a todo Azure') para marcarlo revisado y llevar la cuenta.
    Con el flag apagado, elimina esos placeholders."""
    with db.tx() as con:
        row = con.execute("SELECT afecta_todas FROM comunicados WHERE id=%s", (cid,)).fetchone()
        if not row:
            return {"ok": False, "creados": 0}
        if not row["afecta_todas"]:
            con.execute("DELETE FROM recursos WHERE comunicado_id=%s AND hoja='todo-azure'", (cid,))
            return {"ok": True, "creados": 0}
        clientes = [r["nombre"] for r in con.execute(
            "SELECT nombre FROM clientes WHERE COALESCE(nombre,'')<>'' ORDER BY LOWER(nombre)")]
        existing = {r["cliente"] for r in con.execute(
            "SELECT DISTINCT cliente FROM recursos WHERE comunicado_id=%s AND hoja='todo-azure'", (cid,))}
        faltan = [c for c in clientes if c not in existing]
        if faltan:
            ts = db.now()
            invrow = con.execute("""SELECT inventario_id FROM recursos WHERE comunicado_id=%s
                AND hoja='todo-azure' AND inventario_id IS NOT NULL LIMIT 1""", (cid,)).fetchone()
            inv = invrow["inventario_id"] if invrow else con.execute(
                "INSERT INTO inventarios(comunicado_id,fecha,kql,created_at) VALUES(%s,%s,'',%s) RETURNING id",
                (cid, ts, ts)).fetchone()["id"]
            with con.cursor() as cur:
                cur.executemany("""INSERT INTO recursos
                  (comunicado_id,hoja,cliente,suscripcion,suscripcion_id,grupo_recurso,nombre_recurso,
                   gestor,estado,extra,revisado,created_at,inventario_id)
                  VALUES(%s,'todo-azure',%s,'Afecta a todo Azure','','','(todo Azure)','','','{}',0,%s,%s)""",
                  [(cid, cn, ts, inv) for cn in faltan])
    return {"ok": True, "creados": len(faltan)}


# ---------------- papelera ----------------
def delete_comunicado(cid, who="usuario"):
    """Mueve el comunicado a la papelera: guarda una copia completa (comunicado +
    inventarios + recursos, con sus ids) y lo borra de las tablas vivas, así el resto
    de la plataforma no necesita filtrar eliminados."""
    with db.tx() as con:
        com = con.execute("SELECT * FROM comunicados WHERE id=%s", (cid,)).fetchone()
        if not com:
            raise ValueError("comunicado no existe")
        datos = {
            "comunicado": com,
            "inventarios": con.execute("SELECT * FROM inventarios WHERE comunicado_id=%s ORDER BY id", (cid,)).fetchall(),
            "recursos": con.execute("SELECT * FROM recursos WHERE comunicado_id=%s ORDER BY id", (cid,)).fetchall(),
        }
        con.execute("""INSERT INTO papelera(comunicado_id,titulo,datos,eliminado_por,eliminado_at)
                       VALUES(%s,%s,%s,%s,%s)""",
                    (cid, com["titulo"], json.dumps(datos, ensure_ascii=False), who, db.now()))
        con.execute("DELETE FROM comunicados WHERE id=%s", (cid,))
    return {"ok": True}


def list_papelera():
    out = []
    for r in db.rows("SELECT * FROM papelera ORDER BY eliminado_at DESC, id DESC"):
        d = json.loads(r["datos"] or "{}")
        c = d.get("comunicado") or {}
        out.append({"id": r["id"], "comunicado_id": r["comunicado_id"], "titulo": r["titulo"],
                    "categoria": c.get("categoria"), "responsable": c.get("responsable"),
                    "n_inventarios": len(d.get("inventarios") or []),
                    "n_recursos": len(d.get("recursos") or []),
                    "eliminado_por": r["eliminado_por"], "eliminado_at": r["eliminado_at"]})
    return out


def _insert_rows(con, table, items):
    """Reinserta filas con sus ids originales (columnas tomadas del propio dict)."""
    for row in items:
        cols = list(row.keys())
        con.execute(f"INSERT INTO {table}({','.join(cols)}) VALUES({','.join(['%s'] * len(cols))})",
                    [row[c] for c in cols])


def restore_papelera(pid):
    """Reinserta el comunicado con sus mismos ids (y sus inventarios/recursos)."""
    with db.tx() as con:
        r = con.execute("SELECT datos FROM papelera WHERE id=%s", (pid,)).fetchone()
        if not r:
            raise ValueError("no está en la papelera")
        d = json.loads(r["datos"] or "{}")
        com = d["comunicado"]
        if con.execute("SELECT 1 FROM comunicados WHERE id=%s", (com["id"],)).fetchone():
            raise ValueError(f"Ya existe un comunicado #{com['id']}")
        _insert_rows(con, "comunicados", [com])
        _insert_rows(con, "inventarios", d.get("inventarios") or [])
        _insert_rows(con, "recursos", d.get("recursos") or [])
        con.execute("DELETE FROM papelera WHERE id=%s", (pid,))
    return {"ok": True, "comunicado_id": com["id"]}


def purge_papelera(pid=None):
    """Elimina definitivamente un elemento de la papelera (o todos si pid es None)."""
    n = db.run("DELETE FROM papelera") if pid is None else db.run("DELETE FROM papelera WHERE id=%s", (pid,))
    return {"ok": True, "eliminados": n}
