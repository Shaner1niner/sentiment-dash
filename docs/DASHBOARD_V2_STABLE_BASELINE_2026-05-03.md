# Dashboard V2 Stable Baseline - 2026-05-03

This is the current stable dashboard baseline after the Event Timeline drawer, weekly candle width, and band-window coverage fixes.

## Baseline Identity

- Stable source head before this documentation/tooling pass: `6f8ccc2`
- Intended stable tag after merge: `dashboard-v2-stable-band-window-2026-05-03`
- Live cache token validated: `band_window_006`
- Primary host: GitHub Pages only
- Public URL family: `https://shaner1niner.github.io/sentiment-dash/`

## Validated Behavior

- Member and public dashboard routes load on GitHub Pages.
- SETA Event Timeline drawer opens, closes, and reopens cleanly.
- Changing assets while the drawer is open or collapsed preserves the expected layout.
- Weekly candles use the wider custom display and are visually readable on 3M, 6M, and 1Y windows.
- Price, Combined Overlap, Canonical Overlap, and All Bands render across the visible weekly window instead of only the final segment.
- Sentiment and canonical settings are currently visually acceptable.
- Daily pushes remain acceptable as the refresh mechanism for GitHub Pages.

## Known Non-Blocking Items

- Weekly MACD can show a tiny final-period histogram/line overlap in some assets. This is cosmetic and should be handled as a P3 visual polish item, not a launch blocker.
- SPY may be absent because of an upstream pipeline issue. The dashboard should allow SPY to function normally once upstream data returns.
- Sanitized testing can remain local-only unless the deployment model changes.

## Validation Commands

Run these from the repository root:

```powershell
python scripts/smoke_fix26_dashboard.py
python scripts/smoke_github_pages_live.py
node --check scripts/visual_regression_dashboard.js
```

The visual regression script is intentionally optional. If Playwright is not installed, it reports a skip and leaves the smoke suite unaffected.

## Guardrails For Future Work

- Do not revisit the Event Timeline drawer unless a new regression appears.
- Do not narrow weekly candle bodies without a before/after screenshot comparison.
- Do not change band-window warmup or visible-window coverage without running weekly 1Y checks for Price, Combined Overlap, Canonical Overlap, and All Bands.
- Treat the current launch/runner changes as already reviewed unless new evidence appears.
