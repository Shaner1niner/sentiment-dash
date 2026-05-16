# Chart and TA Visual Improvement Plan

## Purpose

Define the visual improvement roadmap for the SETA module candlestick chart and technical-analysis panels after the public route stabilization milestone.

This plan is documentation only. It does not change calculations, payloads, routes, asset coverage, or dashboard runtime behavior.

## Current context

The production public route is now stable enough to begin visual polish:

- public route: `interactive_dashboard_fix24_public_embed.html`
- public asset universe: AAPL, BTC, COIN, ETH, GLD, MSFT, NVDA, SOL
- legacy public fallback remains available
- member route remains pinned to the legacy monolith

## Visual objective

Move the chart area from technically functional to premium SETA product surface.

The chart should feel:

- readable at a glance
- visually calm despite dense data
- intentionally layered
- consistent with the SETA dark-card design language
- useful for context without feeling like indicator clutter

The goal is not to add trade signals or price predictions. The goal is to make price structure, participation, sentiment, attention, and confirmation context easier to understand.

## Primary surfaces

Likely affected areas:

- main candlestick / price chart
- price overlays and bands
- sentiment overlays / ribbons
- regime visuals
- attention context visuals
- MACD panel
- RSI panel
- Stoch RSI panel
- chart title and subtitle
- axes and gridlines
- hover and legend behavior
- missing-data and insufficient-data states
- mobile / narrow-width chart layout

## Non-goals

This plan does not authorize:

- calculation changes
- payload regeneration
- route changes
- asset universe expansion
- member/research route migration
- monolith deletion
- buy/sell signal language
- price prediction language

## Design principles

### Price first

The candlestick chart should be the primary read. Overlays should support the price story without competing with candles.

### Context over clutter

Avoid the indicator soup look. Secondary traces should be lower contrast, thinner, or visually subordinate.

### Consistent TA hierarchy

MACD, RSI, and Stoch RSI should use consistent spacing, labels, thresholds, and muted grid styling.

### Designed fallbacks

If an indicator has missing or insufficient data, the panel should look intentional rather than broken.

## Phase roadmap

### Phase 1: Visual planning and QA baseline

Deliver this document and define the browser QA matrix.

### Phase 2: Candlestick readability pass

Potential improvements:

- improve candle body and wick contrast
- reduce gridline dominance
- improve price-axis formatting
- improve date-axis density
- polish chart title and subtitle
- reduce visual clutter from inactive overlays

Likely files:

- `src/PlotlyRenderer.js`
- `scripts/smoke_module_plotly_renderer_parity.py`
- `scripts/smoke_fix26_dashboard.py`

### Phase 3: Overlay and band polish

Potential improvements:

- make bands feel intentional rather than noisy
- reduce opacity on secondary overlays
- distinguish price overlays from sentiment overlays
- improve legend labels for public readability

### Phase 4: TA panel hierarchy

Potential improvements:

- consistent panel heights
- clearer MACD zero-line treatment
- cleaner RSI 30/70 threshold bands
- cleaner Stoch RSI 20/80 threshold bands
- panel-specific labels inside each panel
- better missing-data states

### Phase 5: Hover, legend, and interaction polish

Potential improvements:

- unified hover styling
- clearer hover labels
- asset / frequency / range context in hover
- legend placement that does not steal chart space

### Phase 6: Mobile and narrow-width behavior

Potential improvements:

- reduce axis label density
- avoid title / legend collisions
- preserve TA panel readability
- keep controls visually attached to chart context

## Suggested first implementation PR

Recommended first runtime branch:

`polish/module-candlestick-readability-v1`

Scope:

- candlestick readability only
- chart shell polish
- title/subtitle polish
- gridline/axis refinement
- no TA calculation changes
- no route changes
- no payload regeneration

## Browser QA matrix

Minimum assets:

| Asset | Frequency | Range | Required checks |
|---|---|---|---|
| BTC | Daily | 3M | candles, overlays, MACD, RSI, Stoch RSI render |
| ETH | Daily | 3M | candles, overlays, TA panels render |
| SOL | Daily | 3M | chart title and TA panels remain aligned |
| NVDA | Daily | 3M | equity chart readability |
| MSFT | Daily | 3M | equity chart readability |

Optional follow-up:

| Asset | Frequency | Range | Required checks |
|---|---|---|---|
| BTC | Weekly | 1Y | weekly candle readability |
| ETH | Weekly | 1Y | weekly TA panel behavior |
| SOL | Daily | YTD | dense axis readability |
| AAPL | Daily | 3M | public route compatibility |
| COIN | Daily | 3M | high-volatility equity readability |

## Validation baseline

Recommended smoke checks for visual PRs:

- `python scripts\smoke_module_plotly_renderer_parity.py`
- `python scripts\smoke_module_asset_payload_loading.py`
- `python scripts\smoke_fix26_dashboard.py`

## Files to avoid in visual-only PRs

Do not touch generated payload files in visual-only PRs:

- `fix26_chart_store_assets/`
- `fix26_chart_store_member.json`
- `fix26_chart_store_member_index.json`
- `fix26_chart_store_public.json`
- `fix26_chart_store_public_index.json`
- `fix26_screener_store.json`
- `generated_briefings_reviewed.json`
- `generated_briefings_reviewed_v2.json`
- `public_content/seta_website_snippets_latest.json`
- `public_content/seta_website_snippets_latest.md`

## Recommendation

Proceed with chart and TA visual improvements, but keep the first runtime PR narrow.

Recommended order:

1. Merge this plan.
2. Open `polish/module-candlestick-readability-v1`.
3. Improve only candlestick readability and chart shell polish.
4. Browser-QA BTC, ETH, SOL, NVDA, and MSFT.
5. Document browser QA.
6. Then proceed to MACD / RSI / Stoch RSI visual hierarchy.

## Final checkpoint

The public route is stable enough to begin chart/TA polish.

The next implementation should improve perceived product quality without changing data, routes, payloads, calculations, or asset coverage.
