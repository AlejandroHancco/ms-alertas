# Despliegue a Azure (App Service + PostgreSQL)

La plataforma ahora usa **Azure Database for PostgreSQL** en lugar de SQLite y se
despliega a **Azure App Service** (Linux, Python) mediante **GitHub Actions**.

Archivos clave:

| Archivo | Qué es |
|---|---|
| `pgdb.py` | Capa de compatibilidad: hace que la app hable con PostgreSQL sin reescribir sus queries. Crea el esquema. |
| `app.py` | Servidor + API (ahora sobre PostgreSQL). Escucha en `0.0.0.0:$PORT` en Azure. |
| `migrate_to_pg.py` | Copia **una vez** los datos de `upgrade_ms.db` a PostgreSQL. |
| `requirements.txt` | Dependencias (psycopg, openpyxl). |
| `.github/workflows/deploy.yml` | CI/CD: push a `main` → deploy. |

---

## 1. Base de datos PostgreSQL (una vez)

En tu servidor **Azure Database for PostgreSQL Flexible Server**:

1. Crea la base de datos, p. ej. `upgrade_ms`
   (Portal → tu servidor → *Databases* → *Add*; o con `psql`: `CREATE DATABASE upgrade_ms;`).
2. **Reglas de firewall** (Portal → *Networking*):
   - Marca **"Allow public access from any Azure service..."** (para que el App Service conecte).
   - Añade **tu IP** temporalmente (para correr la migración desde tu PC).
3. Anota: **host** (`xxx.postgres.database.azure.com`), **usuario admin** y **contraseña**.

---

## 2. Migrar los datos actuales (desde tu PC, una vez)

```bash
cd plataforma
pip install "psycopg[binary]"

# PowerShell (Windows):
$env:PGHOST="TU-SERVER.postgres.database.azure.com"
$env:PGUSER="tuadmin"
$env:PGPASSWORD="********"
$env:PGDATABASE="upgrade_ms"
$env:PGSSLMODE="require"

python migrate_to_pg.py            # crea el esquema y copia los datos
# (usa  python migrate_to_pg.py --truncate  para rehacer la carga desde cero)
```

> Flexible Server: el usuario es solo `tuadmin`.
> (Si fuera el antiguo *Single Server*, sería `tuadmin@TU-SERVER`.)

---

## 3. Configurar el App Service (una vez)

Portal → tu App Service:

**a) Configuration → Application settings** (añade estas variables):

| Nombre | Valor |
|---|---|
| `PGHOST` | `TU-SERVER.postgres.database.azure.com` |
| `PGUSER` | `tuadmin` |
| `PGPASSWORD` | `********` |
| `PGDATABASE` | `upgrade_ms` |
| `PGSSLMODE` | `require` |
| `SCM_DO_BUILD_DURING_DEPLOYMENT` | `1` |

**b) Configuration → General settings → Startup Command:**

```
python app.py
```

(La app lee el puerto de `$PORT`, que Azure inyecta automáticamente.)

Guarda; el App Service se reinicia.

---

## 4. Desplegar con GitHub Actions

1. Crea el repositorio git **dentro de `plataforma/`** (así los Excel de clientes
   quedan fuera del repo, ya excluidos por `.gitignore`):

   ```bash
   cd plataforma
   git init
   git add .
   git commit -m "Plataforma Upgrade MS sobre PostgreSQL + deploy a App Service"
   git branch -M main
   git remote add origin https://github.com/TU-USUARIO/TU-REPO.git
   git push -u origin main
   ```

2. Edita `.github/workflows/deploy.yml` y pon el **nombre exacto** de tu App Service
   en `AZURE_WEBAPP_NAME`.

3. **Publish profile como secreto:**
   - Portal → tu App Service → *Overview* → **Download publish profile**.
   - GitHub → repo → *Settings* → *Secrets and variables* → *Actions* → *New secret*:
     - Nombre: `AZURE_WEBAPP_PUBLISH_PROFILE`
     - Valor: pega el contenido completo del archivo descargado.

4. Haz `git push` (o corre el workflow manualmente). Cada push a `main` despliega.

---

## 5. Verificar

- App Service → *Log stream*: debe verse `Plataforma Upgrade MS -> http://0.0.0.0:8000`.
- Abre `https://TU-APP.azurewebsites.net` → carga el dashboard con tus datos.

## Notas

- Ya **no** se usa `upgrade_ms.db` en producción; los datos viven en PostgreSQL.
- Para desarrollo local contra PostgreSQL, define las mismas variables de entorno
  y ejecuta `python app.py` (se abre en `http://localhost:8765`).
- `import_excel.py` sigue siendo para la base **SQLite** local; la carga de nuevos
  recursos en producción se hace desde la propia plataforma (botón *Importar*).
