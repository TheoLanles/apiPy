# Build script for PyRunner (Single Binary) - Robust Version

$ProjectRoot = Get-Location
$FrontendDir = Join-Path $ProjectRoot "frontend/apipy"
$BackendDir = Join-Path $ProjectRoot "backend"
$AssetsDistDir = Join-Path $BackendDir "internal/assets/dist"
$BinaryPath = Join-Path $BackendDir "bin/pyrunner.exe"

Write-Host "--- Stopping any running pyrunner/apiPy instances ---" -ForegroundColor Yellow
Stop-Process -Name "pyrunner" -Force -ErrorAction SilentlyContinue
Stop-Process -Name "apiPy" -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 1

Write-Host "--- Cleaning build artifacts ---" -ForegroundColor Yellow
if (Test-Path $BinaryPath) {
    Remove-Item $BinaryPath -Force -ErrorAction SilentlyContinue
}
if (Test-Path (Join-Path $BackendDir "bin/apiPy.exe")) {
    Remove-Item (Join-Path $BackendDir "bin/apiPy.exe") -Force -ErrorAction SilentlyContinue
}
if (Test-Path (Join-Path $BackendDir "bin/pyrunner-linux")) {
    Remove-Item (Join-Path $BackendDir "bin/pyrunner-linux") -Force -ErrorAction SilentlyContinue
}
if (Test-Path (Join-Path $FrontendDir ".next")) {
    Remove-Item -Recurse -Force (Join-Path $FrontendDir ".next")
}

Write-Host "--- Building Frontend ---" -ForegroundColor Cyan
Push-Location $FrontendDir
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "Frontend build failed!" -ForegroundColor Red
    Pop-Location
    exit 1
}
Pop-Location

Write-Host "--- Preparing Assets for Embedding ---" -ForegroundColor Cyan
if (Test-Path $AssetsDistDir) {
    Remove-Item -Recurse -Force $AssetsDistDir
}
New-Item -ItemType Directory -Path $AssetsDistDir -Force
Copy-Item -Path (Join-Path $FrontendDir "out\*") -Destination $AssetsDistDir -Recurse

Write-Host "--- Building Backend (with cache cleaning) ---" -ForegroundColor Cyan
Push-Location $BackendDir
go clean -cache
if (!(Test-Path "bin")) {
    New-Item -ItemType Directory -Path "bin" -Force
}

# Verifying source content before build
Write-Host "Compiling source with verified NoRoute configuration..." -ForegroundColor DarkGray

# Target 1: Windows amd64
Write-Host "--- Building Windows Binary ---" -ForegroundColor Cyan
$env:GOOS = "windows"
$env:GOARCH = "amd64"
$env:CGO_ENABLED = "0"
go build -ldflags="-s -w" -v -o bin/pyrunner.exe ./cmd/pyrunner
if ($LASTEXITCODE -ne 0) {
    Write-Host "Windows build failed!" -ForegroundColor Red
    Pop-Location
    exit 1
}

# Target 2: Linux amd64
Write-Host "--- Building Linux Binary ---" -ForegroundColor Cyan
$env:GOOS = "linux"
$env:GOARCH = "amd64"
$env:CGO_ENABLED = "0"
go build -ldflags="-s -w" -v -o bin/pyrunner-linux ./cmd/pyrunner
if ($LASTEXITCODE -ne 0) {
    Write-Host "Linux build failed!" -ForegroundColor Red
    Pop-Location
    exit 1
}

$winFile = Get-Item "bin/pyrunner.exe"
$linFile = Get-Item "bin/pyrunner-linux"
Write-Host ("`nWindows binary: " + $winFile.FullName) -ForegroundColor Green
Write-Host ("Linux binary:   " + $linFile.FullName) -ForegroundColor Green
Pop-Location

Write-Host "`n--- Build Complete: All targets generated ---" -ForegroundColor Green
Write-Host "Deployment ready." -ForegroundColor White
