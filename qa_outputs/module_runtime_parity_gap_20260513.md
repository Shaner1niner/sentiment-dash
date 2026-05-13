# Module Runtime Parity Gap

- Generated UTC: `2026-05-13T07:55:56+00:00`
- Branch: `qa/module-runtime-parity-gap-v1`

## Purpose

Document why the live dashboard was restored to `dashboard_fix26_app.js` and what the `src/dashboard_main.js` module path still needs before it can safely become the production embed entrypoint again.

## File presence

- `dashboard_fix26_app.js`: `present`
- `src\dashboard_main.js`: `present`
- `src\Store.js`: `present`
- `src\features\Controls.js`: `present`
- `src\PlotlyRenderer.js`: `present`
- `src\features\MarketTape.js`: `present`
- `src\core\displayRangeWindow.js`: `present`

## Feature parity matrix

| Feature | Monolith status | Module-path status | Notes |
|---|---:|---:|---|
| `asset_payload_loading` | `present` | `present` | candidate for deeper comparison |
| `range_frequency_controls` | `present` | `present` | candidate for deeper comparison |
| `briefing_panel` | `present` | `missing` | module parity gap |
| `market_tape` | `present` | `missing` | module parity gap |
| `plotly_chart` | `present` | `present` | candidate for deeper comparison |
| `display_window` | `present` | `present` | candidate for deeper comparison |
| `event_timeline` | `present` | `missing` | module parity gap |
| `render_guards` | `present` | `missing` | module parity gap |

## Detailed token counts

### asset_payload_loading

| Token | Monolith count | Module-path count |
|---|---:|---:|
| `ensureAssetPayload` | 2 | 0 |
| `activeAssetIndexUrl` | 2 | 0 |
| `fix26_chart_store` | 1 | 2 |
| `chart_store` | 2 | 2 |

### range_frequency_controls

| Token | Monolith count | Module-path count |
|---|---:|---:|
| `range` | 173 | 34 |
| `freq` | 114 | 1 |
| `displayRange` | 17 | 6 |
| `currentRange` | 0 | 0 |
| `currentFreq` | 0 | 0 |
| `setRange` | 0 | 0 |
| `setFreq` | 0 | 0 |

### briefing_panel

| Token | Monolith count | Module-path count |
|---|---:|---:|
| `renderBriefingPanel` | 3 | 0 |
| `renderReviewedBriefingPanel` | 3 | 0 |
| `reviewedBriefingFor` | 9 | 0 |
| `loadReviewedBriefings` | 2 | 0 |
| `briefing_cards` | 4 | 0 |

### market_tape

| Token | Monolith count | Module-path count |
|---|---:|---:|
| `SETA Market Tape` | 3 | 0 |
| `marketTapeFamily` | 138 | 0 |
| `renderMarketTape` | 0 | 0 |
| `phase_g_market_tape_v1` | 0 | 0 |

### plotly_chart

| Token | Monolith count | Module-path count |
|---|---:|---:|
| `Plotly.newPlot` | 1 | 1 |
| `Plotly.react` | 2 | 0 |
| `priceCandlestickTraces` | 2 | 0 |
| `weeklyCandlestickTraces` | 2 | 0 |
| `renderChart` | 1 | 2 |

### display_window

| Token | Monolith count | Module-path count |
|---|---:|---:|
| `visibleMask` | 49 | 4 |
| `plotRows` | 3 | 0 |
| `plotXs` | 2 | 0 |
| `displayRangeVisibleMaskFromBounds` | 3 | 0 |
| `selectedWindowRows` | 0 | 1 |
| `displayRangeWindowDays` | 0 | 3 |

### event_timeline

| Token | Monolith count | Module-path count |
|---|---:|---:|
| `SETA Event Timeline` | 1 | 0 |
| `applyExplicitAlertTimelineLayout` | 3 | 0 |
| `alert timeline` | 0 | 0 |
| `watch` | 117 | 0 |
| `confirmed` | 148 | 0 |

### render_guards

| Token | Monolith count | Module-path count |
|---|---:|---:|
| `currentDashboardControlKey` | 4 | 0 |
| `renderKey` | 3 | 0 |
| `stale render` | 1 | 0 |
| `SETA_ASSET_SWITCH_GUARD` | 1 | 0 |

## Current recommendation

Keep production embeds on `dashboard_fix26_app.js` until the module runtime reaches functional parity for:

1. asset payload loading
2. range/frequency control state
3. chart rendering with real payload rows
4. reviewed/deterministic briefing panel rendering
5. market tape rendering
6. event timeline rendering
7. stale render guards

The module path should be treated as a workbench until these parity gates are met.

## Recommended follow-up branches

```text
refactor/module-store-control-state-v1
refactor/module-asset-payload-loading-v1
refactor/module-plotly-renderer-parity-v1
qa/module-runtime-parity-smoke-v1
```

## Non-goals

- no production embed cutover
- no runtime behavior changes
- no payload regeneration
- no reviewed briefing changes

