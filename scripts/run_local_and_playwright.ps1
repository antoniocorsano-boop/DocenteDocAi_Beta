# Clean start: kill node, start Vite detached, wait for it, run Playwright, show logs
$ErrorActionPreference = 'Stop'

Write-Output "Killing any node.exe processes..."
try { taskkill /IM node.exe /F | Out-Null } catch { }

Write-Output "Starting Vite detached (logs -> test-vite.log)..."
# Use cmd start to detach and redirect output to test-vite.log
cmd /c start "" /B cmd /c "npx vite --port 5173 > test-vite.log 2>&1"

# Wait for server up to 120s
Write-Output "Waiting for http://localhost:5173/ (120s max)..."
$up = $false
for ($i = 0; $i -lt 120; $i++) {
    try {
        $r = Invoke-WebRequest -UseBasicParsing -Uri 'http://localhost:5173/' -TimeoutSec 3
        if ($r.StatusCode -eq 200) { $up = $true; break }
    } catch {
        Start-Sleep -Seconds 1
    }
}
if (-not $up) {
    Write-Output 'DEV_SERVER_NOT_UP'
    Write-Output '--- VITE LOG (first 200 lines) ---'
    if (Test-Path test-vite.log) { Get-Content test-vite.log -TotalCount 200 } else { Write-Output 'no test-vite.log found' }
    exit 1
}

Write-Output 'DEV_SERVER_UP'

Write-Output "Running Playwright smoke tests (logs -> test-playwright.log)..."
# Run Playwright (will start its own webServer if needed, but we have dev server)
npx playwright test e2e/smoke.spec.ts --project=chromium --reporter=list --workers=1 > test-playwright.log 2>&1

Write-Output '--- VITE LOG (first 200 lines) ---'
if (Test-Path test-vite.log) { Get-Content test-vite.log -TotalCount 200 } else { Write-Output 'no test-vite.log found' }
Write-Output '--- PLAYWRIGHT LOG (first 400 lines) ---'
if (Test-Path test-playwright.log) { Get-Content test-playwright.log -TotalCount 400 } else { Write-Output 'no test-playwright.log found' }

Write-Output 'Done.'
