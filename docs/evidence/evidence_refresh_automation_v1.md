# Evidence Refresh Automation v1

This document explains how to wire the SETA_engine Evidence Handoff payload into the `sentiment-dash` scheduled website refresh flow.

## Purpose

The homepage Evidence Card now reads:

```text
seta_bundles/latest/evidence/dashboard_evidence_payload.json
```

The payload should be refreshed from SETA_engine whenever the website/dashboard bundle is refreshed.

## Existing pieces

Already merged in `sentiment-dash`:

- `scripts/check_evidence_handoff_payload.py`
- `scripts/publish_seta_evidence_handoff_to_bundle.ps1`
- `src/evidence_handoff_reader.js`
- `src/evidence_card_ui.js`
- `seta_bundles/latest/evidence/dashboard_evidence_payload.json`

This automation layer adds:

```text
scripts/run_seta_refresh_with_evidence_handoff.ps1
```

## Recommended scheduling pattern

Use the wrapper as the scheduled-task entrypoint, or call it from the existing scheduled refresh script.

If the existing scheduled job already runs the dashboard refresh and then commits/pushes artifacts, insert this evidence step before the commit/push step.

Example when the dashboard refresh command is a batch file:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\run_seta_refresh_with_evidence_handoff.ps1 `
  -DashRoot "C:\Users\shane\sentiment-dash" `
  -SetaEngineRoot "C:\SETA_engine\SETA_engine_git_initialized_for_push\SETA_engine" `
  -RefreshCommand ".\refresh_fix26_dashboard_all.bat" `
  -Stage
```

Example when the dashboard refresh has already run and only the evidence handoff should be published:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\run_seta_refresh_with_evidence_handoff.ps1 `
  -DashRoot "C:\Users\shane\sentiment-dash" `
  -SetaEngineRoot "C:\SETA_engine\SETA_engine_git_initialized_for_push\SETA_engine" `
  -SkipRefreshCommand `
  -Stage
```

## What the wrapper does

1. Optionally runs the existing dashboard refresh command.
2. Calls `scripts/publish_seta_evidence_handoff_to_bundle.ps1`.
3. Copies the SETA_engine payload from:

```text
outputs/evidence/handoff/dashboard_evidence_payload.json
```

into:

```text
seta_bundles/latest/evidence/dashboard_evidence_payload.json
```

4. Validates the copied payload with `scripts/check_evidence_handoff_payload.py`.
5. Optionally stages the generated payload with `git add -f` through the existing publish helper.
6. Optionally commits and pushes **only** the generated evidence payload when `-CommitEvidencePayload` and `-Push` are explicitly provided.

## Safety behavior

The refresh should fail clearly if:

- the SETA_engine root is missing
- the publish helper is missing
- the upstream evidence payload is missing
- the copied payload fails validation
- the safety note is not present
- `-Push` is provided without `-CommitEvidencePayload`
- unrelated files are already staged when commit mode is enabled
- push is requested from a detached HEAD

The required safety note remains:

> Historical diagnostic only; not a trade signal, recommendation, or price forecast.

## Commit policy

The wrapper does **not** commit or push by default.

This is intentional. The default mode is safe for manual validation and for refresh flows that already manage their own commit/push behavior.

For unattended publishing of only the Evidence Handoff payload, use:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\run_seta_refresh_with_evidence_handoff.ps1 `
  -DashRoot "C:\Users\shane\sentiment-dash" `
  -SetaEngineRoot "C:\SETA_engine\SETA_engine_git_initialized_for_push\SETA_engine" `
  -RefreshCommand 'cmd.exe /c "C:\Users\shane\Projects\SETA_Prediction_Intelligence_Engine\scripts\run_public_card_site_publish_scheduled.bat"' `
  -CommitEvidencePayload `
  -Push
```

`-CommitEvidencePayload` implies staging the payload. Before committing, the wrapper checks the staged file list and refuses to continue if anything other than this file is staged:

```text
seta_bundles/latest/evidence/dashboard_evidence_payload.json
```

If the payload has not changed, the wrapper skips the commit and push.

## Manual validation

After running the wrapper, validate locally:

```powershell
python scripts\check_evidence_handoff_payload.py `
  --payload seta_bundles\latest\evidence\dashboard_evidence_payload.json

python -m pytest tests\test_evidence_handoff_payload.py
python -m pytest tests\test_evidence_card_ui.py
python -m pytest tests\test_evidence_card_ui_polish.py
python -m pytest tests\test_evidence_payload_publish.py
python -m pytest tests\test_evidence_refresh_automation.py
```
