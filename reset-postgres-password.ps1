# Script para Resetear Contraseña de PostgreSQL
# Ejecutar como Administrador

Write-Host "==================================" -ForegroundColor Cyan
Write-Host "Reset de Contraseña PostgreSQL" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""

# Encontrar la instalación de PostgreSQL
$pgPaths = @(
    "C:\Program Files\PostgreSQL",
    "C:\PostgreSQL"
)

$pgDataPath = $null
$pgVersion = $null

foreach ($basePath in $pgPaths) {
    if (Test-Path $basePath) {
        $versions = Get-ChildItem -Path $basePath -Directory | Sort-Object Name -Descending
        if ($versions.Count -gt 0) {
            $pgVersion = $versions[0].Name
            $pgDataPath = Join-Path $basePath "$pgVersion\data"
            break
        }
    }
}

if ($null -eq $pgDataPath) {
    Write-Host "❌ No se encontró la instalación de PostgreSQL" -ForegroundColor Red
    Write-Host ""
    Write-Host "Intenta buscar manualmente la carpeta 'data' de PostgreSQL" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ Encontrado PostgreSQL versión $pgVersion" -ForegroundColor Green
Write-Host "Ruta de datos: $pgDataPath" -ForegroundColor Gray
Write-Host ""

# Hacer backup del archivo pg_hba.conf
$pgHbaPath = Join-Path $pgDataPath "pg_hba.conf"
$pgHbaBackup = "${pgHbaPath}.backup"

if (-not (Test-Path $pgHbaPath)) {
    Write-Host "❌ No se encontró el archivo pg_hba.conf" -ForegroundColor Red
    exit 1
}

Write-Host "Haciendo backup de pg_hba.conf..." -ForegroundColor Yellow
Copy-Item $pgHbaPath $pgHbaBackup -Force
Write-Host "✅ Backup creado: $pgHbaBackup" -ForegroundColor Green
Write-Host ""

# Modificar pg_hba.conf para permitir acceso sin contraseña
Write-Host "Modificando configuración temporal..." -ForegroundColor Yellow

$content = Get-Content $pgHbaPath
$newContent = @()

foreach ($line in $content) {
    if ($line -match "^host.*all.*all.*127.0.0.1") {
        # Cambiar md5/scram-sha-256 a trust temporalmente
        $newLine = $line -replace "md5|scram-sha-256|password", "trust"
        $newContent += $newLine
    } elseif ($line -match "^host.*all.*all.*::1") {
        $newLine = $line -replace "md5|scram-sha-256|password", "trust"
        $newContent += $newLine
    } else {
        $newContent += $line
    }
}

$newContent | Set-Content $pgHbaPath
Write-Host "✅ Configuración modificada" -ForegroundColor Green
Write-Host ""

# Reiniciar servicio PostgreSQL
Write-Host "Reiniciando PostgreSQL..." -ForegroundColor Yellow
$pgService = Get-Service -Name postgresql*

Restart-Service $pgService.Name
Start-Sleep -Seconds 3
Write-Host "✅ PostgreSQL reiniciado" -ForegroundColor Green
Write-Host ""

# Pedir nueva contraseña
Write-Host "Ingresa la nueva contraseña para el usuario 'postgres':" -ForegroundColor Cyan
$newPassword = Read-Host "Nueva contraseña" -AsSecureString
$newPasswordPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
    [Runtime.InteropServices.Marshal]::SecureStringToBSTR($newPassword)
)

Write-Host ""
Write-Host "Cambiando contraseña..." -ForegroundColor Yellow

# Cambiar contraseña usando psql
$alterCommand = "ALTER USER postgres WITH PASSWORD '$newPasswordPlain';"
echo $alterCommand | psql -U postgres -h localhost -p 5432

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Contraseña cambiada exitosamente!" -ForegroundColor Green
} else {
    Write-Host "⚠️  Hubo un problema. Intenta manualmente:" -ForegroundColor Yellow
    Write-Host "psql -U postgres" -ForegroundColor White
    Write-Host "ALTER USER postgres WITH PASSWORD 'tu_nueva_contraseña';" -ForegroundColor White
}

Write-Host ""
Write-Host "Restaurando configuración original..." -ForegroundColor Yellow

# Restaurar pg_hba.conf
Copy-Item $pgHbaBackup $pgHbaPath -Force
Remove-Item $pgHbaBackup

# Reiniciar servicio nuevamente
Restart-Service $pgService.Name
Start-Sleep -Seconds 3

Write-Host "✅ Configuración restaurada" -ForegroundColor Green
Write-Host ""
Write-Host "==================================" -ForegroundColor Green
Write-Host "✅ Proceso Completado!" -ForegroundColor Green
Write-Host "==================================" -ForegroundColor Green
Write-Host ""
Write-Host "Tu nueva contraseña es: $newPasswordPlain" -ForegroundColor Yellow
Write-Host "¡Guárdala en un lugar seguro!" -ForegroundColor Yellow
Write-Host ""
Write-Host "Ahora ejecuta de nuevo: .\setup-database.ps1" -ForegroundColor Cyan
Write-Host ""
