# Evidence Handoff Dashboard Integration v1

This document defines the first small sentiment-dash integration point for SETA_engine Evidence Handoff v1.

## Goal

Consume the SETA_engine handoff payload as a public-safe dashboard artifact, starting with the `attention_validation` archetype only.

The payload is intended to support dashboard, website, and newsletter copy without requiring the dashboard to infer evidence language from raw chart-store files or generated briefing artifacts.

## Proposed artifact location

Preferred generated artifact path inside sentiment-dash:

```text
seta_bundles/latest/evidence/dashboard_evidence_payload.json
```

This keeps the evidence payload near the scheduled SETA bundle refresh surface while separating it from chart-store payloads.

## Upstream producer

SETA_engine generates the payload with:

```powershell
python scripts\build_evidence_handoff.py `
  --cards-json outputs\evidence\cards\archetype_evidence_cards.json `
  --output-dir outputs\evidence\handoff `
  --primary-archetype attention_validation
```

Then the generated file can be copied into sentiment-dash as:

```text
outputs/evidence/handoff/dashboard_evidence_payload.json
  -> seta_bundles/latest/evidence/dashboard_evidence_payload.json
```

## First UI scope

Display only the primary card for:

```text
attention_validation
```

The first visual surface should be intentionally simple:

- archetype title
- status badge
- public takeaway
- key metrics
- safety note

Do not expose every archetype in the first UI pass. `sentiment_repair` and `divergence` should remain available in the payload but hidden or secondary until their definitions are segmented further.

## Required guardrail

Every display must preserve this language:

```text
Historical diagnostic only; not a trade signal, recommendation, or price forecast.
```

## Validation

Run the payload checker against either the fixture or the generated bundle file:

```powershell
python scripts\check_evidence_handoff_payload.py `
  --payload tests\fixtures\evidence\dashboard_evidence_payload.json

python scripts\check_evidence_handoff_payload.py `
  --payload seta_bundles\latest\evidence\dashboard_evidence_payload.json
```

A dashboard integration should not be considered healthy unless:

- `schema_version` is `seta_evidence_handoff_v1`
- `primary_archetype` is `attention_validation`
- `safety_note` is present
- at least one card is available
- the primary card can be found
