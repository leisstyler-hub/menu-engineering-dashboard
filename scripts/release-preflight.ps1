param(
  [switch]$SkipGitHubSync
)

$ErrorActionPreference = "Stop"

function Write-Step($Message) {
  Write-Host ""
  Write-Host "==> $Message" -ForegroundColor Cyan
}

function Write-Pass($Message) {
  Write-Host "[pass] $Message" -ForegroundColor Green
}

function Fail($Message) {
  throw $Message
}

$repoRoot = (Resolve-Path -LiteralPath (Join-Path $PSScriptRoot "..")).Path
Set-Location $repoRoot

Write-Step "Release handoff files"
$requiredFiles = @(
  "AI_HANDOFF.md",
  "CHANGELOG.md",
  "src\shared\appConfig.js",
  "scripts\publish-live.ps1",
  "scripts\repair-git-https.ps1"
)

foreach ($file in $requiredFiles) {
  if (-not (Test-Path -LiteralPath (Join-Path $repoRoot $file))) {
    Fail "Missing required release file: $file"
  }
}
Write-Pass "Release handoff, changelog, app config, publish, and repair files are present."

$versionText = Get-Content -LiteralPath (Join-Path $repoRoot "src\shared\appConfig.js") -Raw
$versionMatch = [regex]::Match($versionText, 'APP_VERSION_STAMP\s*=\s*"([^"]+)"')
$appVersion = if ($versionMatch.Success) { $versionMatch.Groups[1].Value } else { "unknown" }
Write-Host "App version: $appVersion"

Write-Step "GitHub source sync"
if ($SkipGitHubSync) {
  Write-Host "[warn] GitHub sync skipped by -SkipGitHubSync." -ForegroundColor Yellow
} else {
  & (Join-Path $repoRoot "scripts\repair-git-https.ps1")
  if ($LASTEXITCODE -ne 0) {
    Fail "GitHub source sync failed. Run pnpm run repair:git for details."
  }
  Write-Pass "GitHub HTTPS source path is usable and origin/main was refreshed."
}

Write-Step "Publish guidance"
Write-Host "Use pnpm run verify for app behavior, data integrity, storage, or UI changes."
Write-Host "Use publish-live.ps1 -SkipVerify -SkipVercelWait only for docs, handoff, or tooling-only changes."
Write-Pass "Fast release preflight passed."
