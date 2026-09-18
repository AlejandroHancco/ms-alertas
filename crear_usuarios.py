# -*- coding: utf-8 -*-
"""
Normaliza las credenciales de todos los miembros:
  - correo    = nombre.apellido@gestionysistemas.com
  - contraseña = nombre.apellido   (en minúscula, sin tildes)

Toma la conexión de las mismas variables de entorno que app.py
(DATABASE_URL o PGHOST/PGUSER/PGPASSWORD/PGDATABASE). Es idempotente:
se puede correr las veces que haga falta.

Uso:  python crear_usuarios.py
"""
import unicodedata
import pgdb
from app import hash_pwd

DOMINIO = "gestionysistemas.com"


def slug(s):
    """minúsculas, sin tildes ni espacios (para correo/contraseña)."""
    s = (s or "").strip().lower()
    s = unicodedata.normalize("NFKD", s).encode("ascii", "ignore").decode("ascii")
    return s.replace(" ", "")


def main():
    con = pgdb.connect()
    miembros = con.execute("SELECT id,nombre,apellido FROM miembros ORDER BY id").fetchall()
    if not miembros:
        print("No hay miembros en la base.")
        con.close()
        return
    for m in miembros:
        nombre, apellido = slug(m["nombre"]), slug(m["apellido"])
        base = f"{nombre}.{apellido}"
        correo = f"{base}@{DOMINIO}"
        pwd = base
        con.execute("UPDATE miembros SET correo=?, pwd=? WHERE id=?",
                    (correo, hash_pwd(pwd), m["id"]))
        print(f"  {correo:40s}  contraseña: {pwd}")
    con.commit()
    con.close()
    print(f"\nListo. {len(miembros)} usuarios actualizados.")


if __name__ == "__main__":
    main()
