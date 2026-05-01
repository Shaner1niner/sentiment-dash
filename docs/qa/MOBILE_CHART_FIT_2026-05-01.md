# Mobile Chart Fit QA - 2026-05-01

Branch: `fix/dashboard-v2-mobile-chart-fit`

Local preview URL:

- `http://localhost:8765/interactive_dashboard_fix24_public_embed.html`
- `http://localhost:8765/interactive_dashboard_fix24_member_embed.html`

## Change Summary

- Gated the performance diagnostics badge behind explicit `?diag=1` or `?perf=1`.
- Added mobile-specific chart height and Plotly margins.
- Shortened mobile pane annotations for RSI and Stoch RSI.
- Hid redundant pane title annotations on mobile, where the axis labels already identify the pane.
- Converted the collapsed Alert Events drawer into a compact horizontal mobile bar.

## Screenshots

- [Public dashboard desktop](mobile-chart-fit-2026-05-01/public-dashboard-desktop.png)
- [Member dashboard desktop](mobile-chart-fit-2026-05-01/member-dashboard-desktop.png)
- [Public dashboard mobile](mobile-chart-fit-2026-05-01/public-dashboard-mobile.png)
- [Member dashboard mobile](mobile-chart-fit-2026-05-01/member-dashboard-mobile.png)

## Validation

Local smoke/QA:

- `scripts/smoke_fix26_dashboard.py`: passed with the known stale cache-token warnings from current `main`
- `scripts/smoke_seta_public_context_cards_v2.py`: passed
- `scripts/smoke_seta_macd_visual_polish_v3.py`: known stale failure on current `main`; PR #6 updates this smoke test
- Headless Chromium screenshot capture: passed
- `#setaPerfDiagnosticsPanel` count: `0` on public/member desktop and mobile without `?diag=1` or `?perf=1`
- `git diff --check`: passed

## Notes

This branch intentionally avoids payload, manifest, alert-policy, and generated JSON changes.
