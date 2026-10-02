# -*- coding: utf-8 -*-
"""Clientes, sus suscripciones y las suscripciones huérfanas (sin cliente)."""
from . import db, parsing


# ---------------- mapa suscripción -> cliente ----------------
class ClienteMap:
    """Mapa suscripción -> cliente leído de la base. Se construye por operación (no hay
    estado global), así cualquier worker ve siempre los clientes actuales."""

    def __init__(self, con):
        self.by_name, self.by_id = {}, {}
        for r in con.execute("""SELECT c.nombre AS cliente, s.nombre, s.sub_id
                                FROM suscripciones s JOIN clientes c ON s.cliente_id=c.id"""):
            if r["nombre"]:
                self.by_name[parsing.norm(r["nombre"])] = r["cliente"]
            if r["sub_id"]:
                self.by_id[r["sub_id"].strip().lower()] = r["cliente"]

    def __call__(self, name, sid):
        return parsing.cliente_de(name or "", sid or "", self.by_name, self.by_id)


# ---------------- consultas ----------------
def list_clientes():
    with db.tx() as con:
        cls = con.execute("SELECT * FROM clientes ORDER BY LOWER(nombre)").fetchall()
        subs_by_cli = {}
        for r in con.execute("SELECT id,nombre,sub_id,cliente_id FROM suscripciones ORDER BY nombre"):
            subs_by_cli.setdefault(r["cliente_id"], []).append(
                {"id": r["id"], "nombre": r["nombre"], "sub_id": r["sub_id"]})
        # recursos afectados del último lote de cada comunicado
        counts = {r["cliente"]: r["n"] for r in con.execute(
            "SELECT cliente, COUNT(*) AS n FROM recursos_ult GROUP BY cliente")}
    for c in cls:
        c["suscripciones"] = subs_by_cli.get(c["id"], [])
        c["n_recursos"] = counts.get(c["nombre"], 0)
    return cls


def suscripciones_sin_cliente():
    """Suscripciones presentes en recursos que no están mapeadas a ningún cliente."""
    return db.rows("""
      SELECT suscripcion, suscripcion_id,
             COUNT(*) AS n_recursos, COUNT(DISTINCT comunicado_id) AS n_comunicados
      FROM recursos
      WHERE COALESCE(cliente,'')=''
        AND (COALESCE(suscripcion,'')<>'' OR COALESCE(suscripcion_id,'')<>'')
      GROUP BY suscripcion, suscripcion_id
      ORDER BY n_recursos DESC""")


# ---------------- clientes ----------------
def add_cliente(data):
    nombre = (data.get("nombre") or "").strip()
    if not nombre:
        raise ValueError("nombre requerido")
    try:
        cid = db.one("INSERT INTO clientes(nombre,ext_id) VALUES(%s,%s) RETURNING id",
                     (nombre, (data.get("ext_id") or "").strip()))["id"]
    except db.IntegrityError:
        raise ValueError("Ya existe un cliente con ese nombre")
    return {"id": cid}


def update_cliente(cid, data):
    try:
        with db.tx() as con:
            old = con.execute("SELECT nombre FROM clientes WHERE id=%s", (cid,)).fetchone()
            if not old:
                raise ValueError("cliente no existe")
            if "nombre" in data or "ext_id" in data:
                nombre = (data.get("nombre") or "").strip()
                if not nombre:
                    raise ValueError("nombre requerido")
                con.execute("UPDATE clientes SET nombre=%s, ext_id=%s WHERE id=%s",
                            (nombre, (data.get("ext_id") or "").strip(), cid))
                con.execute("UPDATE recursos SET cliente=%s WHERE cliente=%s", (nombre, old["nombre"]))
            if "archivado" in data:
                con.execute("UPDATE clientes SET archivado=%s WHERE id=%s",
                            (1 if data["archivado"] else 0, cid))
    except db.IntegrityError:
        raise ValueError("Ya existe un cliente con ese nombre")
    return {"ok": True}


def delete_cliente(cid):
    db.run("DELETE FROM clientes WHERE id=%s", (cid,))
    return {"ok": True}


# ---------------- suscripciones ----------------
def add_suscripcion(cid, data):
    nombre = (data.get("nombre") or "").strip()
    sid = (data.get("sub_id") or "").strip()
    if not nombre and not sid:
        raise ValueError("nombre o id de suscripción requerido")
    with db.tx() as con:
        cl = con.execute("SELECT nombre FROM clientes WHERE id=%s", (cid,)).fetchone()
        if not cl:
            raise ValueError("cliente no existe")
        con.execute("INSERT INTO suscripciones(cliente_id,nombre,sub_id) VALUES(%s,%s,%s)", (cid, nombre, sid))
        n = 0
        if nombre:   # asocia a este cliente los recursos ya cargados con esa suscripción
            n = con.execute("UPDATE recursos SET cliente=%s WHERE suscripcion=%s",
                            (cl["nombre"], nombre)).rowcount
    return {"ok": True, "recursos_asociados": n}


def update_suscripcion(sid, data):
    nombre = (data.get("nombre") or "").strip()
    sub_id = (data.get("sub_id") or "").strip()
    if not nombre and not sub_id:
        raise ValueError("nombre o id de suscripción requerido")
    with db.tx() as con:
        row = con.execute("""SELECT c.nombre AS cli FROM suscripciones s
                             JOIN clientes c ON s.cliente_id=c.id WHERE s.id=%s""", (sid,)).fetchone()
        if not row:
            raise ValueError("suscripción no existe")
        con.execute("UPDATE suscripciones SET nombre=%s, sub_id=%s WHERE id=%s", (nombre, sub_id, sid))
        n = 0
        if nombre:
            n = con.execute("UPDATE recursos SET cliente=%s WHERE suscripcion=%s",
                            (row["cli"], nombre)).rowcount
    return {"ok": True, "recursos_asociados": n}


def delete_suscripcion(sid):
    db.run("DELETE FROM suscripciones WHERE id=%s", (sid,))
    return {"ok": True}


# ---------------- suscripciones sin cliente ----------------
_HUERFANA = """COALESCE(cliente,'')='' AND COALESCE(suscripcion,'')=%s AND COALESCE(suscripcion_id,'')=%s"""


def rename_suscripcion_sin_cliente(data):
    """Corrige el nombre/id de una suscripción huérfana en sus recursos. Si el nombre/id
    corregido ya mapea a un cliente conocido, los recursos quedan asignados a él."""
    old_n = data.get("suscripcion") or ""
    old_i = data.get("suscripcion_id") or ""
    new_n = (data.get("nuevo_nombre") or "").strip()
    new_i = (data.get("nuevo_id") or "").strip()
    if not new_n and not new_i:
        raise ValueError("nombre o id de suscripción requerido")
    with db.tx() as con:
        cli = ClienteMap(con)(new_n, new_i)
        n = con.execute(f"UPDATE recursos SET suscripcion=%s, suscripcion_id=%s, cliente=%s WHERE {_HUERFANA}",
                        (new_n, new_i, cli or "", old_n, old_i)).rowcount
    return {"ok": True, "recursos_actualizados": n, "recursos_asignados": n if cli else 0}


def delete_suscripcion_sin_cliente(data):
    """Elimina los recursos huérfanos (sin cliente) de una suscripción."""
    n = db.run(f"DELETE FROM recursos WHERE {_HUERFANA}",
               (data.get("suscripcion") or "", data.get("suscripcion_id") or ""))
    return {"ok": True, "recursos_eliminados": n}
