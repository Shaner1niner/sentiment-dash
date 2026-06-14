param(
  [string]$SetaEngineRoot = $env:SETA_ENGINE_ROOT,
  [string]$DashRoot = (Get-Location).Path,
  [string]$SourcePayload = "",
  [string]$OutputRelativePath = "seta_bundles\latest\evidence\dashboard_evidence_payload.json",
  [switch]$ValidateOnly,
  [switch]$DryRun,
  [switch]$Stage
)

$ErrorActionPreference = "Stop"

function Resolve-FullPath([string]$PathValue, [string]$BasePath) {
  if ([string]::IsNullOrWhiteSpace($PathValue)) {
    return ""
  }
  if ([System.IO.Path]::IsPathRooted($PathValue)) {
    return [System.IO.Path]::GetFullPath($PathValue)
  }
  return [System.IO.Path]::GetFullPath((Join-Path $BasePath $PathValue))
}

$DashRoot = [System.IO.Path]::GetFullPath($DashRoot)

if ([string]::IsNullOrWhiteSpace($SourcePayload)) {
  if ([string]::IsNullOrWhiteSpace($SetaEngineRoot)) {
    throw "SetaEngineRoot is required when SourcePayload is not provided."
  }
  $SetaEngineRoot = [System.IO.Path]::GetFullPath($SetaEngineRoot)
  $SourcePayload = Join-Path $SetaEngineRoot "outputs\evidence\handoff\dashboard_evidence_payload.json"
} else {
  $SourcePayload = Resolve-FullPath $SourcePayload $DashRoot
}

$DestinationPayload = Resolve-FullPath $OutputRelativePath $DashRoot
$DestinationDir = Split-Path $DestinationPayload -Parent
$Validator = Join-Path $DashRoot "scripts\check_evidence_handoff_payload.py"

Write-Host "SETA evidence handoff publish"
Write-Host "source=$SourcePayload"
Write-Host "destination=$DestinationPayload"
Write-Host "validator=$Validator"

if (-not (Test-Path $SourcePayload)) {
  throw "Source payload not found: $SourcePayload. Run the SETA_engine evidence handoff build first."
}

if (-not (Test-Path $Validator)) {
  throw "Payload validator not found: $Validator. Pull sentiment-dash main after PR #4 first."
}

if ($ValidateOnly) {
  Write-Host "[INFO] ValidateOnly enabled; validating source payload without copying."
  & python $Validator --payload $SourcePayload
  if ($LASTEXITCODE -ne 0) { throw "Payload validation failed for source payload." }
  Write-Host "[OK] source payload valid"
  exit 0
}

if ($DryRun) {
  Write-Host "[DRYRUN] would create directory: $DestinationDir"
  Write-Host "[DRYRUN] would copy payload to destination"
  Write-Host "[DRYRUN] validating source payload instead"
  & python $Validator --payload $SourcePayload
  if ($LASTEXITCODE -ne 0) { throw "Payload validation failed for source payload." }
  Write-Host "[OK] dry run completed"
  exit 0
}

Write-Host "[PRE-COPY] validating source payload"
& python $Validator --payload $SourcePayload
if ($LASTEXITCODE -ne 0) { throw "Payload validation failed for source payload; refusing to copy stale or unsafe Evidence Handoff payload." }
Write-Host "[OK] source payload valid"

New-Item -ItemType Directory -Force -Path $DestinationDir | Out-Null
Copy-Item -Path $SourcePayload -Destination $DestinationPayload -Force
Write-Host "[OK] copied evidence handoff payload"

& python $Validator --payload $DestinationPayload
if ($LASTEXITCODE -ne 0) { throw "Payload validation failed for copied payload." }
Write-Host "[OK] copied payload validated"

if ($Stage) {
  $gitPath = $OutputRelativePath -replace "\\", "/"
  & git -C $DashRoot add -f -- $gitPath
  if ($LASTEXITCODE -ne 0) { throw "git add -f failed for $gitPath" }
  Write-Host "[OK] staged generated payload: $gitPath"
}

Write-Host "[OK] evidence handoff publish completed"
