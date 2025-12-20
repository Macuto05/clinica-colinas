# Script de Configuración de Base de Datos
# Ejecutar: .\setup-database.ps1

Write-Host "==================================" -ForegroundColor Cyan
Write-Host "Configuración de Base de Datos" -ForegroundColor Cyan
Write-Host "Sistema de Gestión de Clínica" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""

# Verificar que PostgreSQL está corriendo
Write-Host "Verificando servicio PostgreSQL..." -ForegroundColor Yellow
$pgService = Get-Service -Name postgresql* -ErrorAction SilentlyContinue

if ($null -eq $pgService) {
    Write-Host "❌ PostgreSQL no está instalado o no se encuentra el servicio" -ForegroundColor Red
    Write-Host "Por favor, instala PostgreSQL desde: https://www.postgresql.org/download/windows/" -ForegroundColor Yellow
    exit 1
}

if ($pgService.Status -ne "Running") {
    Write-Host "Iniciando servicio PostgreSQL..." -ForegroundColor Yellow
    Start-Service $pgService.Name
    Start-Sleep -Seconds 2
}

Write-Host "✅ PostgreSQL está corriendo" -ForegroundColor Green
Write-Host ""

# Pedir credenciales
Write-Host "Ingresa las credenciales de PostgreSQL:" -ForegroundColor Cyan
$dbUser = Read-Host "Usuario de PostgreSQL (default: postgres)"
if ([string]::IsNullOrWhiteSpace($dbUser)) {
    $dbUser = "postgres"
}

$dbPassword = Read-Host "Contraseña de PostgreSQL" -AsSecureString
$dbPasswordPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
    [Runtime.InteropServices.Marshal]::SecureStringToBSTR($dbPassword)
)

$dbName = Read-Host "Nombre de la base de datos (default: clinica_db)"
if ([string]::IsNullOrWhiteSpace($dbName)) {
    $dbName = "clinica_db"
}

Write-Host ""
Write-Host "Creando base de datos '$dbName'..." -ForegroundColor Yellow

# Crear base de datos usando psql
$env:PGPASSWORD = $dbPasswordPlain
$createDbCommand = "CREATE DATABASE $dbName;"

try {
    # Intentar crear la base de datos
    echo $createDbCommand | psql -U $dbUser -h localhost -p 5432 2>&1 | Out-Null
    
    if ($LASTEXITCODE -eq 0 -or $LASTEXITCODE -eq 1) {
        Write-Host "✅ Base de datos creada (o ya existía)" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Verifica que la contraseña sea correcta" -ForegroundColor Yellow
    }
} catch {
    Write-Host "⚠️  Error al crear base de datos: $_" -ForegroundColor Yellow
    Write-Host "Puedes crear manualmente con: psql -U $dbUser" -ForegroundColor Yellow
}

# Limpiar password del entorno
Remove-Item Env:\PGPASSWORD

Write-Host ""
Write-Host "Creando archivo .env..." -ForegroundColor Yellow

# Crear archivo .env
$databaseUrl = "postgresql://${dbUser}:${dbPasswordPlain}@localhost:5432/${dbName}"
$jwtSecret = -join ((65..90) + (97..122) + (48..57) | Get-Random -Count 32 | ForEach-Object {[char]$_})

$envContent = @"
# Database Configuration
DATABASE_URL="$databaseUrl"

# JWT Secret
JWT_SECRET="$jwtSecret"

# Environment
NODE_ENV="development"
"@

$envContent | Out-File -FilePath ".env" -Encoding UTF8
Write-Host "✅ Archivo .env creado" -ForegroundColor Green

Write-Host ""
Write-Host "Ejecutando migraciones de Prisma..." -ForegroundColor Yellow
Write-Host ""

# Generar cliente Prisma
npx prisma generate

# Ejecutar migraciones
npx prisma migrate dev --name init

Write-Host ""
Write-Host "==================================" -ForegroundColor Green
Write-Host "✅ Configuración Completada!" -ForegroundColor Green
Write-Host "==================================" -ForegroundColor Green
Write-Host ""
Write-Host "Próximos pasos:" -ForegroundColor Cyan
Write-Host "1. Ejecuta 'npm run build' para compilar el proyecto" -ForegroundColor White
Write-Host "2. Ejecuta 'npm run dev' para iniciar el servidor" -ForegroundColor White
Write-Host "3. Abre http://localhost:3000" -ForegroundColor White
Write-Host ""
Write-Host "Para ver la base de datos usa: npx prisma studio" -ForegroundColor Yellow
Write-Host ""
