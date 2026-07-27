# Start Vite detached, wait for it, run Playwright and save logs
$ErrorActionPreference = 'Stop'

# Start Vite using npx
Write-Output "Starting Vite on port 5173..."
# Start Vite and capture output to a log for diagnostics
$viteLog = Join-Path $PSScriptRoot '..\test-vite.log'
$viteProc = Start-Process -FilePath 'npx' -ArgumentList @('vite','--port','5173') -RedirectStandardOutput $viteLog -RedirectStandardError $viteLog -PassThru

# Wait for server (increase timeout to 120s)
$max = 120
$ok = $false
for ($i = 0; $i -lt $max; $i++) {
    try {
        $r = Invoke-WebRequest -UseBasicParsing -Uri 'http://localhost:5173/' -TimeoutSec 2
        if ($r.StatusCode -eq 200) { $ok = $true; break }
    } catch {
        Start-Sleep -Seconds 1
    }
}
if (-not $ok) {
    Write-Output 'DEV_SERVER_NOT_UP'
    exit 1
}

Write-Output 'Dev server is up — running Playwright tests'
# Run Playwright and tee output to log
npx playwright test e2e/smoke.spec.ts --project=chromium --reporter=list --workers=1 2>&1 | Tee-Object -FilePath test-playwright.log

# Print summary
Write-Output 'Playwright finished. Log saved to test-playwright.log'

# Optionally stop Vite process
if ($viteProc -and -not $viteProc.HasExited) {
    try { $viteProc | Stop-Process -Force } catch { }
}
