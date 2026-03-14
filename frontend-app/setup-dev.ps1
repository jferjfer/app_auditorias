<#
Simple helper to check Node/npm and run install + dev server for the frontend-app.
Run this from PowerShell as: .\setup-dev.ps1
#>
Write-Host "Checking for Node.js and npm..."

$node = Get-Command node -ErrorAction SilentlyContinue
$npm = Get-Command npm -ErrorAction SilentlyContinue

if(-not $node){
  Write-Host "Node.js is not found in PATH. Please install Node.js (LTS) from https://nodejs.org/ and re-open PowerShell." -ForegroundColor Red
  Exit 2
}

if(-not $npm){
  Write-Host "npm is not found in PATH. Node installer usually includes npm. If you installed Node via nvm-windows ensure you ran 'nvm use <version>'." -ForegroundColor Red
  Exit 2
}

Write-Host "Node: $(node --version)"
Write-Host "npm: $(npm --version)"

Push-Location (Split-Path -Parent $MyInvocation.MyCommand.Definition)

Write-Host "Installing npm dependencies (this may take a minute)..."
npm install
if($LASTEXITCODE -ne 0){ Write-Host "npm install failed. See output above." -ForegroundColor Red; Exit $LASTEXITCODE }

Write-Host "Starting dev server (npm run dev). Press Ctrl+C to stop." -ForegroundColor Green
npm run dev

Pop-Location
