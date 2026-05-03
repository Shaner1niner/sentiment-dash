# Dashboard V2 Product Polish Backlog - 2026-05-03

This backlog now starts from the stable `refresh_status_001` dashboard baseline. It intentionally avoids reopening fixes that have already passed QA.

## P1 - Regression Protection

- Keep the visual regression harness current as controls, routes, or chart IDs change.
- Capture fresh screenshots before and after any future chart-rendering change.
- Daily refresh confidence shipped: dashboard freshness line, local smoke/visual checks, and GitHub Pages health checklist.

## P2 - Chart Readability

- Monitor occasional weekly MACD final-period crowding after the histogram gutter polish; avoid changing core indicator calculations.
- Review annotation density in MACD and RSI panes so signal labels remain readable on long display ranges.
- Mobile member/public viewport pass shipped for controls, Market Tape, chart panes, and collapsed Alert Events spacing; continue checking after future panel changes.
- Keep weekly candle bodies visually wide enough on 3M, 6M, and 1Y windows.

## P2 - Control And Naming Clarity

- Revisit band naming once behavior stabilizes further: Price, Combined Overlap, Canonical Overlap, and All Bands should stay understandable to a returning user.
- Confirm that public and member dashboards expose only the controls each audience needs.
- Keep helper text short and operational; avoid turning the dashboard into documentation in the interface.

## P3 - Market Tape And Asset Universe

- Market Tape universe clarification shipped: visible cards are a capped section slice, rank numbers are global screener ranks, and the header now states the active section/mode coverage.
- Keep SPY behavior tolerant of upstream data gaps so it returns naturally when the pipeline is fixed.

## P3 - Interaction Polish

- Tune tooltip priority so metric tooltips do not block key chart or score-card content.
- Review keyboard focus states for drawer controls, dropdowns, and ranked cards.
- Consider a lightweight "last refreshed" surface if daily GitHub Pages pushes remain the refresh mechanism.

## Do Not Reopen Without New Evidence

- SETA Event Timeline drawer close/reopen behavior.
- Weekly candle width.
- Weekly band visible-window coverage for Price, Combined Overlap, Canonical Overlap, and All Bands.
- Launch/runner changes that have already been reviewed.
