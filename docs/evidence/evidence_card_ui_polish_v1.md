# Evidence Card UI Polish v1

## Purpose

Evidence Card UI v1 successfully renders the SETA Evidence Handoff payload on the homepage. The first visual smoke test confirmed that the card loads and preserves the public safety note, but the metric grid could read as misaligned because definition-list labels and values were rendered as separate grid children.

This polish patch keeps the current behavior and visual language, while grouping each metric label with its value.

## Scope

This patch changes only the evidence-card rendering and supporting tests:

- `src/evidence_handoff_reader.js`
- `src/evidence_card_ui.js`
- `tests/test_evidence_card_ui_polish.py`

## UX target

The metric grid should read as grouped metric tiles:

```text
Events              Unique Terms          Date Range
682                 47                    2026-03-24 to 2026-05-22

7d Mean Edge        7d Win Rate            7d Baseline
0.42%               62.77%                 57.22%
```

## Public-safety rule

The card must continue to preserve the upstream safety note:

```text
Historical diagnostic only; not a trade signal, recommendation, or price forecast.
```

## Validation

Run:

```powershell
python -m pytest tests\test_evidence_card_ui_polish.py
python -m pytest tests\test_evidence_card_ui.py
python -m pytest tests\test_evidence_handoff_payload.py
python -m pytest tests\test_evidence_payload_publish.py

python scripts\check_evidence_handoff_payload.py `
  --payload seta_bundles\latest\evidence\dashboard_evidence_payload.json
```

Then run a manual visual smoke test:

```powershell
python -m http.server 8000
```

Open:

```text
http://localhost:8000/
```

The evidence card should remain visible, and metric labels should be paired directly with their values.
