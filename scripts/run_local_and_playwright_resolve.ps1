<#
Robust runner for local smoke tests with diagnostics.

Usage: run from repository root (PowerShell).
  powershell -NoProfile -ExecutionPolicy Bypass -File scripts\run_local_and_playwright_resolve.ps1

What it does:
- Kills stray node processes
- Builds production bundle
- Starts `vite preview` detached, writes logs to `test-vite.log`
- Waits for http://localhost:5173 up (120s)
- Runs Playwright in headed mode with tracing on, single worker
- Captures `test-playwright.log` and leaves trace zips in `test-results/`
- Prints helpful next steps and paths to artifacts

This script is defensive and suitable for CI reproduction on a local machine with GUI.
#>

Set-StrictMode -Version Latest
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

$root = (Get-Location).Path
Write-Output "[$(Get-Date -Format o)] Starting run_local_and_playwright_resolve.ps1 in $root"

function Kill-NodeIfAny {
    Write-Output "Killing node.exe processes if any..."
    try { Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue } catch {}
}

Kill-NodeIfAny

Write-Output "Building production bundle..."
$build = Start-Process -FilePath npm -ArgumentList 'run','build' -NoNewWindow -Wait -PassThru
if ($build.ExitCode -ne 0) { Write-Error 'npm run build failed'; exit $build.ExitCode }

Write-Output "Starting vite preview detached (logs -> test-vite.log)..."
# Start preview detached using cmd start to keep it backgrounded; redirect logs to file
Start-Process -FilePath 'cmd.exe' -ArgumentList '/c start "" /B npx vite preview --port 5173 --strictPort > test-vite.log 2>&1' -NoNewWindow | Out-Null

Write-Output "Waiting for http://localhost:5173/ (120s max)"
$up = $false
for ($i=0; $i -lt 120; $i++) {
    try {
        $r = Invoke-WebRequest -UseBasicParsing -Uri http://localhost:5173/ -TimeoutSec 3 -ErrorAction Stop
        if ($r.StatusCode -eq 200) { $up = $true; break }
    } catch {}
    Start-Sleep -Seconds 1
}

if (-not $up) {
    Write-Output "DEV_SERVER_NOT_UP"
    if (Test-Path test-vite.log) { Write-Output "--- test-vite.log (head) ---"; Get-Content test-vite.log -TotalCount 200 }
    exit 1
}

Write-Output "DEV_SERVER_UP"

Write-Output "Running Playwright smoke tests (headed, trace=on, workers=1). Logs -> test-playwright.log"
$env:VITE_TEST_MODE = 'true'
$env:PLAYWRIGHT_BASE_URL = 'http://localhost:5173'

# Ensure single worker to avoid parallel browser closures and keep traces deterministic
$pwCmd = 'npx playwright test e2e/smoke.spec.ts --headed --workers=1 --trace=on --reporter=list'
Write-Output "Executing: $pwCmd"
try {
    # Use powershell to ensure env vars are visible
    powershell -NoProfile -ExecutionPolicy Bypass -Command "$env:VITE_TEST_MODE='true'; $env:PLAYWRIGHT_BASE_URL='http://localhost:5173'; & npx playwright test e2e/smoke.spec.ts --headed --workers=1 --trace=on --reporter=list" 2>&1 | Tee-Object test-playwright.log
    $pwExit = $LASTEXITCODE
} catch {
    Write-Error "Playwright run failed to start: $_"
    exit 1
}

Write-Output "Playwright exit code: $pwExit"

if ($pwExit -ne 0) {
    Write-Output "Tests failed. Traces (if any) are under the generated test-results folders."
    Write-Output "To inspect traces locally run: npx playwright show-trace <path-to-trace.zip>"
    Write-Output "Example: npx playwright show-trace test-results\\smoke-*/trace.zip"
    Write-Output "Also see: test-playwright.log and test-vite.log"
    exit $pwExit
}

Write-Output "All tests passed. Logs: test-playwright.log, preview logs: test-vite.log"
exit 0
