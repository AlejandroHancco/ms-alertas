using './main.bicep'

// Parámetros del despliegue. La contraseña NO se guarda aquí: se lee de la
// variable de entorno PG_ADMIN_PASSWORD al ejecutar el despliegue.
param location = 'centralus'
param namePrefix = 'upgrade-ms'
param environment = 'prod'
param appServiceSku = 'B1'
param pgSkuName = 'Standard_B1ms'
param pgSkuTier = 'Burstable'
param pgStorageGB = 32
// Zona fija: en esta suscripción Central US devolvió CapacityNotAvailable sin zona.
param pgAvailabilityZone = readEnvironmentVariable('PG_ZONE', '')
param pgAdminUser = 'pgadmin'
param pgAdminPassword = readEnvironmentVariable('PG_ADMIN_PASSWORD')
param adminCorreo = 'alejandro.hancco@gestionysistemas.com'

// Tu IP pública para poder migrar los datos desde tu PC (quítala al terminar).
param clientIp = readEnvironmentVariable('CLIENT_IP', '')
