# Backup completo del progetto (un solo ZIP, sostituisce il precedente).
# Esegui dalla root del repo o da qualsiasi cartella: powershell -File scripts/full_site_backup.ps1
$ErrorActionPreference = "Stop"

$SiteRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$DestRoot = "C:\Users\eugen\OneDrive\Documents\Tools_Site_full_backups"
$ZipName = "Tools_Site-full-backup.zip"
$ZipPath = Join-Path $DestRoot $ZipName

New-Item -ItemType Directory -Force -Path $DestRoot | Out-Null
Get-ChildItem -Path $DestRoot -Filter "Tools_Site-full-backup*.zip" -File -ErrorAction SilentlyContinue |
    Remove-Item -Force

Push-Location $SiteRoot
try {
    tar.exe -cf $ZipPath `
        --exclude=venv `
        --exclude=.venv_win `
        --exclude=.git `
        --exclude=__pycache__ `
        --exclude="**/__pycache__" `
        --exclude=.cursor `
        .
} finally {
    Pop-Location
}

$sizeMb = [math]::Round((Get-Item $ZipPath).Length / 1MB, 2)
Write-Host "Creato: $ZipPath ($sizeMb MB)"
