# -*- coding: utf-8 -*-
"""Contraseñas, sesiones (en PostgreSQL) y miembros con su rol (RBAC).

Roles: admin (todo + gestiona miembros y roles) · editor (lee y edita) · lector (solo lee).
"""
import hashlib
import secrets
import unicodedata

from . import db

ROLES = ("admin", "editor", "lector")
PWD_MIN = 8
SESSION_DAYS = 7


# ---------------- contraseñas ----------------
def hash_pwd(p):
    """PBKDF2-SHA256 con sal por usuario. Formato guardado: 'salt$hash' (hex)."""
    salt = secrets.token_hex(8)
    h = hashlib.pbkdf2_hmac("sha256", p.encode("utf-8"), salt.encode("utf-8"), 100_000).hex()
    return salt + "$" + h


def verify_pwd(p, stored):
    if not stored or "$" not in stored:
        return False
    salt, h = stored.split("$", 1)
    calc = hashlib.pbkdf2_hmac("sha256", p.encode("utf-8"), salt.encode("utf-8"), 100_000).hex()
    return secrets.compare_digest(calc, h)


def slug(s):
    """minúsculas, sin tildes ni espacios."""
    s = (s or "").strip().lower()
    return unicodedata.normalize("NFKD", s).encode("ascii", "ignore").decode("ascii").replace(" ", "")


def _pwd_predecible(pwd, nombre, apellido):
    """La contraseña inicial antigua era 'nombre.apellido': se obliga a cambiarla."""
    return bool(nombre or apellido) and pwd == f"{slug(nombre)}.{slug(apellido)}"


def _check_pwd_nueva(p):
    if len(p or "") < PWD_MIN:
        raise ValueError(f"La contraseña debe tener al menos {PWD_MIN} caracteres")


# ---------------- sesiones ----------------
def _token_hash(token):
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


_ME_COLS = "m.id, m.correo, m.nombre, m.apellido, COALESCE(m.rol,'editor') AS rol, COALESCE(m.debe_cambiar,0) AS debe_cambiar"


def login(data):
    """Valida credenciales y crea una sesión. Devuelve (token, miembro)."""
    correo = (data.get("correo") or "").strip().lower()
    pwd = data.get("password") or ""
    row = db.one("SELECT id,nombre,apellido,pwd FROM miembros WHERE correo=%s", (correo,))
    if not row or not verify_pwd(pwd, row["pwd"]):
        raise ValueError("Correo o contraseña incorrectos")
    token = secrets.token_urlsafe(32)
    with db.tx() as con:
        con.execute("DELETE FROM sesiones WHERE expires_at < now()")   # limpieza de vencidas
        if _pwd_predecible(pwd, row["nombre"], row["apellido"]):
            con.execute("UPDATE miembros SET debe_cambiar=1 WHERE id=%s", (row["id"],))
        con.execute("INSERT INTO sesiones(token_hash,miembro_id,expires_at) "
                    "VALUES(%s,%s, now() + make_interval(days => %s))",
                    (_token_hash(token), row["id"], SESSION_DAYS))
    return token, member_from_token(token)


def member_from_token(token):
    if not token:
        return None
    return db.one(f"""SELECT {_ME_COLS} FROM sesiones s JOIN miembros m ON m.id = s.miembro_id
                      WHERE s.token_hash=%s AND s.expires_at > now()""", (_token_hash(token),))


def logout(token):
    if token:
        db.run("DELETE FROM sesiones WHERE token_hash=%s", (_token_hash(token),))


# ---------------- perfil propio ----------------
def update_mi_perfil(mid, data):
    """Cada miembro edita su propio nombre/apellido."""
    nombre = (data.get("nombre") or "").strip()
    apellido = (data.get("apellido") or "").strip()
    db.run("UPDATE miembros SET nombre=%s, apellido=%s WHERE id=%s", (nombre, apellido, mid))
    return {"nombre": nombre, "apellido": apellido}


def change_password(mid, token, data):
    """Cambia la contraseña propia (exige la actual) y cierra las demás sesiones."""
    actual = data.get("actual") or ""
    nueva = data.get("nueva") or ""
    _check_pwd_nueva(nueva)
    if nueva == actual:
        raise ValueError("La nueva contraseña debe ser distinta de la actual")
    row = db.one("SELECT pwd,nombre,apellido FROM miembros WHERE id=%s", (mid,))
    if not row:
        raise ValueError("miembro no existe")
    if not verify_pwd(actual, row["pwd"]):
        raise ValueError("La contraseña actual es incorrecta")
    if _pwd_predecible(nueva, row["nombre"], row["apellido"]):
        raise ValueError("La contraseña no puede ser nombre.apellido")
    with db.tx() as con:
        con.execute("UPDATE miembros SET pwd=%s, debe_cambiar=0 WHERE id=%s", (hash_pwd(nueva), mid))
        con.execute("DELETE FROM sesiones WHERE miembro_id=%s AND token_hash<>%s",
                    (mid, _token_hash(token or "")))
    return {"ok": True}


# ---------------- miembros (solo admin) ----------------
def _rol_valido(rol):
    rol = (rol or "").strip().lower()
    if rol not in ROLES:
        raise ValueError("rol inválido (admin, editor o lector)")
    return rol


def _correo_valido(data):
    correo = (data.get("correo") or "").strip().lower()
    if not correo:
        raise ValueError("correo requerido")
    if "@" not in correo:
        raise ValueError("correo inválido")
    return correo


def list_miembros():
    return db.rows("""SELECT id,correo,nombre,apellido,COALESCE(rol,'editor') AS rol,created_at
                      FROM miembros ORDER BY LOWER(apellido), LOWER(nombre), LOWER(correo)""")


def add_miembro(data):
    """La contraseña que pone el admin es temporal: el miembro debe cambiarla al entrar."""
    correo = _correo_valido(data)
    pwd = data.get("password") or ""
    rol = _rol_valido(data.get("rol") or "lector")
    if not pwd:
        raise ValueError("contraseña requerida")
    _check_pwd_nueva(pwd)
    try:
        with db.tx() as con:
            mid = con.execute(
                """INSERT INTO miembros(correo,nombre,apellido,pwd,rol,debe_cambiar)
                   VALUES(%s,%s,%s,%s,%s,1) RETURNING id""",
                (correo, (data.get("nombre") or "").strip(), (data.get("apellido") or "").strip(),
                 hash_pwd(pwd), rol)).fetchone()["id"]
    except db.IntegrityError:
        raise ValueError("Ya existe un miembro con ese correo")
    return {"id": mid}


def update_miembro(mid, data):
    correo = _correo_valido(data)
    pwd = data.get("password") or ""
    if pwd:
        _check_pwd_nueva(pwd)
    try:
        with db.tx() as con:
            row = con.execute("SELECT COALESCE(rol,'editor') AS rol FROM miembros WHERE id=%s",
                              (mid,)).fetchone()
            if not row:
                raise ValueError("miembro no existe")
            rol = _rol_valido(data["rol"]) if data.get("rol") else row["rol"]
            if row["rol"] == "admin" and rol != "admin" and not _hay_otro_admin(con, mid):
                raise ValueError("Debe quedar al menos un admin")
            con.execute("UPDATE miembros SET correo=%s,nombre=%s,apellido=%s,rol=%s WHERE id=%s",
                        (correo, (data.get("nombre") or "").strip(),
                         (data.get("apellido") or "").strip(), rol, mid))
            if pwd:   # reseteo por el admin: temporal, cierra sus sesiones
                con.execute("UPDATE miembros SET pwd=%s, debe_cambiar=1 WHERE id=%s", (hash_pwd(pwd), mid))
                con.execute("DELETE FROM sesiones WHERE miembro_id=%s", (mid,))
    except db.IntegrityError:
        raise ValueError("Ya existe un miembro con ese correo")
    return {"ok": True}


def delete_miembro(mid):
    with db.tx() as con:
        row = con.execute("SELECT rol FROM miembros WHERE id=%s", (mid,)).fetchone()
        if row and row["rol"] == "admin" and not _hay_otro_admin(con, mid):
            raise ValueError("No se puede eliminar al único admin")
        con.execute("DELETE FROM miembros WHERE id=%s", (mid,))   # sus sesiones caen en cascada
    return {"ok": True}


def _hay_otro_admin(con, mid):
    return con.execute("SELECT 1 FROM miembros WHERE rol='admin' AND id<>%s", (mid,)).fetchone() is not None
