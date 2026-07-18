param(
  [string]$Branch = "main",
  [string]$Repo = "leisstyler-hub/menu-engineering-dashboard",
  [switch]$SkipFetch
)

$ErrorActionPreference = "Stop"

function Write-Step($Message) {
  Write-Host ""
  Write-Host "==> $Message" -ForegroundColor Cyan
}

function Write-Pass($Message) {
  Write-Host "[pass] $Message" -ForegroundColor Green
}

function Write-Warn($Message) {
  Write-Host "[warn] $Message" -ForegroundColor Yellow
}

function Fail($Message) {
  throw $Message
}

function Resolve-FirstExistingPath($Paths) {
  foreach ($path in $Paths) {
    if ($path -and (Test-Path -LiteralPath $path)) {
      return (Resolve-Path -LiteralPath $path).Path
    }
  }
  return $null
}

function Invoke-Checked($FilePath, $Arguments, $SecretToRedact = "") {
  $process = New-Object System.Diagnostics.Process
  $process.StartInfo.FileName = $FilePath
  $process.StartInfo.Arguments = ($Arguments | ForEach-Object {
    $value = [string]$_
    if ($value -notmatch '[\s"]') { $value } else { '"' + ($value -replace '"', '\"') + '"' }
  }) -join " "
  $process.StartInfo.UseShellExecute = $false
  $process.StartInfo.RedirectStandardOutput = $true
  $process.StartInfo.RedirectStandardError = $true
  $process.StartInfo.CreateNoWindow = $true
  $null = $process.Start()
  $stdout = $process.StandardOutput.ReadToEnd()
  $stderr = $process.StandardError.ReadToEnd()
  $process.WaitForExit()
  $output = @()
  if ($stdout) { $output += $stdout -split "`r?`n" | Where-Object { $_ } }
  if ($stderr) { $output += $stderr -split "`r?`n" | Where-Object { $_ } }
  if ($SecretToRedact) {
    $output = $output | ForEach-Object { $_.ToString() -replace [regex]::Escape($SecretToRedact), "***TOKEN***" }
  }
  if ($output) { $output | ForEach-Object { Write-Host $_ } }
  if ($process.ExitCode -ne 0) {
    Fail "$FilePath $($Arguments -join ' ') failed with exit code $($process.ExitCode)"
  }
  return $output
}

$repoRoot = (Resolve-Path -LiteralPath (Join-Path $PSScriptRoot "..")).Path
Set-Location $repoRoot

$portableToolsRoot = "C:\Users\leiss\Documents\Codex\2026-06-15\i-cant-get-in-my-other\tools"
$git = Resolve-FirstExistingPath @(
  $env:GIT_PATH,
  (Join-Path $portableToolsRoot "git\cmd\git.exe"),
  (Join-Path $portableToolsRoot "mingit\cmd\git.exe")
)
$gh = Resolve-FirstExistingPath @(
  $env:GH_CLI_PATH,
  (Join-Path $portableToolsRoot "gh\bin\gh.exe")
)

if (-not $git) { Fail "Portable Git was not found. Set GIT_PATH or restore $portableToolsRoot." }
if (-not $gh) { Fail "GitHub CLI was not found. Set GH_CLI_PATH or restore $portableToolsRoot." }

$env:GIT_TERMINAL_PROMPT = "0"

Write-Step "Git HTTPS repair context"
Write-Host "Repo: $repoRoot"
Write-Host "Target: $Repo / $Branch"
Write-Host "Git: $git"
Write-Host "GitHub CLI: $gh"

Write-Step "Known-bad default checks"
$runtimeGit = Resolve-FirstExistingPath @(
  "C:\Users\leiss\.cache\codex-runtimes\codex-primary-runtime\dependencies\native\git\cmd\git.exe"
)
if ($runtimeGit) {
  $runtimeExec = & $runtimeGit --exec-path
  $runtimeRemote = Join-Path $runtimeExec "git-remote-https.exe"
  if (-not (Test-Path -LiteralPath $runtimeRemote)) {
    Write-Warn "Codex runtime Git is missing git-remote-https.exe. Do not use it for GitHub HTTPS operations."
  }
}

Write-Step "Authentication"
$token = (& $gh auth token --hostname github.com 2>$null)
if (-not $token) { Fail "GitHub CLI is not authenticated. Run gh auth login or reconnect GitHub, then retry." }
$token = $token.Trim()
Write-Pass "GitHub CLI token is available. Secret value will not be printed."

Write-Step "Portable Git HTTPS"
$opensslBackend = (& $git -c "http.sslBackend=openssl" config --get http.sslBackend).Trim()
if ($opensslBackend -ne "openssl") {
  Fail "Portable Git did not accept http.sslBackend=openssl. Found '$opensslBackend'."
}
Write-Pass "Portable Git accepts OpenSSL."

$remoteUrl = "https://x-access-token:$token@github.com/$Repo.git"
Invoke-Checked $git @("-c", "http.sslBackend=openssl", "-c", "credential.helper=", "-c", "safe.directory=$repoRoot", "ls-remote", $remoteUrl, "HEAD") $token | Out-Null
Write-Pass "GitHub HTTPS check succeeded through portable Git/OpenSSL."

if (-not $SkipFetch) {
  Write-Step "Refresh origin"
  Invoke-Checked $git @("-c", "http.sslBackend=openssl", "-c", "credential.helper=", "-c", "safe.directory=$repoRoot", "fetch", $remoteUrl, "${Branch}:refs/remotes/origin/${Branch}") $token | Out-Null
  $remoteSha = (& $git -c "safe.directory=$repoRoot" rev-parse "refs/remotes/origin/$Branch").Trim()
  Write-Pass "origin/$Branch refreshed to $remoteSha."
}

Write-Step "Status"
Invoke-Checked $git @("-c", "safe.directory=$repoRoot", "status", "--short", "--branch") | Out-Null

Write-Host ""
Write-Host "GitHub HTTPS repair check complete." -ForegroundColor Green
Write-Host "Use scripts\publish-live.ps1 for publish work; it uses the same portable Git/OpenSSL path."
