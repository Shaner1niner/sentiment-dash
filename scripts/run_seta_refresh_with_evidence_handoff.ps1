<#
.SYNOPSIS
Runs the sentiment-dash refresh flow with an optional SETA_engine Evidence Handoff publish step.

.DESCRIPTION
This wrapper is intended for Windows Task Scheduler / local refresh automation.
It can run an existing dashboard refresh command, then publish the generated
SETA_engine Evidence Handoff payload into sentiment-dash via the already-merged
publish helper:

  scripts/publish_seta_evidence_handoff_to_bundle.ps1

The script intentionally does not commit or push by default. Use -Stage to stage
the generated evidence payload so an existing publish job can include it in its
normal commit/push step.
#>
[CmdletBinding()]
param(
  [string]$DashRoot = "C:\Users\shane\sentiment-dash",
  [string]$SetaEngineRoot = "C:\SETA_engine\SETA_engine_git_initialized_for_push\SETA_engine",
  [string]$RefreshCommand = "",
  [switch]$SkipRefreshCommand,
  [switch]$Stage,
  [switch]$WhatIf
)

$ErrorActionPreference = "Stop"

function Write-Step {
  param([string]$Message)
  Write-Host "[SETA refresh] $Message"
}

function Resolve-RequiredPath {
  param(
    [string]$Path,
    [string]$Label
  )
  if (-not (Test-Path $Path)) {
    throw "$Label not found: $Path"
  }
  return (Resolve-Path $Path).Path
}

function Invoke-CheckedCommand {
  param(
    [string]$Command,
    [string]$Label
  )
  if ([string]::IsNullOrWhiteSpace($Command)) {
    Write-Step "$Label skipped because no command was provided."
    return
  }
  Write-Step "$Label command: $Command"
  if ($WhatIf) {
    Write-Step "WHATIF: would run $Label command."
    return
  }
  Invoke-Expression $Command
  if ($LASTEXITCODE -ne $null -and $LASTEXITCODE -ne 0) {
    throw "$Label command failed with exit code $LASTEXITCODE"
  }
}

$DashRoot = Resolve-RequiredPath -Path $DashRoot -Label "sentiment-dash root"
$SetaEngineRoot = Resolve-RequiredPath -Path $SetaEngineRoot -Label "SETA_engine root"
$PublishHelper = Join-Path $DashRoot "scripts\publish_seta_evidence_handoff_to_bundle.ps1"
$Validator = Join-Path $DashRoot "scripts\check_evidence_handoff_payload.py"
$BundlePayload = Join-Path $DashRoot "seta_bundles\latest\evidence\dashboard_evidence_payload.json"

Resolve-RequiredPath -Path $PublishHelper -Label "evidence publish helper" | Out-Null
Resolve-RequiredPath -Path $Validator -Label "evidence payload validator" | Out-Null

Push-Location $DashRoot
try {
  Write-Step "dashboard root: $DashRoot"
  Write-Step "SETA_engine root: $SetaEngineRoot"

  if ($SkipRefreshCommand) {
    Write-Step "dashboard refresh command skipped by -SkipRefreshCommand."
  } else {
    Invoke-CheckedCommand -Command $RefreshCommand -Label "dashboard refresh"
  }

  $publishArgs = @(
    "-ExecutionPolicy", "Bypass",
    "-File", $PublishHelper,
    "-SetaEngineRoot", $SetaEngineRoot,
    "-DashRoot", $DashRoot
  )
  if ($Stage) {
    $publishArgs += "-Stage"
  }

  Write-Step "publishing Evidence Handoff payload"
  Write-Step "source: $(Join-Path $SetaEngineRoot 'outputs\evidence\handoff\dashboard_evidence_payload.json')"
  Write-Step "destination: $BundlePayload"

  if ($WhatIf) {
    Write-Step "WHATIF: would run publish helper."
  } else {
    & powershell @publishArgs
    if ($LASTEXITCODE -ne $null -and $LASTEXITCODE -ne 0) {
      throw "Evidence Handoff publish helper failed with exit code $LASTEXITCODE"
    }
  }

  if ($WhatIf) {
    Write-Step "WHATIF: would validate bundle payload."
  } else {
    & python $Validator --payload $BundlePayload
    if ($LASTEXITCODE -ne $null -and $LASTEXITCODE -ne 0) {
      throw "Evidence Handoff payload validation failed with exit code $LASTEXITCODE"
    }
  }

  if ($Stage) {
    Write-Step "staged evidence payload status:"
    git --no-pager diff --cached --name-status -- seta_bundles/latest/evidence/dashboard_evidence_payload.json
  } else {
    Write-Step "working tree evidence payload status:"
    git status --short -- seta_bundles/latest/evidence/dashboard_evidence_payload.json
  }

  Write-Step "refresh with evidence handoff completed."
}
finally {
  Pop-Location
}
