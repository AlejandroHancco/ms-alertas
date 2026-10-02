# Plataforma de Comunicados · Upgrade MS

Aplicación web para centralizar los comunicados de Microsoft Azure y llevar el control
de revisión de los recursos afectados por cliente y suscripción. Cada comunicado guarda
sus **inventarios** (lotes de recursos obtenidos con un query KQL en Resource Graph
Explorer). El avance, los estados y el % de revisión **siempre se calculan del último
lote**; los anteriores quedan como historial.

## Estructura

```
app.py                 Servidor: Flask + waitress; sirve la API y el frontend
backend/
  db.py                Pool de conexiones PostgreSQL, helpers y esquema (con migraciones)
  api.py               Rutas /api + autenticación y permisos por rol (en un solo lugar)
  auth.py              Contraseñas, sesiones (en la base) y miembros/roles
  comunicados.py       Comunicados, "afecta a todo Azure" y papelera
  recursos.py          Inventarios, recursos, importación CSV/XLSX y revisión
  clientes.py          Clientes, suscripciones y suscripciones sin cliente
  stats.py             Dashboard (equipo o del responsable)
  parsing.py           Normalización de columnas y mapeo suscripción -> cliente
static/
  index.html, styles.css, logo.png
  js/                  Scripts por vista (core, buscador, inicio, sesion, comunicados,
                       recursos, miembros, clientes, formularios, papelera, main)
crear_usuarios.py      Alta del equipo con contraseñas temporales
infra/                 Bicep + guía para desplegar/migrar en Azure
.github/workflows/     Deploy a Azure App Service en cada push a main
```

## Ejecutar en local

Requiere Python 3.12+ y un PostgreSQL accesible.

1. Configura la conexión (en `Iniciar Plataforma.bat` ya está la del PostgreSQL local):
   `PGHOST`, `PGPORT`, `PGUSER`, `PGPASSWORD`, `PGDATABASE`, `PGSSLMODE`
   (o una sola `DATABASE_URL`).
2. Doble clic en **`Iniciar Plataforma.bat`**: instala las dependencias y abre
   http://localhost:8765.
   O a mano: `pip install -r requirements.txt` y `python app.py`.

Al arrancar, la app crea o migra el esquema sola. Si no hay ningún admin, promueve a
`ADMIN_CORREO` (variable de entorno) o, si ese correo no existe, al miembro más antiguo.

## Roles

| Rol | Puede |
|---|---|
| **Admin** | Todo, más crear/editar/eliminar miembros, asignar roles y vaciar la papelera |
| **Editor** | Ver y editar comunicados, inventarios, revisiones y clientes; restaurar de la papelera |
| **Lector** | Solo ver |

El backend hace cumplir los permisos (403); la interfaz solo oculta lo que el rol no puede usar.

## Contraseñas y sesiones

- Mínimo 8 caracteres.
- La contraseña que asigna un admin, la de `crear_usuarios.py` y la antigua
  `nombre.apellido` son **temporales**: el miembro debe cambiarla al iniciar sesión.
- Las sesiones se guardan en la base (solo el hash del token), duran 7 días y sobreviven a
  reinicios y redespliegues. Cambiar la contraseña cierra las demás sesiones del miembro.
- La cookie es `HttpOnly`, `SameSite=Lax` y `Secure` cuando se entra por HTTPS.

## Despliegue

- **Código:** cada push a `main` despliega con GitHub Actions (`.github/workflows/deploy.yml`).
  El App Service arranca con `python app.py`.
- **Infraestructura / migrar a otra suscripción:** ver [`infra/README.md`](infra/README.md).
