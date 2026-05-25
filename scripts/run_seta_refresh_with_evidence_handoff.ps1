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

For fully unattended website refreshes, use -CommitEvidencePayload to commit only
the generated Evidence Handoff payload if it changed. Use -Push with
-CommitEvidencePayload to push that commit to the branch's configured upstream.
The commit/push mode refuses to continue if unrelated files are already staged.
#>
[CmdletBinding()]
param(
  [string]$DashRoot = "C:\Users\shane\sentiment-dash",
  [string]$SetaEngineRoot = "C:\SETA_engine\SETA_engine_git_initialized_for_push\SETA_engine",
  [string]$RefreshCommand = "",
  [switch]$SkipRefreshCommand,
  [switch]$Stage,
  [switch]$CommitEvidencePayload,
  [switch]$Push,
  [string]$CommitMessage = "Refresh SETA evidence handoff payload",
  [switch]$WhatIf
)

$ErrorActionPreference = "Stop"
$PayloadRelPath = "seta_bundles/latest/evidence/dashboard_evidence_payload.json"

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

function Invoke-GitChecked {
  param(
    [string[]]$Args,
    [string]$Label
  )
  Write-Step "git $($Args -join ' ')"
  if ($WhatIf) {
    Write-Step "WHATIF: would run git command for $Label."
    return @()
  }
  $output = & git @Args 2>&1
  $exitCode = $LASTEXITCODE
  if ($output) {
    $output | ForEach-Object { Write-Host $_ }
  }
  if ($exitCode -ne 0) {
    throw "$Label failed with exit code $exitCode"
  }
  return @($output)
}

function Get-GitOutputChecked {
  param(
    [string[]]$Args,
    [string]$Label
  )
  if ($WhatIf) {
    Write-Step "WHATIF: would inspect git state for $Label."
    return @()
  }
  $output = & git @Args 2>&1
  $exitCode = $LASTEXITCODE
  if ($exitCode -ne 0) {
    if ($output) {
      $output | ForEach-Object { Write-Host $_ }
    }
    throw "$Label failed with exit code $exitCode"
  }
  return @($output)
}

function Assert-CleanEvidenceStagingScope {
  $stagedFiles = @(Get-GitOutputChecked -Args @("--no-pager", "diff", "--cached", "--name-only") -Label "inspect staged files")
  $stagedFiles = @($stagedFiles | Where-Object { -not [string]::IsNullOrWhiteSpace($_) })
  $unexpected = @($stagedFiles | Where-Object { $_ -ne $PayloadRelPath })
  if ($unexpected.Count -gt 0) {
    $formatted = ($unexpected -join ", ")
    throw "Refusing to commit because unrelated staged files are present: $formatted"
  }
}

function Test-StagedEvidencePayloadChanged {
  if ($WhatIf) {
    Write-Step "WHATIF: would check whether evidence payload has staged changes."
    return $true
  }
  & git --no-pager diff --cached --quiet -- $PayloadRelPath
  $exitCode = $LASTEXITCODE
  if ($exitCode -eq 0) {
    return $false
  }
  if ($exitCode -eq 1) {
    return $true
  }
  throw "Failed to inspect staged evidence payload diff with exit code $exitCode"
}

function Invoke-EvidencePayloadCommitPublish {
  if ($Push -and -not $CommitEvidencePayload) {
    throw "-Push requires -CommitEvidencePayload so push behavior cannot run without a controlled evidence commit."
  }

  if (-not $CommitEvidencePayload) {
    return
  }

  Write-Step "commit/push mode enabled for Evidence Handoff payload only."

  if (-not $Stage) {
    Write-Step "staging evidence payload because -CommitEvidencePayload was provided."
    Invoke-GitChecked -Args @("add", "-f", "--", $PayloadRelPath) -Label "stage evidence payload" | Out-Null
  }

  Assert-CleanEvidenceStagingScope

  $hasPayloadDiff = Test-StagedEvidencePayloadChanged
  if (-not $hasPayloadDiff) {
    Write-Step "no staged evidence payload changes; skipping commit and push."
    return
  }

  if ([string]::IsNullOrWhiteSpace($CommitMessage)) {
    throw "CommitMessage cannot be blank when -CommitEvidencePayload is used."
  }

  Invoke-GitChecked -Args @("commit", "-m", $CommitMessage) -Label "commit evidence payload" | Out-Null

  if ($Push) {
    $branchName = (Get-GitOutputChecked -Args @("rev-parse", "--abbrev-ref", "HEAD") -Label "inspect current branch" | Select-Object -First 1)
    if ($branchName -eq "HEAD") {
      throw "Refusing to push from detached HEAD. Check out the intended branch first."
    }
    Write-Step "pushing evidence payload commit from branch: $branchName"
    Invoke-GitChecked -Args @("push") -Label "push evidence payload commit" | Out-Null
  } else {
    Write-Step "evidence payload committed locally; push skipped because -Push was not provided."
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
  if ($Stage -or $CommitEvidencePayload) {
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

  if ($Stage -or $CommitEvidencePayload) {
    Write-Step "staged evidence payload status:"
    git --no-pager diff --cached --name-status -- $PayloadRelPath
  } else {
    Write-Step "working tree evidence payload status:"
    git status --short -- $PayloadRelPath
  }

  Invoke-EvidencePayloadCommitPublish

  Write-Step "refresh with evidence handoff completed."
}
finally {
  Pop-Location
}
