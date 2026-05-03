# Dashboard V2 Release Baseline - 2026-05-03

This is the current stable release baseline after the dashboard repair, polish, QA, and refresh-confidence passes.

## Baseline Identity

- Stable source head before this documentation pass: `825724c`
- Intended stable tag after merge: `dashboard-v2-refresh-status-stable-2026-05-03`
- Live cache token validated before this pass: `refresh_status_001`
- Primary host: GitHub Pages
- Public URL family: `https://shaner1niner.github.io/sentiment-dash/`

## Completed Since Earlier Baseline

- SETA Event Timeline drawer close/reopen behavior stabilized.
- Weekly candle bodies widened while preserving chart readability.
- Price, Combined Overlap, Canonical Overlap, and All Bands restored to full visible-window coverage.
- MACD histogram gutter polish reduced final-period crowding without changing indicator math.
- Market Tape universe copy now explains section count, global rank scope, mode coverage, and upstream gaps.
- Visual regression harness runs with bundled Playwright and covers desktop plus mobile scenarios.
- Mobile member/public viewport pass completed at 390px width.
- Dashboard header now shows data/screener freshness, covered asset count, and expected upstream gaps.
- Daily refresh health checklist documented.

## Validated Surfaces

- Public dashboard route.
- Member dashboard route.
- Market Context cards route.
- Desktop weekly BTC/member Combined Overlap.
- Desktop weekly LINK/member Combined Overlap.
- Desktop weekly BTC/public Price Bands.
- Desktop weekly BTC/public All Bands.
- Mobile weekly BTC/member Combined Overlap.
- Mobile weekly BTC/public All Bands.

## Expected Warnings

- SPY is still an upstream data coverage gap. Keep dashboard support intact so SPY works normally once upstream data returns.

## Validation Commands

Run these from the repository root:

```powershell
& 'C:\Users\shane\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' scripts/visual_regression_dashboard.js
& 'C:\Users\shane\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe' scripts/smoke_fix26_dashboard.py
& 'C:\Users\shane\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe' scripts/smoke_github_pages_live.py
```

## Guardrails

- Do not reopen drawer, weekly candle, or band-window fixes without a new reproducible regression.
- Do not hand-edit generated JSON payloads.
- Keep generated visual screenshots local-only unless a future decision says to version them.
- Treat SPY as upstream, not as a dashboard-side removal.
- Keep GitHub Pages as the active host unless the hosting decision changes.
