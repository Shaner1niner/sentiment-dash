# Module Market Tape Score Field Browser QA

## Purpose

Validate module Market Tape browser behavior after score/rank field mapping support.

Production public/member embeds remain pinned to `dashboard_fix26_app.js`.

## Test URL

`module_runtime_smoke_harness.html?cb=module_market_tape_score_mapping_001`

## Static validation

- PASS — `python scripts\smoke_module_market_tape_parity.py`
- PASS — `python scripts\smoke_module_runtime_harness.py`
- PASS — `python scripts\smoke_module_briefing_panel_parity.py`
- PASS — `python scripts\smoke_module_plotly_renderer_parity.py`
- PASS — `python scripts\smoke_module_asset_payload_loading.py`
- PASS — `python scripts\smoke_module_store_control_state.py`
- PASS — `python scripts\smoke_display_range_window_core.py`
- PASS — `python scripts\smoke_fix26_dashboard.py`

## Manual browser QA

| Check | Result | Notes |
|---|---:|---|
| Harness page loads | PASS | Non-production module harness loads from GitHub Pages |
| Module Market Tape panel appears | PASS | Panel renders below briefing panel and above chart |
| Market Tape card count is nonzero | PASS | Panel shows `27 assets` |
| Market Tape scores no longer render as generic zeroes | PASS | Cards now show mapped score values, e.g. `100` and `80.9` |
| Rank/ticker labels render | PASS | Cards show labels such as `#6 BTC`, `#1 AVAX`, `#8 ETH`, `#16 PLTR` |
| Active asset card highlights correctly | PASS | Active selected card receives highlighted treatment |
| Clicking cards updates active asset | PASS | Console shows Market Tape click events for BTC, ETH, NVDA, BNB, DOGE, AVAX, PLTR |
| Asset dropdown follows Market Tape click | PASS | Example: PLTR click updates asset dropdown to `PLTR` |
| Header asset feedback updates | PASS | Header changes to clicked asset |
| Briefing panel follows clicked asset | PASS | Example: PLTR briefing updates to `MODULE BRIEFING • PLTR • D • 3M` |
| Chart follows clicked asset | PASS | Example: chart title updates to `PLTR • Daily • 3M` |
| Range changes still redraw chart | PASS | Examples include 3M and 1Y views |
| No blocking red console errors | PASS | No runtime-blocking Market Tape, briefing, or chart errors observed |
| Public production dashboard remains stable | PASS | Production embeds remain on monolith |
| Member production dashboard remains stable | PASS | Production embeds remain on monolith |

## Visual comparison notes versus production monolith

The score-field mapping branch improved the module Market Tape from the prior shell state:

- cards no longer show generic `0` scores
- cards now show rank/ticker labels
- active Market Tape card selection works
- clicking cards updates asset, briefing, and chart context
- chart and briefing remain synchronized after Market Tape clicks

Remaining gaps compared with the production monolith:

- Many module card scores currently normalize to `100`, so score spread/ranking still needs refinement.
- Card body copy still often renders as generic `Summary`.
- Tags remain basic, usually `Monitor`, rather than richer production states such as bullish, high-quality, conflict, quiet/watch, sentiment repair, or fresh confirmed.
- Module Market Tape still does not include the production filter-chip deck.
- Module Market Tape still does not include the selected-candidate detail deck.
- Module Market Tape still does not include the production mini indicator score deck.
- Module chart path still does not include full monolith timing-pane / multi-indicator parity.
- Event timeline parity remains out of scope.

## Console probes used

```javascript
document.querySelectorAll('.moduleMarketTapeItem').length
[...document.querySelectorAll('.moduleMarketTapeItem')].slice(0, 8).map(x => x.innerText)
document.querySelector('.moduleMarketTapeKicker')?.innerText
document.querySelector('.moduleMarketTapePill')?.innerText
document.getElementById('asset')?.value
document.querySelector('.moduleBriefingKicker')?.innerText
document.getElementById('chart')?.layout?.title?.text
```

## Recommendation

Treat the score/rank mapping as a successful incremental improvement. It resolves the prior generic zero-score issue and confirms Market Tape click-to-context wiring, but it is not yet full production Market Tape parity.

Recommended next branches:

```text
refactor/module-market-tape-card-richness-v1
refactor/module-market-tape-selected-detail-v1
refactor/module-event-timeline-parity-v1
qa/module-cutover-readiness-audit-v1
```

## Non-goals

- no production embed cutover
- no monolith edits
- no payload regeneration
