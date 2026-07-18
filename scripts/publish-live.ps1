param(
  [string]$CommitMessage = "",
  [string]$Branch = "main",
  [string]$Repo = "leisstyler-hub/menu-engineering-dashboard",
  [switch]$SkipVerify,
  [switch]$SkipVercelWait,
  [switch]$AllowBehind
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

function ConvertTo-CommandLineArgument($Argument) {
  $value = [string]$Argument
  if ($value -notmatch '[\s"]') { return $value }
  $value = $value -replace '(\\*)"', '$1$1\"'
  $value = $value -replace '(\\+)$', '$1$1'
  return '"' + $value + '"'
}

function Invoke-Checked($FilePath, $Arguments, $SecretToRedact = "") {
  $process = New-Object System.Diagnostics.Process
  $process.StartInfo.FileName = $FilePath
  $process.StartInfo.Arguments = ($Arguments | ForEach-Object { ConvertTo-CommandLineArgument $_ }) -join " "
  $process.StartInfo.UseShellExecute = $false
  $process.StartInfo.RedirectStandardOutput = $true
  $process.StartInfo.RedirectStandardError = $true
  $process.StartInfo.CreateNoWindow = $true
  $null = $process.Start()
  $stdout = $process.StandardOutput.ReadToEnd()
  $stderr = $process.StandardError.ReadToEnd()
  $process.WaitForExit()
  $exitCode = $process.ExitCode
  $output = @()
  if ($stdout) { $output += $stdout -split "`r?`n" | Where-Object { $_ } }
  if ($stderr) { $output += $stderr -split "`r?`n" | Where-Object { $_ } }
  if ($SecretToRedact) {
    $output = $output | ForEach-Object { $_.ToString() -replace [regex]::Escape($SecretToRedact), "***TOKEN***" }
  }
  if ($output) {
    $output | ForEach-Object { Write-Host $_ }
  }
  if ($exitCode -ne 0) {
    Fail "$FilePath $($Arguments -join ' ') failed with exit code $exitCode"
  }
  return $output
}

$repoRoot = (Resolve-Path -LiteralPath (Join-Path $PSScriptRoot "..")).Path
Set-Location $repoRoot

$portableToolsRoot = "C:\Users\leiss\Documents\Codex\2026-06-15\i-cant-get-in-my-other\tools"
$git = Resolve-FirstExistingPath @(
  $env:GIT_PATH,
  (Join-Path $portableToolsRoot "git\cmd\git.exe"),
  (Join-Path $portableToolsRoot "mingit\cmd\git.exe"),
  "C:\Users\leiss\.cache\codex-runtimes\codex-primary-runtime\dependencies\native\git\cmd\git.exe"
)
$gh = Resolve-FirstExistingPath @(
  $env:GH_CLI_PATH,
  (Join-Path $portableToolsRoot "gh\bin\gh.exe")
)

if (-not $git) { Fail "Git executable was not found. Set GIT_PATH or restore the portable Git tools folder." }
if (-not $gh) { Fail "GitHub CLI was not found. Set GH_CLI_PATH or restore the portable gh tools folder." }

$ghConfigDir = Join-Path $repoRoot ".gh-config-codex"
if (Test-Path -LiteralPath $ghConfigDir) {
  $env:GH_CONFIG_DIR = (Resolve-Path -LiteralPath $ghConfigDir).Path
}
$env:GIT_TERMINAL_PROMPT = "0"

function Get-GhToken($GhPath) {
  $originalConfig = $env:GH_CONFIG_DIR
  $previousErrorActionPreference = $ErrorActionPreference
  $ErrorActionPreference = "Continue"
  try {
    $tokenOutput = & $GhPath auth token --hostname github.com 2>$null
    if ($LASTEXITCODE -eq 0 -and $tokenOutput) {
      return $tokenOutput.Trim()
    }

    if ($originalConfig) {
      Write-Warn "Local GH_CONFIG_DIR did not contain a usable token; falling back to default GitHub CLI auth."
      Remove-Item Env:\GH_CONFIG_DIR -ErrorAction SilentlyContinue
      $tokenOutput = & $GhPath auth token --hostname github.com 2>$null
      if ($LASTEXITCODE -eq 0 -and $tokenOutput) {
        return $tokenOutput.Trim()
      }
      $env:GH_CONFIG_DIR = $originalConfig
    }
  } finally {
    $ErrorActionPreference = $previousErrorActionPreference
  }

  return ""
}

Write-Step "Release context"
$versionFile = Join-Path $repoRoot "src\shared\appConfig.js"
$appVersion = "unknown"
if (Test-Path -LiteralPath $versionFile) {
  $versionText = Get-Content -LiteralPath $versionFile -Raw
  $match = [regex]::Match($versionText, 'APP_VERSION_STAMP\s*=\s*"([^"]+)"')
  if ($match.Success) { $appVersion = $match.Groups[1].Value }
}
Write-Host "Repo: $repoRoot"
Write-Host "Target: $Repo / $Branch"
Write-Host "App version: $appVersion"
Write-Host "Git: $git"
Write-Host "GitHub CLI: $gh"
if ($env:GH_CONFIG_DIR) { Write-Host "GH_CONFIG_DIR: $env:GH_CONFIG_DIR" }

Write-Step "Authentication"
$token = Get-GhToken $gh
if (-not $token) { Fail "GitHub CLI is not authenticated. Run gh auth login or reconnect the GitHub plugin, then try again." }
Write-Pass "GitHub token is available. Secret value will not be printed."

Write-Step "Working tree"
$status = & $git -c "safe.directory=$repoRoot" status --short
if ($status) {
  if (-not $CommitMessage) {
    Write-Host $status
    Fail "Working tree has changes. Re-run with -CommitMessage `"your message`" to commit and publish them."
  }
  Invoke-Checked $git @("-c", "safe.directory=$repoRoot", "add", "-A", "--", ".")
  Invoke-Checked $git @("-c", "safe.directory=$repoRoot", "commit", "-m", $CommitMessage)
} else {
  Write-Pass "No uncommitted changes."
}

if (-not $SkipVerify) {
  Write-Step "Verification"
  $pnpm = Resolve-FirstExistingPath @(
    $env:PNPM_PATH,
    "C:\Users\leiss\.cache\codex-runtimes\codex-primary-runtime\dependencies\bin\fallback\pnpm.cmd",
    "C:\Users\leiss\.cache\codex-runtimes\codex-primary-runtime\dependencies\bin\pnpm.cmd"
  )
  $nodeDir = "C:\Users\leiss\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin"
  if (Test-Path -LiteralPath $nodeDir) {
    $env:PATH = "$nodeDir;$env:PATH"
  }
  if (-not $pnpm) { Fail "pnpm was not found. Set PNPM_PATH or use -SkipVerify only for docs/process-only pushes." }
  Invoke-Checked $pnpm @("run", "verify")
} else {
  Write-Warn "Verification skipped by -SkipVerify."
}

Write-Step "Remote sync"
$remoteUrl = "https://x-access-token:$token@github.com/$Repo.git"
Invoke-Checked $git @("-c", "http.sslBackend=openssl", "-c", "credential.helper=", "-c", "safe.directory=$repoRoot", "fetch", $remoteUrl, "${Branch}:refs/remotes/origin/${Branch}") $token

$localSha = (& $git -c "safe.directory=$repoRoot" rev-parse HEAD).Trim()
$remoteSha = (& $git -c "safe.directory=$repoRoot" rev-parse "refs/remotes/origin/$Branch").Trim()
$mergeBase = (& $git -c "safe.directory=$repoRoot" merge-base HEAD "refs/remotes/origin/$Branch").Trim()

if ($mergeBase -ne $remoteSha) {
  if (-not $AllowBehind) {
    Fail "Local branch is not based on origin/$Branch. Pull/rebase first, or re-run with -AllowBehind only if you intentionally know this push is safe."
  }
  Write-Warn "Local branch is not based on origin/$Branch, but -AllowBehind was provided."
} else {
  Write-Pass "Local branch includes origin/$Branch."
}

Invoke-Checked $git @("-c", "http.sslBackend=openssl", "-c", "credential.helper=", "-c", "safe.directory=$repoRoot", "push", $remoteUrl, "HEAD:$Branch") $token
Invoke-Checked $git @("-c", "safe.directory=$repoRoot", "update-ref", "refs/remotes/origin/$Branch", "HEAD")
$publishedSha = (& $git -c "safe.directory=$repoRoot" rev-parse --short HEAD).Trim()
Write-Pass "Pushed $publishedSha to GitHub. Vercel Git integration should now deploy production."
Write-Pass "Local origin/$Branch now points at the pushed commit."

if (-not $SkipVercelWait) {
  Write-Step "Live version check"
  if ($appVersion -eq "unknown") {
    Write-Warn "No app version found; skipping live bundle version polling."
  } else {
    $liveUrl = "https://project-d8v25.vercel.app"
    $deadline = (Get-Date).AddMinutes(12)
    $found = $false
    while ((Get-Date) -lt $deadline) {
      try {
        $html = Invoke-WebRequest -Uri $liveUrl -UseBasicParsing -TimeoutSec 20
        $scripts = [regex]::Matches($html.Content, 'src="([^"]+\.js)"') | ForEach-Object {
          $path = $_.Groups[1].Value
          if ($path.StartsWith("http")) { $path } else { "$liveUrl$path" }
        }
        foreach ($script in $scripts) {
          $bundle = Invoke-WebRequest -Uri $script -UseBasicParsing -TimeoutSec 30
          if ($bundle.Content -like "*$appVersion*") {
            $found = $true
            break
          }
        }
      } catch {
        Write-Warn "Live check waiting: $($_.Exception.Message)"
      }
      if ($found) { break }
      Start-Sleep -Seconds 15
    }
    if ($found) {
      Write-Pass "Live bundle contains $appVersion."
    } else {
      Write-Warn "Timed out waiting for live bundle to show $appVersion. Check Vercel dashboard for deployment status."
    }
  }
} else {
  Write-Warn "Vercel/live polling skipped by -SkipVercelWait."
}

Write-Host ""
Write-Host "Publish complete." -ForegroundColor Green
Write-Host "Live URL: https://project-d8v25.vercel.app"
Write-Host "GitHub: https://github.com/$Repo"
Write-Host "Vercel: https://vercel.com/tylerl-s-projects/project-d8v25"
