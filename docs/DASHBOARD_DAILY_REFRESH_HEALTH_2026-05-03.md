# Dashboard Daily Refresh Health - 2026-05-03

This checklist is for confirming that the daily GitHub Pages dashboard refresh is healthy.

## Dashboard Status Surface

The dashboard header now shows a quiet freshness line built from the chart store `_meta` block and screener metadata:

```text
Data 2026-05-03 01:13 UTC (6.2h old) · Screener 6.2h old · 27 assets covered · SPY upstream gap
```

The exact text varies by mode. Public mode currently shows 8 covered assets; member mode currently shows 27 covered assets. SPY is expected to appear as an upstream gap until the source pipeline restores coverage.

## Daily Operator Check

Run these from the repository root after the refresh job or daily push:

```powershell
& 'C:\Users\shane\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe' scripts/smoke_fix26_dashboard.py
& 'C:\Users\shane\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' scripts/visual_regression_dashboard.js
& 'C:\Users\shane\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe' scripts/smoke_github_pages_live.py
```

## Expected Healthy Result

- Dashboard smoke passes.
- Visual regression harness passes all desktop and mobile scenarios.
- GitHub Pages live health passes.
- Public and member dashboards load the same JS/CSS cache token.
- Public/member chart store `generated_at_utc` values are within the freshness window.
- SPY warnings are limited to the expected upstream coverage gap.

## Investigate If

- The freshness line is missing from either dashboard.
- The freshness age is older than the expected daily refresh window.
- GitHub Pages serves an older cache token than the local embed files.
- Missing assets include anything beyond SPY.
- The visual harness reports chart, Market Tape, or viewport overflow failures.
