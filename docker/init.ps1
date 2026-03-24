# ===================================
# docker/init.ps1
# Creates local dev files from examples
# Run from docker/: .\init.ps1
# ===================================

# Resolve to script's own directory
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Push-Location $ScriptDir
try {

Write-Host ""
Write-Host "🚀 Spec-2-Start — Local Setup" -ForegroundColor Cyan
Write-Host "===============================" -ForegroundColor Cyan

# .env
if (-Not (Test-Path ".env")) {
    Write-Host "Creating .env from .env-example..." -ForegroundColor Yellow
    $header = @(
        "# WARNING: only for local development — do not use in production"
        "# Generated from .env-example"
        ""
    )
    $content = Get-Content ".env-example"
    ($header + $content) | Set-Content ".env" -Encoding UTF8
    Write-Host "✅ .env created" -ForegroundColor Green
} else {
    Write-Host "ℹ️  .env already exists, skipping" -ForegroundColor Gray
}

# docker-compose.yaml
if (-Not (Test-Path "docker-compose.yaml")) {
    Write-Host "Creating docker-compose.yaml from docker-compose.yaml-example..." -ForegroundColor Yellow
    $header = @(
        "# WARNING: only for local development — do not use in production"
        "# Generated from docker-compose.yaml-example"
        ""
    )
    $content = Get-Content "docker-compose.yaml-example"
    ($header + $content) | Set-Content "docker-compose.yaml" -Encoding UTF8
    Write-Host "✅ docker-compose.yaml created" -ForegroundColor Green
} else {
    Write-Host "ℹ️  docker-compose.yaml already exists, skipping" -ForegroundColor Gray
}

Write-Host ""
Write-Host "✅ Setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "   Build and start:" -ForegroundColor White
Write-Host "   docker compose up --build -d" -ForegroundColor Cyan
Write-Host ""
Write-Host "   Open in browser:" -ForegroundColor White
Write-Host "   http://localhost:8080" -ForegroundColor Cyan
Write-Host ""

} finally { Pop-Location }
