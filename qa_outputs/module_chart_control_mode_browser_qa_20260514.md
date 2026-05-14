# Module Chart Control Mode Browser QA

## Purpose

Validate browser behavior after the module chart/control parity branch and the Plotly layout-axis sanitizer hotfix.

This QA confirms that the module chart no longer fails during Plotly layout cleanup and that chart/control modes render usable chart output while preserving the Market Tape module flow.

## Branch

`qa/module-chart-control-mode-browser-qa-v1`

## Test URL

`module_runtime_smoke_harness.html?cb=module_chart_control_mode_qa_002`

## Related implementation branches

- `refactor/module-chart-control-mode-parity-v1`
- `fix/module-plotly-layout-axis-sanitizer-v1`

## Static validation already completed

- PASS -- `python scripts\smoke_module_plotly_renderer_parity.py`
- PASS -- `python scripts\smoke_module_market_tape_parity.py`
- PASS -- `python scripts\smoke_module_runtime_harness.py`
- PASS -- `python scripts\smoke_module_briefing_panel_parity.py`
- PASS -- `python scripts\smoke_module_store_control_state.py`
- PASS -- `python scripts\smoke_module_asset_payload_loading.py`
- PASS -- `python scripts\smoke_display_range_window_core.py`
- PASS -- `python scripts\smoke_fix26_dashboard.py`

## Manual browser QA summary

| Check | Result | Notes |
|---|---:|---|
| Harness loads | PASS | Module runtime smoke harness loads from GitHub Pages |
| Chart panel renders after #128 | PASS | Blank chart regression is resolved |
| No `Chart load failed` regression | PASS | Browser chart rendered after axis sanitizer |
| BTC Daily 3M candles render | PASS | Candlestick price chart rendered with overlays |
| Chart title resolves | PASS | Console returned `BTC • Daily • 3M` |
| Chart traces resolve | PASS | Console returned populated chart trace array |
| Price + Price Overlays mode renders | PASS | Price, overlap, sentiment/overlay context visible |
| Price Only mode renders | PASS | Overlay clutter reduced while chart stays usable |
| All Visible Traces mode renders | PASS | Context traces render without breaking layout |
| Sentiment ribbon mode renders | PASS | Sentiment/context traces visible where data exists |
| Attention / overlay marks render | PASS | Secondary context axis appears where needed |
| yaxis2 omitted when not needed | PASS | BTC default returned `undefined` for `layout.yaxis2`, which is expected |
| Market Tape active state remains synced | PASS | Kicker followed selected asset |
| Briefing remains synced | PASS | Briefing kicker followed selected asset/range |
| Asset dropdown remains synced | PASS | Console returned selected asset value |
| Selected detail remains populated | PASS | Rank/score/setup/tags/payload source remained visible |
| Detail deck remains populated | PASS | Screener receipt, archetype read, and indicator context remained visible |
| Event / confirmation timeline remains populated | PASS | Timeline stayed visible below detail deck |
| Filter chips remain visible | PASS | Chips persisted above card grid |
| Card grid remains rich | PASS | Rank, score, tags, and card copy remained visible |
| No production embed cutover | PASS | Production embeds remain untouched |
| No monolith edits | PASS | QA/report only |
| No payload regeneration | PASS | Generated payloads not included |

## Browser observations

### BTC -- Daily / 3M / Candles / Price + Price Overlays

The chart rendered successfully after the Plotly axis sanitizer.

Console probes confirmed:

```javascript
document.getElementById('chart')?.layout?.title?.text
// BTC • Daily • 3M

document.getElementById('chart')?.data?.map(t => ({name:t.name,type:t.type,mode:t.mode,yaxis:t.yaxis}))
// Returned 5 populated trace descriptors.

document.getElementById('chart')?.layout?.annotations?.map(a => a.text)
// Module renderer • 93 rows • candles / price_overlays

document.getElementById('chart')?.layout?.yaxis2
// undefined
```

`yaxis2` being undefined in this default view is expected because no secondary context axis is needed.

### DOGE -- Daily / 3M / Candles / Price + Price Overlays

DOGE rendered with price candles and overlap context. The Market Tape, selected detail, detail deck, timeline, and chart remained aligned.

### AVAX -- Daily / 1M / Overlay Marks / All Visible Traces

AVAX confirmed that context-heavy chart modes can render without triggering the previous Plotly `anchor` failure. The chart displayed multiple visible traces and a secondary context axis where needed.

### AVAX -- Daily / 1M / Price Only / Sentiment

AVAX price-only and sentiment-ribbon combinations rendered without breaking the chart panel. Overlay clutter was reduced in the expected mode while the chart stayed usable.

### MSFT -- Daily / 1M / Price Only / Sentiment / Full

MSFT confirmed that equity assets render under the same chart/control combinations. Price, sentiment/context traces, regime marks, selected detail, detail deck, and timeline all stayed visible.

## Regression fixed

The prior browser QA revealed:

```text
Chart load failed: TypeError: Cannot read properties of undefined (reading 'anchor')
```

After `fix/module-plotly-layout-axis-sanitizer-v1`, the chart panel now renders. The sanitizer prevents undefined axis layout keys from being passed into Plotly cleanup and explicitly anchors available axes.

## Production-readiness assessment

This is a successful browser QA pass for module chart/control mode parity.

The module is not yet approved for production cutover, but this removes a major blocker from the modular runtime path.

## Remaining gaps before cutover

- deeper side-by-side visual review against monolith technical chart stack
- production cutover rehearsal
- rollback runbook
- final public/member embed QA
- production cache-buster plan

## Recommended next branch

```text
qa/module-runtime-production-cutover-rehearsal-v1
```

Recommended scope:

```text
- document exact production cutover sequence
- document rollback sequence
- identify files that would change during embed cutover
- confirm no payload regeneration is required
- confirm public/member dashboards remain recoverable
- do not perform production cutover yet
```

## Non-goals

- no production embed cutover
- no monolith edits
- no payload regeneration
- no runtime code changes in this QA branch
