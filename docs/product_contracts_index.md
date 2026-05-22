# SETA Product Contracts Index

This index lists the product, operations, and QA contracts that define the current SETA public-dashboard operating baseline.

Use this as the starting map before changing dashboard UX, generated payloads, refresh behavior, or asset-universe rules.

## First-run checkpoint

Start new dashboard work sessions with:

```powershell
python scripts\report_dashboard_ops_health.py --diagnostics
```

Expected healthy baseline:

```text
repo_status: clean
refresh_db_chart_history_default: True
local_dashboard_smoke: passed
live_pages_smoke: passed
db_source_contract: passed
asset_readiness_report: passed
recommendation: keep member universe unchanged; warming assets need more historical span
```

## Core contracts

| Contract | Path | Purpose | Primary validation |
|---|---|---|---|
| Dashboard refresh and asset readiness SOP | `docs/dashboard_refresh_and_asset_readiness_sop.md` | Operating procedure for refreshes, DB overlay, asset-readiness checks, and promotion discipline | `python scripts\report_dashboard_ops_health.py --diagnostics` |
| Public dashboard UX contract | `docs/public_dashboard_ux_contract.md` | Locks the public dashboard reader experience, view modes, Market Radar hierarchy, Briefing/Research density, and reader framing | `python scripts\smoke_public_dashboard_ux_contract.py` |
| Dislocation context cards contract | `docs/dislocation_context_cards_contract.md` | Locks the standalone context-card page as a read-only research surface backed by the Prediction Intelligence Engine export | `python scripts\smoke_dislocation_context_cards_contract.py` |
| Public chart glossary | `docs/public_chart_glossary.md` | Defines user-facing language for chart overlays and dashboard terminology | `python scripts\smoke_public_chart_glossary.py` |

## QA bundles

Use compact contract checks while iterating:

```powershell
python scripts\smoke_public_dashboard_ux_contract.py
python scripts\smoke_dislocation_context_cards_contract.py
python scripts\report_dashboard_ops_health.py --skip-live
```

Use the broader dashboard QA bundle before merging product-surface changes:

```powershell
python scripts\run_public_dashboard_qa.py --skip-full-dashboard-smoke
```

Use the full dashboard cockpit after merging or after any payload refresh:

```powershell
python scripts\report_dashboard_ops_health.py --diagnostics
```

## Change discipline

A docs/product-contract PR should generally stay within:

```text
docs/*
scripts/smoke_*contract*.py
scripts/run_public_dashboard_qa.py
```

Expected scope:

```text
No generated payload changes
No DB writes
No manifest changes
No asset-universe changes
No runtime behavior changes unless explicitly intended
```

Generated files should not be mixed into docs/product-contract PRs unless the PR is explicitly a payload refresh.

Common generated payload paths:

```text
fix26_chart_store_assets/*
fix26_chart_store_member.json
fix26_chart_store_public.json
fix26_screener_store.json
fix26_structure_score_history.json
generated_briefings_reviewed*.json
public_content/seta_website_snippets_latest.json
```

If generated payload changes appear unintentionally, restore them before continuing.

## Asset-universe rule

Do not expand the dashboard manifest just because assets exist in the DB.

Use:

```powershell
python scripts\report_asset_universe_promotion.py
python scripts\report_asset_universe_promotion.py --pin-terms "GOOG,HOOD,SOFI,QCOM"
```

Current locked interpretation:

```text
eligible_unconfigured_assets: 0
warming_unconfigured_assets: 63
dominant_promotion_blockers: {'date_span_threshold': 63}
recommendation: keep member universe unchanged; warming assets need more historical span
```

Promote only when `eligible_unconfigured_count > 0` and candidates have been reviewed in a separate manifest PR.

## Reader-language rule

Product surfaces should explain:

```text
market emotion
setup quality
participation context
validation context
forward evidence
risk guard language
```

They should avoid prescriptive outcome language and should remain explanatory, contextual, and evidence-based.

## Recommended pre-merge checklist

For docs/product-contract PRs:

```powershell
python scripts\smoke_public_dashboard_ux_contract.py
python scripts\smoke_dislocation_context_cards_contract.py
python scripts\run_public_dashboard_qa.py --skip-full-dashboard-smoke
python scripts\report_dashboard_ops_health.py --diagnostics
git status --short
```

Expected final state:

```text
Public dashboard QA bundle passed
repo_status: clean
recommendation: keep member universe unchanged; warming assets need more historical span
```
