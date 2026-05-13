# Module Runtime Browser QA

## Purpose

Validate the non-production module runtime harness before any future module cutover work.

Production public/member embeds remain pinned to `dashboard_fix26_app.js`.

## Test URL

`module_runtime_smoke_harness.html?cb=module_runtime_smoke_harness_002`

## Static validation

- PASS — `python scripts\smoke_module_runtime_harness.py`
- PASS — `python scripts\smoke_module_plotly_renderer_parity.py`
- PASS — `python scripts\smoke_module_asset_payload_loading.py`
- PASS — `python scripts\smoke_module_store_control_state.py`
- PASS — `python scripts\smoke_display_range_window_core.py`
- PASS — `python scripts\smoke_fix26_dashboard.py`

## Manual browser QA

| Check | Result | Notes |
|---|---:|---|
| Harness page loads | PASS | Non-production harness loads from GitHub Pages |
| BTC initial chart renders | PASS | Real candlestick rows render |
| Initial chart is not blank | PASS | Plotly chart renders with price and sentiment traces |
| Initial state can render Daily / 3M | PASS | Chart title and rows update by selected range |
| Module renderer row annotation is visible | PASS | Example: `Module renderer • 32 rows` |
| BTC -> ETH asset switch redraws | PASS | ETH renders successfully |
| ETH -> SOL or other asset switch redraws | PASS | Multiple assets render successfully |
| 3M -> 6M range switch redraws | PASS | BTC/ETH examples rendered wider range |
| 6M -> 1Y range switch redraws | PASS | ETH 1Y rendered successfully |
| 1M range switch redraws | PASS | NVDA 1M rendered successfully |
| Candlestick chart renders | PASS | Candle traces visible |
| Chart data exists in Plotly object | PASS | Console probe returned chart traces |
| No blocking red console errors | PASS | Only observed 404 was favicon, which is non-blocking |
| Public production dashboard remains stable | PASS | Production embeds remain on monolith |
| Member production dashboard remains stable | PASS | Production embeds remain on monolith |

## Console probes

```javascript
document.getElementById('chart')?.data?.map(t => t.name)
// Example: ['Price', 'Sentiment MA']

document.getElementById('chart')?.layout?.title?.text
// Example: 'NVDA • Daily • 1M'

document.getElementById('chart')?.layout?.annotations?.map(a => a.text)
// Example: ['Module renderer • 32 rows']

document.getElementById('chart')?.data?.length
// Example: 2
```

## Observed gaps

- Header feedback label can show `undefined` after asset changes.
  - Likely cause: `dashboard_main.js` expects `assetChanged` payload shape `{ value }`, while Store emits a plain asset string.
  - Chart redraw still works because Store state is already updated.
  - Recommended fix: normalize `assetChanged` event handling in the module runtime.

- Favicon 404 appears in console.
  - Non-blocking.
  - Not related to module chart behavior.

- Module harness currently validates price/sentiment chart rendering only.
  - Briefing panel, market tape parity, event timeline parity, and full production layout parity remain future work.

## Recommendation

Continue module parity work, but do not cut over production embeds yet.

Recommended next branch:

```text
fix/module-asset-feedback-event-shape-v1
```

Then continue:

```text
refactor/module-briefing-panel-parity-v1
refactor/module-market-tape-parity-v1
refactor/module-event-timeline-parity-v1
qa/module-cutover-readiness-audit-v1
```

## Non-goals

- no production embed cutover
- no monolith edits
- no payload regeneration
