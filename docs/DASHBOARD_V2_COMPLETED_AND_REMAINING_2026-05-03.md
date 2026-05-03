# Dashboard V2 Completed And Remaining - 2026-05-03

## Completed

- Core dashboard smoke hygiene for current embed cache-token policy.
- GitHub Pages live health check.
- Drawer layout and close/reopen stabilization.
- Weekly candle readability.
- Weekly band visible-window coverage.
- MACD histogram gutter polish.
- Market Tape ranking universe clarification.
- Mobile viewport QA for member and public dashboards.
- Visual regression harness with desktop and mobile scenarios.
- Refresh status surface in dashboard headers.
- Daily refresh health checklist.

## Remaining Product Polish

- Annotation density: reduce MACD/RSI label crowding on mobile and long windows.
- Tooltip and focus polish: prioritize helpful tooltips and verify keyboard focus states.
- Band terminology: revisit naming only if users still find Combined/Canonical/All ambiguous.
- Asset universe strategy: decide whether public coverage should expand or remain intentionally curated.

## Remaining Operations

- Keep daily refresh checks tied to `smoke_fix26_dashboard.py`, `visual_regression_dashboard.js`, and `smoke_github_pages_live.py`.
- Watch for SPY upstream restoration; no dashboard-side workaround is needed.
- Consider a lightweight production environment/preflight doc if more machines need to run the refresh.

## Suggested Next Product Branch

```text
polish/chart-annotation-density
```

Scope:

- Keep indicator calculations unchanged.
- Focus only on label placement/crowding in MACD/RSI panes.
- Use visual regression screenshots before and after.
