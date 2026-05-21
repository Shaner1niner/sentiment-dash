# Dashboard Refresh and Asset Readiness SOP

This SOP captures the current production path for the Fix 26 SETA dashboard refresh and the controlled process for evaluating asset-universe expansion.

## Current locked state

- Chart-history refresh defaults to the canonical DB overlay.
- Legacy exporter still runs first for alert/audit/attention sidecars and fallback safety.
- Local dashboard smoke is clean.
- Live GitHub Pages smoke is clean.
- Asset-universe expansion is controlled by DB coverage readiness, not a fixed raw target count.
- Dashboard Ops Health v1 is the preferred first-run cockpit check.

## First-run ops health check

Start new work sessions with the compact cockpit report:

```powershell
cd C:\Users\shane\sentiment-dash
python scripts\report_dashboard_ops_health.py --diagnostics
```

Expected healthy output includes:

```text
refresh_db_chart_history_default: True
refresh_default_smoke: passed
local_dashboard_smoke: passed
live_pages_smoke: passed
db_source_contract: passed
asset_readiness_report: passed
recommendation: keep member universe unchanged; warming assets need more historical span
```

For a faster local-only check, skip the live GitHub Pages smoke:

```powershell
python scripts\report_dashboard_ops_health.py --skip-live
```

For machine-readable output:

```powershell
python scripts\report_dashboard_ops_health.py --json --skip-live
```

Note: `repo_status` reflects local untracked files. A deliberately local working doc, such as `docs/public_dashboard_ux_contract (1).md`, can appear there without indicating dashboard health failure.

## Production refresh command

Run from the repo root:

```powershell
cd C:\Users\shane\sentiment-dash
$env:NO_PAUSE="1"
.\refresh_fix26_dashboard_all.bat
```

Expected early refresh proof:

```text
DB chart-history overlay: 1
[1b/8] Overlaying chart-history CSV from canonical DB table...
depth_guard.passed: true
```

If the DB overlay fails and fallback is enabled, the BAT continues with legacy chart-history output. To force failure instead of fallback:

```powershell
$env:DB_EXPORT_FALLBACK_TO_LEGACY="0"
```

## Post-refresh validation

Run:

```powershell
python scripts\smoke_fix26_dashboard.py
python scripts\smoke_github_pages_live.py
python scripts\report_dashboard_ops_health.py --diagnostics
git status --short
```

Expected:

```text
PASSED
```

`git status --short` may show generated payload files after a refresh. Publish them only when intentionally refreshing the live payloads. Otherwise restore generated payload noise before code/doc work.

## Asset-readiness report

Run the compact default report:

```powershell
python scripts\report_asset_universe_promotion.py
```

Run compact JSON:

```powershell
python scripts\report_asset_universe_promotion.py --json
```

Run a pinned diagnostic for specific terms:

```powershell
python scripts\report_asset_universe_promotion.py --pin-terms "GOOG,HOOD,SOFI,QCOM"
```

Increase visible rows without full JSON:

```powershell
python scripts\report_asset_universe_promotion.py --limit 25
python scripts\report_asset_universe_promotion.py --json --limit 25
```

Use full diagnostic JSON only when needed:

```powershell
python scripts\report_asset_universe_promotion.py --json --full-json
```

## Interpretation rules

The report is adaptive by default. It does not assume a fixed move from 28 assets to 40 assets.

Use these rules:

| Field | Meaning | Action |
|---|---|---|
| `eligible_unconfigured_count > 0` | Assets meet strict production coverage thresholds | Review candidates for possible manifest promotion |
| `warming_unconfigured_count > 0` | Assets exist in DB and are fresh, but not production-mature | Track; do not promote yet |
| `blocked_unconfigured_count > 0` | Assets fail even warm coverage/freshness thresholds | Investigate ingestion or source coverage |
| `promotion_blocker = date_span_threshold` | Assets need more historical span | Wait; do not expand manifest |
| `promotion_blocker = row_threshold` | Assets need more rows | Wait or inspect collection cadence |
| `promotion_blocker = freshness_threshold` | Latest data is stale | Investigate pipeline freshness |

## Current observed interpretation

As of the DB-default checkpoint, the report showed:

```text
eligible_unconfigured_count: 0
warming_unconfigured_count: 63
blocked_unconfigured_count: 0
next_estimated_days_to_eligible: 263
dominant_promotion_blockers: {'date_span_threshold': 63}
```

Interpretation:

```text
Keep the member dashboard universe at the current configured set.
Do not promote the warming assets yet.
The primary bottleneck is historical date span, not freshness.
```

## Promotion discipline

Do not add all DB assets to the dashboard manifest just because they are available in `final_combined_data_enriched_tbl`.

A controlled promotion should happen only after:

1. `eligible_unconfigured_count` is greater than zero.
2. Candidate terms are reviewed with pinned diagnostics if needed.
3. The manifest change is made in a separate PR.
4. The refresh BAT runs successfully with DB overlay enabled.
5. Local and live smoke checks pass.
6. Dashboard Ops Health v1 reports a promotion-ready recommendation or no blocking failures.

## Related scripts

- `refresh_fix26_dashboard_all.bat`
- `scripts/export_dashboard_chart_history_from_db.py`
- `scripts/smoke_refresh_db_export_opt_in.py`
- `scripts/smoke_fix26_dashboard.py`
- `scripts/smoke_github_pages_live.py`
- `scripts/report_dashboard_ops_health.py`
- `scripts/smoke_dashboard_ops_health_report.py`
- `scripts/report_asset_universe_promotion.py`
- `scripts/smoke_asset_universe_promotion_report.py`
