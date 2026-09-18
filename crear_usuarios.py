# -*- coding: utf-8 -*-
"""
Asegura el roster de miembros y normaliza sus credenciales:
  - correo     = nombre.apellido@gestionysistemas.com
  - contraseña = nombre.apellido   (en minúscula, sin tildes)

Es idempotente y seguro para producción:
  - A cada persona del ROSTER la busca por nombre+apellido (normalizados).
    Si ya existe, actualiza su correo y contraseña; si no, la crea.
  - No borra ni toca otros miembros que ya existan fuera del roster.

Toma la conexión de las mismas variables de entorno que app.py
(DATABASE_URL o PGHOST/PGUSER/PGPASSWORD/PGDATABASE).

Uso:  python crear_usuarios.py
"""
import unicodedata
import pgdb
from app import hash_pwd

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


def slug(s):
    """minúsculas, sin tildes ni espacios (para correo/contraseña)."""
    s = (s or "").strip().lower()
    s = unicodedata.normalize("NFKD", s).encode("ascii", "ignore").decode("ascii")
    return s.replace(" ", "")


def main():
    con = pgdb.connect()
    # índice de los miembros existentes por "nombre.apellido" normalizado
    existentes = con.execute("SELECT id,nombre,apellido FROM miembros").fetchall()
    por_nombre = {f"{slug(m['nombre'])}.{slug(m['apellido'])}": m["id"] for m in existentes}

    creados = actualizados = 0
    for nombre, apellido in ROSTER:
        base = f"{slug(nombre)}.{slug(apellido)}"
        correo = f"{base}@{DOMINIO}"
        pwd_hash = hash_pwd(base)
        if base in por_nombre:
            con.execute("UPDATE miembros SET correo=?, pwd=? WHERE id=?",
                        (correo, pwd_hash, por_nombre[base]))
            actualizados += 1
            print(f"  actualizado  {correo:40s}  contraseña: {base}")
        else:
            con.execute("INSERT INTO miembros(correo,nombre,apellido,pwd) VALUES(?,?,?,?)",
                        (correo, nombre, apellido, pwd_hash))
            creados += 1
            print(f"  creado       {correo:40s}  contraseña: {base}")
    con.commit()
    con.close()
    print(f"\nListo. {creados} creado(s), {actualizados} actualizado(s).")


if __name__ == "__main__":
    main()
