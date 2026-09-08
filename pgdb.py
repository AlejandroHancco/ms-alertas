# -*- coding: utf-8 -*-
"""
Capa de compatibilidad SQLite -> PostgreSQL para la Plataforma Upgrade MS.

La app fue escrita contra la API de sqlite3 (placeholders '?', cursor.lastrowid,
con.total_changes, filas indexables por nombre y por posicion). Este modulo
envuelve psycopg (v3) para exponer exactamente esa misma superficie, de modo que
app.py no necesita reescribir sus decenas de queries.

Conexion: se toma de variables de entorno.
  - DATABASE_URL  (ej: postgresql://user:pass@host:5432/dbname?sslmode=require)
  o bien las clasicas: PGHOST PGUSER PGPASSWORD PGDATABASE PGPORT PGSSLMODE
Azure Database for PostgreSQL Flexible Server exige TLS -> sslmode=require por defecto.
"""
import os
import psycopg
from psycopg import errors as _pgerr

# Excepcion que app.py espera capturar en violaciones de UNIQUE/FK.
IntegrityError = psycopg.IntegrityError


# --------------------------- fila hibrida ---------------------------
class Row:
    """Imita sqlite3.Row: indexable por posicion (r[0]) y por nombre (r['col']),
    iterable por valores (permite 'a,b,c = row') y convertible con dict(row)."""
    __slots__ = ("_v", "_idx")

    def __init__(self, cols, values):
        self._v = tuple(values)
        self._idx = {c: i for i, c in enumerate(cols)}

    def __getitem__(self, k):
        if isinstance(k, (int, slice)):
            return self._v[k]
        return self._v[self._idx[k]]

    def __iter__(self):
        return iter(self._v)          # sqlite3.Row itera valores

    def __len__(self):
        return len(self._v)

    def keys(self):
        return list(self._idx.keys())  # dict(row) usa keys() + __getitem__

    def get(self, k, default=None):
        try:
            return self[k]
        except (KeyError, IndexError):
            return default


def _row_factory(cursor):
    cols = [c.name for c in cursor.description] if cursor.description else []
    def make(values):
        return Row(cols, values)
    return make


# --------------------------- cursor ---------------------------
class Cursor:
    def __init__(self, conn, cur):
        self._conn = conn
        self._cur = cur
        self.lastrowid = None

    def execute(self, sql, params=()):
        q = sql.replace("?", "%s")
        stripped = q.lstrip()
        first = stripped.split(None, 1)[0].lower() if stripped else ""
        is_insert = first == "insert"
        # emular lastrowid: si es un INSERT sin RETURNING, pedir el id generado
        if is_insert and "returning" not in q.lower():
            q = q.rstrip().rstrip(";") + " RETURNING id"
        if params:
            self._cur.execute(q, list(params))
        else:
            self._cur.execute(q)
        # emular con.total_changes (solo cuenta filas afectadas por DML)
        if first in ("insert", "update", "delete"):
            rc = self._cur.rowcount
            if rc and rc > 0:
                self._conn._changes += rc
        if is_insert:
            try:
                row = self._cur.fetchone()
                self.lastrowid = row[0] if row else None
            except Exception:
                self.lastrowid = None
        return self

    def fetchone(self):
        return self._cur.fetchone()

    def fetchall(self):
        return self._cur.fetchall()

    def __iter__(self):
        return iter(self._cur)

    @property
    def rowcount(self):
        return self._cur.rowcount

    @property
    def description(self):
        return self._cur.description

    def close(self):
        try:
            self._cur.close()
        except Exception:
            pass


# --------------------------- conexion ---------------------------
class Conn:
    def __init__(self, pg):
        self._pg = pg
        self._changes = 0

    def cursor(self):
        return Cursor(self, self._pg.cursor())

    def execute(self, sql, params=()):
        return self.cursor().execute(sql, params)

    def commit(self):
        self._pg.commit()

    def rollback(self):
        self._pg.rollback()

    def close(self):
        try:
            self._pg.close()
        except Exception:
            pass

    @property
    def total_changes(self):
        return self._changes


def _conninfo():
    url = os.environ.get("DATABASE_URL")
    if url:
        return url
    host = os.environ.get("PGHOST")
    if not host:
        raise RuntimeError(
            "Falta configuracion de base de datos. Define DATABASE_URL o "
            "PGHOST/PGUSER/PGPASSWORD/PGDATABASE en las variables de entorno.")
    user = os.environ.get("PGUSER", "")
    pwd = os.environ.get("PGPASSWORD", "")
    dbname = os.environ.get("PGDATABASE", "postgres")
    port = os.environ.get("PGPORT", "5432")
    sslmode = os.environ.get("PGSSLMODE", "require")
    return (f"host={host} port={port} dbname={dbname} user={user} "
            f"password={pwd} sslmode={sslmode}")


def connect():
    """Devuelve una conexion compatible-sqlite3 hacia PostgreSQL."""
    pg = psycopg.connect(_conninfo(), row_factory=_row_factory)
    return Conn(pg)


# --------------------------- esquema ---------------------------
# Se conservan los tipos TEXT para fechas (como en SQLite) para no alterar la
# logica de la app, que compara fechas como cadenas 'YYYY-MM-DD'.
SCHEMA_PG = """
CREATE TABLE IF NOT EXISTS comunicados(
  id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  n TEXT, titulo TEXT NOT NULL, categoria TEXT,
  fecha_recepcion TEXT, fecha_limite TEXT,
  resumen TEXT, fuente TEXT, archivo TEXT,
  estado TEXT, responsable TEXT,
  ultima_actualizacion TEXT, proxima_actualizacion TEXT,
  observaciones TEXT,
  kql TEXT,
  origen TEXT DEFAULT 'excel',
  created_at TEXT DEFAULT (to_char(now(),'YYYY-MM-DD"T"HH24:MI:SS'))
);
CREATE TABLE IF NOT EXISTS clientes(
  id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  nombre TEXT UNIQUE NOT NULL,
  ext_id TEXT,
  created_at TEXT DEFAULT (to_char(now(),'YYYY-MM-DD"T"HH24:MI:SS'))
);
CREATE TABLE IF NOT EXISTS suscripciones(
  id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  cliente_id BIGINT NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
  nombre TEXT, sub_id TEXT,
  created_at TEXT DEFAULT (to_char(now(),'YYYY-MM-DD"T"HH24:MI:SS'))
);
CREATE TABLE IF NOT EXISTS inventarios(
  id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  comunicado_id BIGINT NOT NULL REFERENCES comunicados(id) ON DELETE CASCADE,
  fecha TEXT, kql TEXT, nota TEXT,
  created_at TEXT DEFAULT (to_char(now(),'YYYY-MM-DD"T"HH24:MI:SS'))
);
CREATE TABLE IF NOT EXISTS recursos(
  id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  comunicado_id BIGINT NOT NULL REFERENCES comunicados(id) ON DELETE CASCADE,
  hoja TEXT,
  cliente TEXT,
  suscripcion TEXT, suscripcion_id TEXT,
  grupo_recurso TEXT, nombre_recurso TEXT,
  gestor TEXT, estado TEXT,
  extra TEXT,
  revisado INTEGER DEFAULT 0,
  revisado_por TEXT, revisado_at TEXT,
  notas TEXT,
  created_at TEXT DEFAULT (to_char(now(),'YYYY-MM-DD"T"HH24:MI:SS')),
  inventario_id BIGINT
);
CREATE TABLE IF NOT EXISTS miembros(
  id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  correo TEXT UNIQUE NOT NULL,
  nombre TEXT, apellido TEXT, pwd TEXT,
  created_at TEXT DEFAULT (to_char(now(),'YYYY-MM-DD"T"HH24:MI:SS'))
);
CREATE INDEX IF NOT EXISTS ix_inv_com ON inventarios(comunicado_id);
CREATE INDEX IF NOT EXISTS ix_rec_com ON recursos(comunicado_id);
CREATE INDEX IF NOT EXISTS ix_rec_sub ON recursos(suscripcion);
CREATE INDEX IF NOT EXISTS ix_rec_rev ON recursos(revisado);
CREATE INDEX IF NOT EXISTS ix_rec_inv ON recursos(inventario_id);
CREATE INDEX IF NOT EXISTS ix_sus_cli ON suscripciones(cliente_id);
"""


def create_schema(con):
    """Crea el esquema en PostgreSQL si no existe (idempotente)."""
    for stmt in SCHEMA_PG.split(";"):
        s = stmt.strip()
        if s:
            con.execute(s)
    con.commit()


def reset_sequences(con):
    """Reajusta las secuencias IDENTITY al MAX(id) tras una carga con ids explicitos."""
    for t in ("comunicados", "clientes", "suscripciones", "inventarios", "recursos", "miembros"):
        con.execute(
            "SELECT setval(pg_get_serial_sequence(%s,'id'), "
            "COALESCE((SELECT MAX(id) FROM " + t + "),1), true)", (t,))
    con.commit()
