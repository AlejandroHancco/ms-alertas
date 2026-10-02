# -*- coding: utf-8 -*-
"""Rutas /api. Autenticación y permisos (RBAC) se resuelven en un solo lugar
(`_guard`), antes de cada petición."""
from flask import Blueprint, g, jsonify, request

from . import auth, clientes, comunicados, recursos, stats

bp = Blueprint("api", __name__, url_prefix="/api")

COOKIE = "sid"
# rutas de la propia sesión/perfil: cualquier rol, aunque deba cambiar su contraseña
_SELF = {"/api/me", "/api/login", "/api/logout", "/api/cambiar-password"}


def _token():
    return request.cookies.get(COOKIE)


def _who():
    """Nombre a estampar en 'revisado por' / 'eliminado por': el usuario autenticado."""
    me = g.me
    return f"{me['nombre'] or ''} {me['apellido'] or ''}".strip() or me["correo"]


def _deny(code, msg):
    return jsonify(error=msg), code


@bp.before_request
def _guard():
    g.me = auth.member_from_token(_token())
    p, method = request.path, request.method
    if p in ("/api/login", "/api/me"):
        return None
    if not g.me:
        return _deny(401, "no autenticado")
    if g.me["debe_cambiar"] and p not in _SELF:
        return _deny(403, "Debes cambiar tu contraseña antes de continuar")
    if method == "GET" or p in _SELF or p == "/api/mi-perfil":
        return None
    rol = g.me["rol"]
    if p.startswith("/api/miembros"):
        return None if rol == "admin" else _deny(403, "Solo un admin puede gestionar miembros y roles")
    if method == "DELETE" and p.startswith("/api/papelera"):
        return None if rol == "admin" else _deny(403, "Solo un admin puede eliminar definitivamente")
    return None if rol in ("admin", "editor") else _deny(403, "Sin permiso: tu rol es de solo lectura")


@bp.errorhandler(ValueError)
def _bad_request(e):
    return _deny(400, str(e))


def body():
    return request.get_json(silent=True) or {}


# ---------------- sesión y perfil ----------------
@bp.get("/me")
def me():
    return jsonify(miembro=g.me)


@bp.post("/login")
def login():
    token, m = auth.login(body())
    resp = jsonify(miembro=m)
    resp.set_cookie(COOKIE, token, max_age=auth.SESSION_DAYS * 86400, httponly=True,
                    samesite="Lax", secure=request.is_secure, path="/")
    return resp


@bp.post("/logout")
def logout():
    auth.logout(_token())
    resp = jsonify(ok=True)
    resp.delete_cookie(COOKIE, path="/")
    return resp


@bp.post("/cambiar-password")
def cambiar_password():
    r = auth.change_password(g.me["id"], _token(), body())
    return jsonify(r)


@bp.post("/mi-perfil")
def mi_perfil():
    auth.update_mi_perfil(g.me["id"], body())
    return jsonify(miembro=auth.member_from_token(_token()))


# ---------------- dashboard ----------------
@bp.get("/stats")
def get_stats():
    return jsonify(stats.stats())


@bp.get("/mi-stats")
def get_mi_stats():
    return jsonify(stats.stats(responsable=_who() if (g.me["nombre"] or g.me["apellido"]) else ""))


# ---------------- comunicados ----------------
@bp.get("/comunicados")
def list_comunicados():
    return jsonify(comunicados.list_comunicados())


@bp.post("/comunicados")
def add_comunicado():
    return jsonify(comunicados.add_comunicado(body())), 201


@bp.get("/comunicados/<int:cid>")
def get_comunicado(cid):
    return jsonify(comunicados.get_comunicado(cid))


@bp.put("/comunicados/<int:cid>")
def update_comunicado(cid):
    return jsonify(comunicados.update_comunicado(cid, body()))


@bp.delete("/comunicados/<int:cid>")
def delete_comunicado(cid):
    return jsonify(comunicados.delete_comunicado(cid, _who()))


@bp.post("/comunicados/<int:cid>/sync-todo-azure")
def sync_todo_azure(cid):
    return jsonify(comunicados.sync_todo_azure(cid))


# ---------------- papelera ----------------
@bp.get("/papelera")
def list_papelera():
    return jsonify(comunicados.list_papelera())


@bp.post("/papelera/<int:pid>/restaurar")
def restore_papelera(pid):
    return jsonify(comunicados.restore_papelera(pid))


@bp.delete("/papelera/<int:pid>")
def purge_papelera_item(pid):
    return jsonify(comunicados.purge_papelera(pid))


@bp.delete("/papelera")
def purge_papelera():
    return jsonify(comunicados.purge_papelera())


# ---------------- inventarios y recursos ----------------
@bp.get("/comunicados/<int:cid>/inventarios")
def list_inventarios(cid):
    return jsonify(recursos.list_inventarios(cid))


@bp.post("/comunicados/<int:cid>/inventarios")
def add_inventario(cid):
    return jsonify(recursos.add_inventario(cid, body())), 201


@bp.put("/inventarios/<int:iid>")
def update_inventario(iid):
    return jsonify(recursos.update_inventario(iid, body()))


@bp.delete("/inventarios/<int:iid>")
def delete_inventario(iid):
    return jsonify(recursos.delete_inventario(iid))


@bp.get("/comunicados/<int:cid>/recursos")
def get_recursos(cid):
    return jsonify(recursos.get_recursos(cid))


@bp.post("/comunicados/<int:cid>/import")
def import_recursos(cid):
    return jsonify(recursos.import_recursos(
        cid, request.headers.get("X-Ext", "csv"), request.get_data(),
        replace="replace" in request.args, kql=request.args.get("kql", "")))


@bp.patch("/recursos/<int:rid>")
def patch_recurso(rid):
    return jsonify(recursos.patch_recurso(rid, body(), _who()))


@bp.post("/recursos/bulk-review")
def bulk_review():
    return jsonify(recursos.bulk_review(body(), _who()))


# ---------------- clientes y suscripciones ----------------
@bp.get("/clientes")
def list_clientes():
    return jsonify(clientes.list_clientes())


@bp.post("/clientes")
def add_cliente():
    return jsonify(clientes.add_cliente(body())), 201


@bp.put("/clientes/<int:cid>")
def update_cliente(cid):
    return jsonify(clientes.update_cliente(cid, body()))


@bp.delete("/clientes/<int:cid>")
def delete_cliente(cid):
    return jsonify(clientes.delete_cliente(cid))


@bp.post("/clientes/<int:cid>/suscripciones")
def add_suscripcion(cid):
    return jsonify(clientes.add_suscripcion(cid, body())), 201


@bp.put("/suscripciones/<int:sid>")
def update_suscripcion(sid):
    return jsonify(clientes.update_suscripcion(sid, body()))


@bp.delete("/suscripciones/<int:sid>")
def delete_suscripcion(sid):
    return jsonify(clientes.delete_suscripcion(sid))


@bp.get("/suscripciones-sin-cliente")
def suscripciones_sin_cliente():
    return jsonify(clientes.suscripciones_sin_cliente())


@bp.put("/suscripciones-sin-cliente")
def rename_suscripcion_sin_cliente():
    return jsonify(clientes.rename_suscripcion_sin_cliente(body()))


@bp.delete("/suscripciones-sin-cliente")
def delete_suscripcion_sin_cliente():
    return jsonify(clientes.delete_suscripcion_sin_cliente(body()))


# ---------------- miembros (solo admin para escribir) ----------------
@bp.get("/miembros")
def list_miembros():
    return jsonify(auth.list_miembros())


@bp.post("/miembros")
def add_miembro():
    return jsonify(auth.add_miembro(body())), 201


@bp.put("/miembros/<int:mid>")
def update_miembro(mid):
    return jsonify(auth.update_miembro(mid, body()))


@bp.delete("/miembros/<int:mid>")
def delete_miembro(mid):
    return jsonify(auth.delete_miembro(mid))


@bp.route("/<path:_rest>", methods=["GET", "POST", "PUT", "PATCH", "DELETE"])
def not_found(_rest):
    return _deny(404, "ruta no encontrada: " + request.path)
