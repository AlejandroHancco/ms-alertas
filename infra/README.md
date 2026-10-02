# Infraestructura como código (Bicep) · migrar a otra suscripción

`main.bicep` crea desde cero todo lo que necesita la plataforma, igual a lo que hoy
corre en `rg-upgrade-ms-dev` (suscripción actual):

| Recurso | Configuración por defecto |
|---|---|
| App Service Plan | Linux · **B1** |
| Web App | Python **3.12** · arranque `python app.py` · HTTPS only · Always On · TLS 1.2 · FTP apagado |
| PostgreSQL Flexible Server | **v16** · **Burstable B1ms** · 32 GB (autogrow) · backups 7 días · acceso público |
| Base de datos | `upgrade_ms` (UTF8) |
| Firewall PostgreSQL | *AllowAllAzureServices* (para el App Service) + tu IP opcional |
| App settings | `PGHOST` `PGPORT` `PGDATABASE` `PGUSER` `PGPASSWORD` `PGSSLMODE=require` `ADMIN_CORREO` `SCM_DO_BUILD_DURING_DEPLOYMENT` |

Los nombres llevan un sufijo único por resource group (p. ej. `app-upgrade-ms-prod-a1b2c3`,
`pg-upgrade-ms-prod-a1b2c3`), porque ambos deben ser únicos en todo Azure.

Archivos:

| Archivo | Qué es |
|---|---|
| `main.bicep` | La plantilla (recursos + salidas `webAppName`, `webAppUrl`, `pgHost`). |
| `main.bicepparam` | Valores del despliegue. La contraseña se lee de la variable `PG_ADMIN_PASSWORD`; nunca se escribe en el repo. |

---

## Requisitos

- Azure CLI ≥ 2.60 (`az version`) con Bicep (`az bicep install`).
- Herramientas cliente de PostgreSQL (`pg_dump`, `pg_restore`, `psql`) versión ≥ 16
  (en Windows: `C:\Program Files\PostgreSQL\18\bin`).
- Permiso **Owner** o **Contributor** en la suscripción destino.

Los comandos están en **PowerShell**.

---

## 1. Crear la infraestructura en la nueva suscripción

```powershell
az login
az account set --subscription "<NOMBRE-O-ID-DE-LA-SUSCRIPCION-NUEVA>"

# Resource group de destino
az group create -n rg-upgrade-ms-prod -l centralus

# Contraseña del admin de PostgreSQL (mín. 12 caracteres, mayúsculas, minúsculas y números)
$env:PG_ADMIN_PASSWORD = "<contraseña-segura>"
# Tu IP pública, para poder cargar los datos desde tu PC
$env:CLIENT_IP = (Invoke-RestMethod https://api.ipify.org)

# (opcional) ver qué se va a crear, sin crear nada
az deployment group what-if -g rg-upgrade-ms-prod -f infra/main.bicep -p infra/main.bicepparam

# Desplegar (PostgreSQL tarda ~5-10 min)
az deployment group create -g rg-upgrade-ms-prod -f infra/main.bicep -p infra/main.bicepparam `
  --query properties.outputs
```

Anota las salidas `webAppName`, `webAppUrl` y `pgHost`.

> Para cambiar región, tamaños o nombres edita `main.bicepparam`
> (p. ej. `appServiceSku = 'B2'`, o `pgSkuName = 'Standard_D2ds_v5'` con `pgSkuTier = 'GeneralPurpose'`).
> Volver a ejecutar el despliegue es seguro: solo aplica las diferencias.

---

## 2. Migrar los datos (PostgreSQL → PostgreSQL)

Haz la copia **antes** del primer despliegue del código. Así la app arranca sobre los datos
reales y no sobre un esquema vacío.

```powershell
$bin = "C:\Program Files\PostgreSQL\18\bin"

# --- origen (servidor actual) ---
# Tu IP debe estar permitida en el firewall del servidor de origen (Portal → Networking).
$env:PGSSLMODE = "require"
$env:PGPASSWORD = "<contraseña-origen>"
& "$bin\pg_dump.exe" -h pg-upgrade-ms-dev-fl3wb5js453m6.postgres.database.azure.com `
  -U <usuario-origen> -d upgrade_ms -Fc --no-owner --no-acl -f upgrade_ms.dump

# --- destino (servidor nuevo, salida pgHost del paso 1) ---
$env:PGPASSWORD = $env:PG_ADMIN_PASSWORD
& "$bin\pg_restore.exe" -h <pgHost> -U pgadmin -d upgrade_ms --no-owner --no-acl upgrade_ms.dump

# Verificar
& "$bin\psql.exe" -h <pgHost> -U pgadmin -d upgrade_ms `
  -c "SELECT (SELECT COUNT(*) FROM comunicados) com, (SELECT COUNT(*) FROM recursos) rec, (SELECT COUNT(*) FROM miembros) miem;"
```

Las secuencias de los IDs viajan dentro del dump, así que no hay que reajustarlas.
Si te equivocas y quieres repetir la carga, añade `--clean --if-exists` a `pg_restore`.

> `upgrade_ms.dump` contiene datos de clientes. El `.gitignore` ya excluye `*.dump`;
> bórralo de tu PC al terminar.

---

## 3. Desplegar el código (GitHub Actions)

1. En `.github/workflows/deploy.yml` cambia `AZURE_WEBAPP_NAME` por la salida `webAppName`.
2. Descarga el *publish profile* de la nueva Web App:
   ```powershell
   az webapp deployment list-publishing-profiles -g rg-upgrade-ms-prod -n <webAppName> --xml > publish.xml
   ```
3. En GitHub → *Settings → Secrets and variables → Actions*, reemplaza el secreto
   `AZURE_WEBAPP_PUBLISH_PROFILE` con el contenido de `publish.xml`. Después borra el archivo.
4. Haz `git push` a `main` (o ejecuta el workflow a mano desde *Actions*).

---

## 4. Verificar

- App Service → *Log stream*: debe aparecer `Plataforma Upgrade MS -> http://0.0.0.0:8000`.
- Abre `webAppUrl`, inicia sesión y revisa que estén los comunicados, clientes y miembros.
- El primer arranque crea lo que falte del esquema (roles, sesiones, papelera, vista
  `recursos_ult`) y garantiza que exista un admin (`ADMIN_CORREO`).
- Las sesiones están en la base: al migrar, los usuarios siguen logueados solo si el dump es
  posterior a su login; si no, vuelven a iniciar sesión.

---

## 5. Cierre

1. Quita tu IP del firewall del servidor nuevo:
   ```powershell
   az postgres flexible-server firewall-rule delete -g rg-upgrade-ms-prod `
     --server-name <pgServerName> --rule-name ClientIp --yes
   ```
   (o vuelve a desplegar con `CLIENT_IP` vacío).
2. Cuando todo esté validado, apaga o elimina los recursos de la suscripción anterior
   (`rg-upgrade-ms-dev`). **Antes**, guarda un `pg_dump` de respaldo.

---

## Notas y mejoras posibles

- **Secretos:** la contraseña de PostgreSQL queda como *app setting* (igual que hoy). Lo más
  seguro sería guardarla en Key Vault y referenciarla con `@Microsoft.KeyVault(...)`, o usar
  autenticación Entra ID con *managed identity*.
- **Red:** PostgreSQL tiene acceso público y permite *todos los servicios de Azure*. Para
  aislarlo: VNet integration del App Service + PostgreSQL con acceso privado.
- **Despliegue sin publish profile:** se puede cambiar a OIDC (`azure/login` con federated
  credentials). Así ya no hace falta la autenticación básica de SCM que habilita la plantilla.
- **Escalar:** las sesiones viven en PostgreSQL, así que se puede subir el SKU o usar varias
  instancias del App Service sin que los usuarios pierdan la sesión. Cada instancia abre hasta
  `PG_POOL_MAX` conexiones (10 por defecto); B1ms admite ~50 en total.
- `app-upgrade-ms-web-dev` (Node 20), que existe en la suscripción actual, **no** está en la
  plantilla: la plataforma solo usa la Web App de Python, que sirve también el frontend.
  Confírmalo antes de eliminarla.
