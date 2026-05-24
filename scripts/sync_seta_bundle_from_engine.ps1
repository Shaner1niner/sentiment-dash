param(
  [string]$EngineRepo = "C:\SETA_engine\SETA_engine_git_initialized_for_push\SETA_engine",
  [string]$DashRepo = "C:\Users\shane\sentiment-dash",
  [string]$LatestDate = (Get-Date -Format "yyyy-MM-dd"),
  [switch]$Commit
)

$ErrorActionPreference = "Stop"

function Run-Step($Name, [scriptblock]$Block) {
  Write-Host ""
  Write-Host "==> $Name"
  & $Block
  if ($LASTEXITCODE -ne 0) {
    throw "$Name failed with exit code $LASTEXITCODE"
  }
}

Write-Host "=== SETA bundle website sync ==="
Write-Host "EngineRepo: $EngineRepo"
Write-Host "DashRepo:   $DashRepo"
Write-Host "LatestDate: $LatestDate"
Write-Host "Commit:     $Commit"

Run-Step "Build SETA bundle" {
  cd $EngineRepo
  python scripts\build_dashboard_seta_bundle_package.py `
    --source-dir . `
    --output-dir outputs\dashboard_seta_bundle\latest `
    --latest-date $LatestDate `
    --clean
}

if (!(Test-Path "$EngineRepo\outputs\dashboard_seta_bundle\latest\manifest.json")) {
  throw "Engine bundle manifest was not created."
}

Run-Step "Copy bundle into sentiment-dash" {
  cd $DashRepo

  Remove-Item -Recurse -Force "$DashRepo\seta_bundles\latest" -ErrorAction SilentlyContinue
  New-Item -ItemType Directory -Force "$DashRepo\seta_bundles\latest" | Out-Null

  Copy-Item "$EngineRepo\outputs\dashboard_seta_bundle\latest\*" `
    "$DashRepo\seta_bundles\latest\" `
    -Recurse -Force
}

Run-Step "Smoke bundle manifest" {
  cd $DashRepo
  python scripts\smoke_seta_bundle_manifest.py --manifest seta_bundles/latest/manifest.json
}

Run-Step "Smoke bundle loader" {
  cd $DashRepo
  python scripts\smoke_seta_bundle_loader.py
}

if (Test-Path "$DashRepo\scripts\smoke_seta_bundle_mini_panel.py") {
  Run-Step "Smoke mini panel" {
    cd $DashRepo
    python scripts\smoke_seta_bundle_mini_panel.py
  }
}

if (Test-Path "$DashRepo\scripts\smoke_seta_bundle_compare_panel.py") {
  Run-Step "Smoke comparison panel" {
    cd $DashRepo
    python scripts\smoke_seta_bundle_compare_panel.py
  }
}

if (Test-Path "$DashRepo\scripts\smoke_seta_bundle_comparison_data.py") {
  Run-Step "Smoke comparison data" {
    cd $DashRepo
    python scripts\smoke_seta_bundle_comparison_data.py
  }
}

Run-Step "Smoke Fix26 dashboard" {
  cd $DashRepo
  python scripts\smoke_fix26_dashboard.py
}

cd $DashRepo

if ($Commit) {
  $branch = git branch --show-current
  if ($branch -eq "main") {
    throw "Refusing to commit on main. Switch to a feature branch first."
  }

  git add -f seta_bundles\latest
  git add scripts\sync_seta_bundle_from_engine.ps1

  $staged = git diff --cached --name-only
  if ([string]::IsNullOrWhiteSpace($staged)) {
    Write-Host "[OK] No SETA bundle changes to commit."
    exit 0
  }

  $stamp = Get-Date -Format "yyyy-MM-dd HH:mm"
  git commit -m "Refresh SETA dashboard bundle $stamp"
  git push
}

Write-Host ""
Write-Host "[OK] SETA bundle refreshed and validated."
