# Dashboard Mobile Viewport Pass - 2026-05-03

This pass checked the dashboard at a 390px-wide mobile viewport after the Market Tape universe clarification.

## Scenarios

- Member dashboard: BTC, weekly, 1Y, candles, Combined Overlap.
- Public dashboard: BTC, weekly, 1Y, candles, All Bands.

## Results

- Top navigation remains usable.
- Summary badges and controls wrap without horizontal overflow.
- Market Tape header, scope line, tabs, and cards fit on mobile.
- Market Tape cards use a readable two-column layout.
- Selected setup details and metric deck stack cleanly.
- Weekly chart panes render with price, MACD, RSI, and Stoch panes visible.
- Collapsed Alert Events drawer renders below the chart without crowding the panes.

## Notes

- No product CSS changes were required in this pass.
- The visual regression harness now includes mobile member/public scenarios and local full-page mobile screenshots.
- Generated screenshots remain local-only under `docs/qa/dashboard-visual-regression-latest/`.
