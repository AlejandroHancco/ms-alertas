# -*- coding: utf-8 -*-
"""
Da de alta el roster de miembros con contraseñas TEMPORALES aleatorias.

  - correo = nombre.apellido@gestionysistemas.com
  - contraseña: aleatoria, se imprime una sola vez; el miembro debe cambiarla
    en su primer ingreso (debe_cambiar=1).

Es idempotente: solo crea a quien falte (buscando por nombre+apellido normalizados).
A los que ya existen no los toca, salvo que se pase --reset (les genera una nueva
contraseña temporal y cierra sus sesiones).

Toma la conexión de las mismas variables de entorno que app.py
(DATABASE_URL o PGHOST/PGUSER/PGPASSWORD/PGDATABASE).

Uso:  python crear_usuarios.py            # crea los que falten
      python crear_usuarios.py --reset    # además resetea a los existentes
"""
import secrets
import sys

from backend import db
from backend.auth import hash_pwd, slug

DOMINIO = "gestionysistemas.com"

# (nombre, apellido) de las personas que deben tener acceso.
ROSTER = [
    ("Katiana", "Moncada"),
    ("Leandro", "Urquizo"),
    ("Kevin", "Tumbalobos"),
    ("Elias", "Sanchez"),
    ("Juan", "Pacheco"),
    ("André", "Zegarra"),
    ("Alejandro", "Hancco"),
    ("Wilder", "Napanga"),
]


def main():
    reset = "--reset" in sys.argv
    db.ensure_schema()
    existentes = {f"{slug(m['nombre'])}.{slug(m['apellido'])}": m["id"]
                  for m in db.rows("SELECT id,nombre,apellido FROM miembros")}
    creados = reseteados = 0
    with db.tx() as con:
        for nombre, apellido in ROSTER:
            base = f"{slug(nombre)}.{slug(apellido)}"
            correo = f"{base}@{DOMINIO}"
            temporal = secrets.token_urlsafe(9)
            if base in existentes:
                if not reset:
                    print(f"  existe       {correo}")
                    continue
                con.execute("UPDATE miembros SET pwd=%s, debe_cambiar=1 WHERE id=%s",
                            (hash_pwd(temporal), existentes[base]))
                con.execute("DELETE FROM sesiones WHERE miembro_id=%s", (existentes[base],))
                reseteados += 1
                print(f"  reseteado    {correo:42s} temporal: {temporal}")
            else:
                con.execute("""INSERT INTO miembros(correo,nombre,apellido,pwd,rol,debe_cambiar)
                               VALUES(%s,%s,%s,%s,'lector',1)""",
                            (correo, nombre, apellido, hash_pwd(temporal)))
                creados += 1
                print(f"  creado       {correo:42s} temporal: {temporal}")
    print(f"\nListo. {creados} creado(s), {reseteados} reseteado(s). "
          "Comparte cada contraseña temporal por un canal privado.")


if __name__ == "__main__":
    main()
