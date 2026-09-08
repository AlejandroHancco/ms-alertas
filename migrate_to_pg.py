# -*- coding: utf-8 -*-
"""
Migracion de datos: copia el contenido de upgrade_ms.db (SQLite) a la base
Azure Database for PostgreSQL. Se ejecuta UNA vez, en local, con acceso de red
al servidor PostgreSQL.

Requisitos:
  pip install "psycopg[binary]"
Configura la conexion por variables de entorno (ver pgdb.py), por ejemplo:
  PGHOST=miserver.postgres.database.azure.com
  PGUSER=adminuser
  PGPASSWORD=********
  PGDATABASE=upgrade_ms
  PGSSLMODE=require
  # o bien:  DATABASE_URL=postgresql://user:pass@host:5432/upgrade_ms?sslmode=require

Uso:
  python migrate_to_pg.py            # crea esquema y copia (falla si ya hay datos)
  python migrate_to_pg.py --truncate # vacia las tablas destino antes de copiar
"""
import os, sys, sqlite3
import pgdb

HERE = os.path.dirname(os.path.abspath(__file__))
SQLITE_DB = os.path.join(HERE, "upgrade_ms.db")

# Orden que respeta las claves foraneas.
ORDER = ["comunicados", "clientes", "suscripciones", "inventarios", "recursos", "miembros"]


def sqlite_cols(scon, table):
    return [r[1] for r in scon.execute(f"PRAGMA table_info({table})").fetchall()]


def main():
    truncate = "--truncate" in sys.argv
    if not os.path.exists(SQLITE_DB):
        print("No se encontro", SQLITE_DB); sys.exit(1)

    scon = sqlite3.connect(SQLITE_DB)
    scon.row_factory = sqlite3.Row
    pcon = pgdb.connect()

    print("Creando esquema en PostgreSQL (si no existe)...")
    pgdb.create_schema(pcon)

    if truncate:
        print("Vaciando tablas destino...")
        pcon.execute("TRUNCATE recursos, inventarios, suscripciones, miembros, comunicados, clientes RESTART IDENTITY CASCADE")
        pcon.commit()
    else:
        for t in ORDER:
            n = pcon.execute(f"SELECT COUNT(*) FROM {t}").fetchone()[0]
            if n:
                print(f"La tabla destino '{t}' ya tiene {n} filas. "
                      f"Usa --truncate para reemplazar. Abortando.")
                sys.exit(1)

    total = 0
    for table in ORDER:
        # solo columnas que existan en AMBOS lados (evita desajustes de esquema)
        scols = sqlite_cols(scon, table)
        pcols = [r[0] for r in pcon.execute(
            "SELECT column_name FROM information_schema.columns WHERE table_name=%s", (table,)).fetchall()]
        cols = [c for c in scols if c in pcols]
        rows = scon.execute(f"SELECT {','.join(cols)} FROM {table}").fetchall()
        collist = ",".join(cols)
        ph = ",".join(["?"] * len(cols))
        q = f"INSERT INTO {table} ({collist}) VALUES ({ph})"
        for r in rows:
            pcon.execute(q, [r[c] for c in cols])
        pcon.commit()
        print(f"  {table}: {len(rows)} filas copiadas.")
        total += len(rows)

    print("Reajustando secuencias (IDENTITY)...")
    pgdb.reset_sequences(pcon)

    scon.close(); pcon.close()
    print(f"Migracion completada. {total} filas en total.")


if __name__ == "__main__":
    main()
