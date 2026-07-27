# migrate-console-to-logger.ps1
# Replaces console.log/warn/error/debug/info with logger.* across all production source files.
# Adds `import { logger } from '...'` where missing.
# Uses line-based import insertion (no complex regex) to avoid timeout on large files.

param([string]$srcRoot = "C:\Users\anton\DocenteDocAI\DocenteDocAi\src")

# Files to skip (service worker or the logger itself)
$skipFiles = @(
  "sw.ts",
  "utils\logger.ts",
  "services\errorLogger.ts"
)

# Files that already import logger (no import insertion needed)
$alreadyImports = @(
  "components\ErrorLogsDashboard.tsx",
  "components\GanttBar.tsx",
  "components\ProgettazioneHub.tsx",
  "components\Settings.tsx",
  "components\UdaPlanner.tsx",
  "hooks\useAppEngine.ts",
  "main.tsx"
)

$files = Get-ChildItem $srcRoot -Recurse -Include "*.tsx","*.ts" |
  Where-Object { $_.FullName -notmatch "__tests__|\.test\.|stories|storybook" }

$count = 0
foreach ($file in $files) {
  $relPath = $file.FullName.Substring($srcRoot.Length + 1)

  if ($skipFiles -contains $relPath) { continue }

  $content = [System.IO.File]::ReadAllText($file.FullName, [System.Text.Encoding]::UTF8)

  if ($content -notmatch "console\.(log|warn|error|debug|info)") { continue }

  # Compute relative import path based on directory depth
  $parts = $relPath.Split("\")
  $dir = if ($parts.Count -gt 1) { ($parts[0..($parts.Count - 2)]) -join "\" } else { "" }

  $loggerPath = if ($dir -eq "utils") { "./logger" }
                elseif ($dir -eq "")  { "./utils/logger" }
                elseif ($dir -match "\\") { "../../utils/logger" }
                else { "../utils/logger" }

  $modified = $false

  # Add import if not already present — line-based insertion, no complex regex
  if (($alreadyImports -notcontains $relPath) -and ($content -notmatch "from ['""].*logger['""]")) {
    $importLine = "import { logger } from '$loggerPath';"
    $lines = $content -split "`n"
    # Find last line that ENDS an import statement (handles multi-line imports).
    # Pattern: line ending with a closing quote + optional semicolon (e.g.: } from './ui'; or from '../types';)
    $lastImportEndIdx = -1
    for ($i = 0; $i -lt $lines.Count; $i++) {
      if ($lines[$i] -match "from\s+['""][^'""]+['""]\s*;?\s*$") { $lastImportEndIdx = $i }
    }
    if ($lastImportEndIdx -ge 0) {
      $before = @($lines[0..$lastImportEndIdx])
      $after  = if (($lastImportEndIdx + 1) -lt $lines.Count) {
                  @($lines[($lastImportEndIdx + 1)..($lines.Count - 1)])
                } else { @() }
      $content = ($before + @($importLine) + $after) -join "`n"
    } else {
      $content = "$importLine`n$content"
    }
    $modified = $true
  }

  # Replace console calls
  $before = $content
  $content = $content -replace "\bconsole\.log\(",   "logger.debug("
  $content = $content -replace "\bconsole\.debug\(", "logger.debug("
  $content = $content -replace "\bconsole\.info\(",  "logger.info("
  $content = $content -replace "\bconsole\.warn\(",  "logger.warn("
  $content = $content -replace "\bconsole\.error\(", "logger.error("

  if ($content -ne $before) { $modified = $true }

  if ($modified) {
    [System.IO.File]::WriteAllText($file.FullName, $content, [System.Text.UTF8Encoding]::new($false))
    $count++
    Write-Host "  migrated: $relPath"
  }
}

Write-Host "`nDone. Files migrated: $count"
