# Load WebShield schema + seed data.
# Use MySQL 8.0 (port 3306) — same server as Workbench connection "ProyectoFinal".
$ErrorActionPreference = 'Stop'

$RootDir = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$Port = if ($env:DB_PORT) { $env:DB_PORT } else { '3306' }

$Mysql = 'C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe'
if (-not (Test-Path $Mysql)) {
    $Mysql = 'C:\Program Files\MariaDB 11.8\bin\mysql.exe'
}
if (-not (Test-Path $Mysql)) {
    throw 'mysql.exe not found.'
}

Write-Host '=== WebShield DB setup ==='
Write-Host "Client: $Mysql"
Write-Host "Port:   $Port"
Write-Host ''
Write-Host 'Use the SAME password as MySQL Workbench -> ProyectoFinal.'
Write-Host "If connection fails, start service MYSQL80 in Services.msc (Run as admin)."
Write-Host ''

$mysql80 = Get-Service MYSQL80 -ErrorAction SilentlyContinue
if ($mysql80 -and $mysql80.Status -ne 'Running' -and $Port -eq '3306') {
    Write-Warning 'MYSQL80 is stopped. Start it first:  Start-Service MYSQL80  (requires admin PowerShell)'
}

$Password = Read-Host 'MySQL root password' -AsSecureString
$Bstr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($Password)
$Plain = [Runtime.InteropServices.Marshal]::PtrToStringAuto($Bstr)

& $Mysql -P $Port -u root "-p$Plain" -e "SELECT VERSION() AS server_version;"
Get-Content "$RootDir\database\webshield.sql" | & $Mysql -P $Port -u root "-p$Plain"
Get-Content "$RootDir\database\webshield_data.sql" | & $Mysql -P $Port -u root "-p$Plain" webshield

Write-Host ''
Write-Host "Done. Set webshield-api\.env -> DB_PORT=$Port and DB_PASSWORD=<your password>"
