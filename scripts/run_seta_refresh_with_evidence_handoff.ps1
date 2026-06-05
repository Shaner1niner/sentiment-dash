<#
.SYNOPSIS
Runs the sentiment-dash refresh flow with an optional SETA_engine Evidence Handoff publish step.

.DESCRIPTION
This wrapper is intended for Windows Task Scheduler / local refresh automation.

It can run an existing dashboard refresh command, repair protected Evidence Handoff
mounts after generated HTML is produced, publish the generated SETA_engine Evidence
Handoff payload into sentiment-dash, validate Evidence health, report refresh
integrity, and optionally commit/push the evidence-managed files.

The publish helper is:

scripts/publish_seta_evidence_handoff_to_bundle.ps1

The script intentionally does not commit or push by default. Use -Stage to stage
the generated evidence-managed files so an existing publish job can include them in
its normal commit/push step.

For fully unattended website refreshes, use -CommitEvidencePayload to commit only
the generated Evidence Handoff managed files if they changed. Use -Push with
-CommitEvidencePayload to push that commit.

When commit/push mode starts on main or master, the wrapper routes the generated
Evidence Handoff commit to -AutomationCommitBranch before committing. This keeps
local pre-commit branch guards intact and avoids direct commits to protected
source branches.

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
[string]$AutomationCommitBranch = "auto/evidence-refresh-state",
[switch]$WhatIf
)

$ErrorActionPreference = "Stop"

$PayloadRelPath = "seta_bundles/latest/evidence/dashboard_evidence_payload.json"
$HealthStatusRelPath = "seta_bundles/latest/evidence/evidence_refresh_status.json"
$EvidenceMountRelPaths = @(
"index.html",
"interactive_dashboard_fix24_public_embed.html"
)
$EvidenceManagedRelPaths = @($PayloadRelPath, $HealthStatusRelPath) + $EvidenceMountRelPaths
$ProtectedDirectCommitBranches = @("main", "master")

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
[string[]]$GitArgs,
[string]$Label
)

Write-Step "git $($GitArgs -join ' ')"

if ($WhatIf) {
Write-Step "WHATIF: would run git command for $Label."
return @()
}

$stdoutPath = [System.IO.Path]::GetTempFileName()
$stderrPath = [System.IO.Path]::GetTempFileName()
$previousErrorActionPreference = $ErrorActionPreference

try {
$ErrorActionPreference = "Continue"
& git @GitArgs 1> $stdoutPath 2> $stderrPath
$exitCode = $LASTEXITCODE

$stdout = @(Get-Content -Path $stdoutPath -ErrorAction SilentlyContinue)
$stderr = @(Get-Content -Path $stderrPath -ErrorAction SilentlyContinue)

}
finally {
$ErrorActionPreference = $previousErrorActionPreference
Remove-Item -Path $stdoutPath, $stderrPath -Force -ErrorAction SilentlyContinue
}

if ($stdout) {
$stdout | ForEach-Object { Write-Host $_ }
}

if ($stderr) {
$stderr | ForEach-Object { Write-Host $_ }
}

if ($exitCode -ne 0) {
throw "$Label failed with exit code $exitCode"
}

return @($stdout + $stderr)
}

function Get-GitOutputChecked {
param(
[string[]]$GitArgs,
[string]$Label
)

if ($WhatIf) {
Write-Step "WHATIF: would inspect git state for $Label."
return @()
}

$stdoutPath = [System.IO.Path]::GetTempFileName()
$stderrPath = [System.IO.Path]::GetTempFileName()
$previousErrorActionPreference = $ErrorActionPreference

try {
$ErrorActionPreference = "Continue"
& git @GitArgs 1> $stdoutPath 2> $stderrPath
$exitCode = $LASTEXITCODE

$stdout = @(Get-Content -Path $stdoutPath -ErrorAction SilentlyContinue)
$stderr = @(Get-Content -Path $stderrPath -ErrorAction SilentlyContinue)

}
finally {
$ErrorActionPreference = $previousErrorActionPreference
Remove-Item -Path $stdoutPath, $stderrPath -Force -ErrorAction SilentlyContinue
}

if ($exitCode -ne 0) {
if ($stdout) {
$stdout | ForEach-Object { Write-Host $_ }
}

if ($stderr) {
  $stderr | ForEach-Object { Write-Host $_ }
}

throw "$Label failed with exit code $exitCode"

}

if ($stderr) {
$stderr | ForEach-Object { Write-Host $_ }
}

return @($stdout)
}

function Get-CurrentGitBranch {
$branchName = (Get-GitOutputChecked -GitArgs @("rev-parse", "--abbrev-ref", "HEAD") -Label "inspect current branch" | Select-Object -First 1)

if ([string]::IsNullOrWhiteSpace($branchName)) {
throw "Unable to determine current Git branch."
}

return $branchName.Trim()
}

function Assert-AutomationCommitBranchIsSafe {
if ([string]::IsNullOrWhiteSpace($AutomationCommitBranch)) {
throw "AutomationCommitBranch cannot be blank when -CommitEvidencePayload is used."
}

$trimmedAutomationBranch = $AutomationCommitBranch.Trim()

if ($ProtectedDirectCommitBranches -contains $trimmedAutomationBranch) {
throw "AutomationCommitBranch must not be a protected direct-commit branch: $trimmedAutomationBranch"
}
}

function Switch-ToAutomationCommitBranchIfNeeded {
param([string]$SourceBranch)

if ($SourceBranch -eq "HEAD") {
throw "Refusing to commit from detached HEAD. Check out the intended branch first."
}

if ($ProtectedDirectCommitBranches -notcontains $SourceBranch) {
Write-Step "current branch is '$SourceBranch'; generated Evidence commit will use the current branch."
return $false
}

Assert-AutomationCommitBranchIsSafe

$targetBranch = $AutomationCommitBranch.Trim()
Write-Step "current branch is '$SourceBranch'; routing generated Evidence commit to '$targetBranch'."
Invoke-GitChecked -GitArgs @("switch", "-C", $targetBranch) -Label "switch to automation evidence commit branch" | Out-Null

return $true
}

function Return-ToSourceBranchIfNeeded {
param(
[string]$SourceBranch,
[bool]$SwitchedToAutomationBranch
)

if (-not $SwitchedToAutomationBranch) {
return
}

$currentBranch = Get-CurrentGitBranch

if ($currentBranch -eq $SourceBranch) {
return
}

Write-Step "returning to source branch after generated Evidence commit: $SourceBranch"
Invoke-GitChecked -GitArgs @("switch", $SourceBranch) -Label "return to source branch" | Out-Null
}

function Assert-CleanEvidenceStagingScope {
$stagedFiles = @(Get-GitOutputChecked -GitArgs @("--no-pager", "diff", "--cached", "--name-only") -Label "inspect staged files")
$stagedFiles = @($stagedFiles | Where-Object { -not [string]::IsNullOrWhiteSpace($_) })

$unexpected = @($stagedFiles | Where-Object { $EvidenceManagedRelPaths -notcontains $_ })

if ($unexpected.Count -gt 0) {
$formatted = ($unexpected -join ", ")
throw "Refusing to commit because unrelated staged files are present: $formatted"
}
}

function Test-StagedEvidenceManagedFilesChanged {
if ($WhatIf) {
Write-Step "WHATIF: would check whether evidence managed files have staged changes."
return $true
}

$diffArgs = @("--no-pager", "diff", "--cached", "--quiet", "--") + $EvidenceManagedRelPaths
& git @diffArgs
$exitCode = $LASTEXITCODE

if ($exitCode -eq 0) {
return $false
}

if ($exitCode -eq 1) {
return $true
}

throw "Failed to inspect staged evidence managed-file diff with exit code $exitCode"
}

function Invoke-EvidencePayloadCommitPublish {
if ($Push -and -not $CommitEvidencePayload) {
throw "-Push requires -CommitEvidencePayload so push behavior cannot run without a controlled evidence commit."
}

if (-not $CommitEvidencePayload) {
return
}

if ([string]::IsNullOrWhiteSpace($CommitMessage)) {
throw "CommitMessage cannot be blank when -CommitEvidencePayload is used."
}

Write-Step "commit/push mode enabled for Evidence Handoff managed files."

$sourceBranch = Get-CurrentGitBranch
$switchedToAutomationBranch = Switch-ToAutomationCommitBranchIfNeeded -SourceBranch $sourceBranch

Write-Step "staging evidence managed files for controlled commit."
Invoke-GitChecked -GitArgs (@("add", "-f", "--") + $EvidenceManagedRelPaths) -Label "stage evidence managed files" | Out-Null

Assert-CleanEvidenceStagingScope

$hasManagedDiff = Test-StagedEvidenceManagedFilesChanged

if (-not $hasManagedDiff) {
Write-Step "no staged evidence managed-file changes; skipping commit and push."
Return-ToSourceBranchIfNeeded -SourceBranch $sourceBranch -SwitchedToAutomationBranch $switchedToAutomationBranch
return
}

Invoke-GitChecked -GitArgs @("commit", "-m", $CommitMessage) -Label "commit evidence payload" | Out-Null

$commitBranchName = Get-CurrentGitBranch

if ($Push) {
if ($commitBranchName -eq $AutomationCommitBranch.Trim()) {
Write-Step "pushing generated Evidence commit branch: $commitBranchName"
Invoke-GitChecked -GitArgs @("push", "-u", "origin", $commitBranchName) -Label "push evidence payload commit branch" | Out-Null
} else {
Write-Step "pushing evidence payload commit from branch: $commitBranchName"
Invoke-GitChecked -GitArgs @("push") -Label "push evidence payload commit" | Out-Null
}
} else {
Write-Step "evidence payload committed locally; push skipped because -Push was not provided."
}

Return-ToSourceBranchIfNeeded -SourceBranch $sourceBranch -SwitchedToAutomationBranch $switchedToAutomationBranch
}

$DashRoot = Resolve-RequiredPath -Path $DashRoot -Label "sentiment-dash root"
$SetaEngineRoot = Resolve-RequiredPath -Path $SetaEngineRoot -Label "SETA_engine root"

$PublishHelper = Join-Path $DashRoot "scripts\publish_seta_evidence_handoff_to_bundle.ps1"
$Validator = Join-Path $DashRoot "scripts\check_evidence_handoff_payload.py"
$BundlePayload = Join-Path $DashRoot "seta_bundles\latest\evidence\dashboard_evidence_payload.json"
$MountRepairHelper = Join-Path $DashRoot "scripts\ensure_evidence_mounts.py"
$HealthCheckHelper = Join-Path $DashRoot "scripts\check_evidence_refresh_health.py"
$RefreshIntegrityHelper = Join-Path $DashRoot "scripts\check_refresh_integrity.py"

Resolve-RequiredPath -Path $PublishHelper -Label "evidence publish helper" | Out-Null
Resolve-RequiredPath -Path $Validator -Label "evidence payload validator" | Out-Null
Resolve-RequiredPath -Path $MountRepairHelper -Label "evidence mount repair helper" | Out-Null
Resolve-RequiredPath -Path $HealthCheckHelper -Label "evidence refresh health helper" | Out-Null
Resolve-RequiredPath -Path $RefreshIntegrityHelper -Label "refresh integrity helper" | Out-Null

Push-Location $DashRoot

try {
Write-Step "dashboard root: $DashRoot"
Write-Step "SETA_engine root: $SetaEngineRoot"

if ($SkipRefreshCommand) {
Write-Step "dashboard refresh command skipped by -SkipRefreshCommand."
} else {
Invoke-CheckedCommand -Command $RefreshCommand -Label "dashboard refresh"
}

if ($WhatIf) {
Write-Step "WHATIF: would repair Evidence Card mounts."
} else {
Write-Step "repairing Evidence Card mounts after dashboard refresh"
& python $MountRepairHelper --root $DashRoot

if ($LASTEXITCODE -ne $null -and $LASTEXITCODE -ne 0) {
  throw "Evidence Card mount repair failed with exit code $LASTEXITCODE"
}

}

if ($WhatIf) {
Write-Step "WHATIF: would run strict Evidence Handoff refresh health check after mount repair."
} else {
Write-Step "validating Evidence Handoff refresh health after mount repair"
& python $HealthCheckHelper --root $DashRoot --no-write

if ($LASTEXITCODE -ne $null -and $LASTEXITCODE -ne 0) {
  throw "Evidence Handoff refresh health check failed after mount repair with exit code $LASTEXITCODE"
}

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

if ($WhatIf) {
Write-Step "WHATIF: would write Evidence Handoff refresh health status."
} else {
Write-Step "writing Evidence Handoff refresh health status"
& python $HealthCheckHelper --root $DashRoot

if ($LASTEXITCODE -ne $null -and $LASTEXITCODE -ne 0) {
  throw "Evidence Handoff refresh health check failed with exit code $LASTEXITCODE"
}

}

if ($WhatIf) {
Write-Step "WHATIF: would run strict Evidence Handoff refresh health check after status write."
} else {
Write-Step "validating Evidence Handoff refresh health after status write"
& python $HealthCheckHelper --root $DashRoot --no-write

if ($LASTEXITCODE -ne $null -and $LASTEXITCODE -ne 0) {
  throw "Evidence Handoff refresh health check failed after status write with exit code $LASTEXITCODE"
}

}

if ($WhatIf) {
Write-Step "WHATIF: would run refresh integrity report after Evidence repair."
} else {
Write-Step "running refresh integrity report after Evidence repair"
& python $RefreshIntegrityHelper --root $DashRoot --report-only

if ($LASTEXITCODE -ne $null -and $LASTEXITCODE -ne 0) {
  throw "Refresh integrity report failed with exit code $LASTEXITCODE"
}

}

if ($Stage -or $CommitEvidencePayload) {
Write-Step "staged evidence payload status:"
$statusArgs = @("--no-pager", "diff", "--cached", "--name-status", "--") + $EvidenceManagedRelPaths
git @statusArgs
} else {
Write-Step "working tree evidence payload status:"
$statusArgs = @("status", "--short", "--") + $EvidenceManagedRelPaths
git @statusArgs
}

Invoke-EvidencePayloadCommitPublish

Write-Step "refresh with evidence handoff completed."
}
finally {
Pop-Location
}
