# Evidence Payload Publish v1

This document describes the first publish bridge from `SETA_engine` Evidence Handoff v1 into `sentiment-dash`.

## Purpose

`sentiment-dash` now has a homepage Evidence Card UI shell. That shell remains hidden unless this generated payload exists and validates:

```text
seta_bundles/latest/evidence/dashboard_evidence_payload.json
```

This publish step copies the generated payload from `SETA_engine` into the dashboard bundle landing zone, validates it with the existing sentiment-dash payload checker, and optionally stages the generated file for a website refresh commit.

## Source

The expected upstream source file is:

```text
<SETA_engine>/outputs/evidence/handoff/dashboard_evidence_payload.json
```

Generate it from `SETA_engine` with the evidence chain:

```powershell
python scripts\build_archetype_evidence_report.py `
  --input final_combined_data.csv `
  --output-dir outputs\evidence `
  --archetypes attention_validation,sentiment_repair,divergence

python scripts\build_evidence_cards.py `
  --summary-json outputs\evidence\archetype_evidence_summary.json `
  --output-dir outputs\evidence\cards

python scripts\build_evidence_handoff.py `
  --cards-json outputs\evidence\cards\archetype_evidence_cards.json `
  --output-dir outputs\evidence\handoff `
  --primary-archetype attention_validation
```

## Destination

The dashboard destination is:

```text
sentiment-dash/seta_bundles/latest/evidence/dashboard_evidence_payload.json
```

`seta_bundles` is normally ignored because it is generated/published content. For this specific file, committing it can be appropriate when the goal is to snapshot the current website refresh payload for GitHub Pages.

## Safety policy

The payload must preserve the upstream safety note:

```text
Historical diagnostic only; not a trade signal, recommendation, or price forecast.
```

The first visible UI slice should continue to show only `attention_validation`.

## Recommended command

From `sentiment-dash`:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\publish_seta_evidence_handoff_to_bundle.ps1 `
  -SetaEngineRoot "C:\SETA_engine\SETA_engine_git_initialized_for_push\SETA_engine" `
  -DashRoot "C:\Users\shane\sentiment-dash" `
  -Stage
```

The script will:

1. locate the SETA_engine source payload,
2. copy it into `seta_bundles/latest/evidence/`,
3. validate the copied payload,
4. optionally stage the generated payload with `git add -f`.

## Commit policy

For a dashboard publish PR, stage only:

```text
scripts/publish_seta_evidence_handoff_to_bundle.ps1
docs/evidence/evidence_payload_publish_v1.md
tests/test_evidence_payload_publish.py
seta_bundles/latest/evidence/dashboard_evidence_payload.json
```

Do not use `git add .` in this repository because there are often local scratch files and generated dashboard artifacts.
