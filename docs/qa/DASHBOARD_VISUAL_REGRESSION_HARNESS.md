# Dashboard Visual Regression Harness

The dashboard visual harness captures a small set of repeatable screenshots for the areas that have been most fragile: weekly candles, band-window coverage, and the Event Timeline drawer.

## Run

```powershell
node scripts/visual_regression_dashboard.js
```

By default the script starts a local static server from the repository root. To test the published site instead:

```powershell
$env:BASE_URL = "https://shaner1niner.github.io/sentiment-dash"
node scripts/visual_regression_dashboard.js
```

Screenshots are written to:

```text
docs/qa/dashboard-visual-regression-latest/
```

## Dependency Model

Playwright is optional for the repository. If `playwright` or `playwright-core` is not installed, the script first checks the bundled Codex runtime path. If no Playwright package is available, it exits with a clear skip message and status `0`.

For a required CI-style run, set:

```powershell
$env:VISUAL_REQUIRED = "1"
node scripts/visual_regression_dashboard.js
```

With `VISUAL_REQUIRED=1`, a missing Playwright install exits non-zero.

## Scenario Coverage

- Member dashboard, BTC weekly 1Y, Combined Overlap bands.
- Member dashboard, LINK weekly 1Y, Combined Overlap bands.
- Public dashboard, BTC weekly 1Y, Price bands.
- Public dashboard, BTC weekly 1Y, All Bands.
- Event Timeline drawer present and rendered.

## Checks

The script combines screenshots with lightweight DOM checks:

- chart container has a real rendered size;
- weekly candle scenarios contain a Plotly price bar trace;
- band scenarios contain a band or overlap trace with finite values near the visible-window start;
- drawer presence and rendered-width sanity.

These checks are not a substitute for human visual QA, but they give us a fast tripwire before pushing dashboard changes.
