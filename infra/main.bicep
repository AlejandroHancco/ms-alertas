// =============================================================================
// Plataforma Upgrade MS · infraestructura en Azure
//
// Crea, dentro del resource group donde se despliega:
//   - App Service Plan Linux (B1 por defecto)
//   - Web App Python 3.12 que ejecuta `python app.py`
//   - Azure Database for PostgreSQL Flexible Server (Burstable B1ms, v16)
//     + base de datos `upgrade_ms` + reglas de firewall
//
// Réplica de lo que hoy corre en rg-upgrade-ms-dev. Guía paso a paso: infra/README.md
//
//   az deployment group create -g <rg> -f infra/main.bicep -p infra/main.bicepparam
// =============================================================================

targetScope = 'resourceGroup'

@description('Región de todos los recursos.')
param location string = resourceGroup().location

@description('Prefijo de nombres (minúsculas, sin espacios).')
@minLength(3)
@maxLength(20)
param namePrefix string = 'upgrade-ms'

@description('Entorno: forma parte de los nombres (dev, prod, ...).')
@maxLength(8)
param environment string = 'prod'

@description('SKU del App Service Plan (B1, B2, S1, P0v3, ...).')
param appServiceSku string = 'B1'

@description('Versión de Python del runtime de la Web App.')
param pythonVersion string = '3.12'

@description('Usuario administrador de PostgreSQL.')
param pgAdminUser string = 'pgadmin'

@description('Contraseña del administrador de PostgreSQL.')
@secure()
@minLength(12)
param pgAdminPassword string

@description('SKU de PostgreSQL. Standard_B1ms = Burstable (el actual).')
param pgSkuName string = 'Standard_B1ms'

@description('Tier de PostgreSQL: Burstable, GeneralPurpose o MemoryOptimized (debe coincidir con el SKU).')
@allowed([ 'Burstable', 'GeneralPurpose', 'MemoryOptimized' ])
param pgSkuTier string = 'Burstable'

@description('Versión mayor de PostgreSQL.')
param pgVersion string = '16'

@description('Almacenamiento de PostgreSQL en GB.')
param pgStorageGB int = 32

@description('Días de retención de backups de PostgreSQL (7-35).')
@minValue(7)
@maxValue(35)
param pgBackupRetentionDays int = 7

@description('Nombre de la base de datos de la plataforma.')
param pgDatabaseName string = 'upgrade_ms'

@description('Correo que se promueve a admin si no existe ningún admin (variable ADMIN_CORREO).')
param adminCorreo string = 'alejandro.hancco@gestionysistemas.com'

@description('IP pública opcional que puede conectarse a PostgreSQL (p. ej. tu PC para migrar datos). Vacío = ninguna.')
param clientIp string = ''

var suffix = substring(uniqueString(resourceGroup().id), 0, 6)
var planName = 'asp-${namePrefix}-${environment}'
var webAppName = 'app-${namePrefix}-${environment}-${suffix}'
var pgServerName = 'pg-${namePrefix}-${environment}-${suffix}'
var tags = {
  app: 'plataforma-upgrade-ms'
  env: environment
}

// ---------------------------------------------------------------------------
// PostgreSQL Flexible Server
// ---------------------------------------------------------------------------
resource pg 'Microsoft.DBforPostgreSQL/flexibleServers@2024-08-01' = {
  name: pgServerName
  location: location
  tags: tags
  sku: {
    name: pgSkuName
    tier: pgSkuTier
  }
  properties: {
    version: pgVersion
    administratorLogin: pgAdminUser
    administratorLoginPassword: pgAdminPassword
    storage: {
      storageSizeGB: pgStorageGB
      autoGrow: 'Enabled'
    }
    backup: {
      backupRetentionDays: pgBackupRetentionDays
      geoRedundantBackup: 'Disabled'
    }
    highAvailability: {
      mode: 'Disabled'
    }
    network: {
      publicNetworkAccess: 'Enabled'
    }
  }
}

resource pgDb 'Microsoft.DBforPostgreSQL/flexibleServers/databases@2024-08-01' = {
  parent: pg
  name: pgDatabaseName
  properties: {
    charset: 'UTF8'
    collation: 'en_US.utf8'
  }
}

// 0.0.0.0 - 0.0.0.0 = "Allow public access from any Azure service" (lo usa el App Service).
resource fwAzure 'Microsoft.DBforPostgreSQL/flexibleServers/firewallRules@2024-08-01' = {
  parent: pg
  name: 'AllowAllAzureServices'
  properties: {
    startIpAddress: '0.0.0.0'
    endIpAddress: '0.0.0.0'
  }
}

resource fwClient 'Microsoft.DBforPostgreSQL/flexibleServers/firewallRules@2024-08-01' = if (!empty(clientIp)) {
  parent: pg
  name: 'ClientIp'
  properties: {
    startIpAddress: clientIp
    endIpAddress: clientIp
  }
}

// ---------------------------------------------------------------------------
// App Service (Linux, Python)
// ---------------------------------------------------------------------------
resource plan 'Microsoft.Web/serverfarms@2023-12-01' = {
  name: planName
  location: location
  tags: tags
  kind: 'linux'
  sku: {
    name: appServiceSku
  }
  properties: {
    reserved: true // obligatorio para Linux
  }
}

resource web 'Microsoft.Web/sites@2023-12-01' = {
  name: webAppName
  location: location
  tags: tags
  kind: 'app,linux'
  properties: {
    serverFarmId: plan.id
    httpsOnly: true
    siteConfig: {
      linuxFxVersion: 'PYTHON|${pythonVersion}'
      appCommandLine: 'python app.py' // la app lee $PORT y escucha en 0.0.0.0
      alwaysOn: true                  // sesiones en memoria: evita que la app se duerma
      ftpsState: 'Disabled'
      minTlsVersion: '1.2'
      http20Enabled: true
      appSettings: [
        { name: 'SCM_DO_BUILD_DURING_DEPLOYMENT', value: 'true' } // pip install -r requirements.txt
        { name: 'PGHOST', value: pg.properties.fullyQualifiedDomainName }
        { name: 'PGPORT', value: '5432' }
        { name: 'PGDATABASE', value: pgDatabaseName }
        { name: 'PGUSER', value: pgAdminUser }
        { name: 'PGPASSWORD', value: pgAdminPassword }
        { name: 'PGSSLMODE', value: 'require' }
        { name: 'ADMIN_CORREO', value: adminCorreo }
      ]
    }
  }
  dependsOn: [
    pgDb
    fwAzure
  ]
}

// El workflow de GitHub despliega con "publish profile", que necesita la
// autenticación básica de SCM (en Web Apps nuevas viene desactivada). FTP queda apagado.
resource scmBasicAuth 'Microsoft.Web/sites/basicPublishingCredentialsPolicies@2023-12-01' = {
  parent: web
  name: 'scm'
  properties: {
    allow: true
  }
}

resource ftpBasicAuth 'Microsoft.Web/sites/basicPublishingCredentialsPolicies@2023-12-01' = {
  parent: web
  name: 'ftp'
  properties: {
    allow: false
  }
}

output webAppName string = web.name
output webAppUrl string = 'https://${web.properties.defaultHostName}'
output pgHost string = pg.properties.fullyQualifiedDomainName
output pgServerName string = pg.name
