# Module Market Tape Card Copy Browser QA

## Purpose

Validate browser behavior after `refactor/module-market-tape-card-copy-source-map-v1`.

This QA confirms that module Market Tape cards now use richer card body/tag copy from available source fields instead of the previous generic `Summary` / `Monitor` fallback, while preserving ranks, scores, active-card highlighting, asset dropdown sync, briefing sync, and chart redraw behavior.

Production public/member embeds remain pinned to `dashboard_fix26_app.js`.

## Test URL

`module_runtime_smoke_harness.html?cb=module_market_tape_card_copy_source_map_001`

## Static validation

- PASS — `python scripts\smoke_module_market_tape_parity.py`
- PASS — `python scripts\smoke_module_runtime_harness.py`
- PASS — `python scripts\smoke_module_briefing_panel_parity.py`
- PASS — `python scripts\smoke_module_store_control_state.py`
- PASS — `python scripts\smoke_module_plotly_renderer_parity.py`
- PASS — `python scripts\smoke_module_asset_payload_loading.py`
- PASS — `python scripts\smoke_display_range_window_core.py`
- PASS — `python scripts\smoke_fix26_dashboard.py`

## Manual browser QA

| Check | Result | Notes |
|---|---:|---|
| Harness page loads | PASS | Non-production module harness loads from GitHub Pages |
| Market Tape cards render | PASS | Cards render between briefing panel and chart |
| Ranks render | PASS | Examples observed: `#5 BTC`, `#15 COIN`, `#2 DOGE`, `#19 SHOP` |
| Scores render | PASS | Examples observed: `100`, `98.4`, `92` |
| Card body copy is richer than `Summary` | PASS | Cards now show asset-specific watch/setup copy |
| Tags are richer than `Monitor` | PASS | Examples observed: `Bullish`, `Momentum`, `Repair`, `Confirmation`, `Watch`, `Quiet`, `High Conviction`, `Sentiment` |
| Active Market Tape headline is richer | PASS | Examples observed: BTC/SHOP sentiment MACD repair headline, DOGE recent-watch headline |
| Active Market Tape subcopy is richer | PASS | Active subcopy repeats meaningful setup/watch sentence |
| Market Tape click updates asset dropdown | PASS | Console probe returned selected asset such as `SHOP` |
| Market Tape active state follows click | PASS | Console probe returned `MODULE MARKET TAPE - ACTIVE SHOP` |
| Briefing follows clicked asset | PASS | Console probe returned `MODULE BRIEFING • SHOP • W • 6M` |
| Chart follows clicked asset/range/frequency | PASS | Console probe returned `SHOP • Weekly • 6M` |
| Range/frequency changes still redraw | PASS | Weekly / 6M and Daily / 1Y examples observed |
| No `[object Object]` asset sync logs | PASS | Prior object-log issue did not recur |
| No blocking red console errors | PASS | No runtime-blocking Market Tape, briefing, control-sync, or chart errors observed |
| Public production dashboard remains stable | PASS | Production embeds remain on monolith |
| Member production dashboard remains stable | PASS | Production embeds remain on monolith |

## Browser observations

This QA confirms a meaningful visual/card-copy improvement over the previous generic card shell.

Observed improvements:

- Card bodies no longer mostly display `Summary`.
- Card tags no longer mostly display only `Monitor`.
- Active card headline now carries setup/watch copy.
- Active card subcopy is asset-specific.
- Scores and ranks remain visible.
- Clicking a Market Tape card still updates the dropdown, briefing, active Market Tape state, and chart.

Observed examples:

- BTC: `shows sentiment MACD repair before price momentum has fully confirmed.`
- COIN: `shows weakening sentiment momentum while price momentum is not yet fully broken.`
- DOGE: `has multiple recent watch candidates but no recent confirmed alert.`
- SHOP: `shows sentiment MACD repair before price momentum has fully confirmed.`
- Tags: `Bullish`, `Momentum`, `Repair`, `Confirmation`, `Watch`, `Quiet`, `High Conviction`, `Sentiment`

## Console probes used

```javascript
[...document.querySelectorAll('.moduleMarketTapeItem')].slice(0, 8).map(x => x.innerText)
document.querySelector('.moduleMarketTapeKicker')?.innerText
document.getElementById('asset')?.value
document.querySelector('.moduleBriefingKicker')?.innerText
document.getElementById('chart')?.layout?.title?.text
```

Observed SHOP probe results:

```javascript
document.querySelector('.moduleMarketTapeKicker')?.innerText
// "MODULE MARKET TAPE - ACTIVE SHOP"

document.getElementById('asset')?.value
// "SHOP"

document.querySelector('.moduleBriefingKicker')?.innerText
// "MODULE BRIEFING • SHOP • W • 6M"

document.getElementById('chart')?.layout?.title?.text
// "SHOP • Weekly • 6M"
```

## Remaining known gaps

- Some card copy is still compact and repeated across related assets.
- Full production Market Tape filter chips/detail deck/indicator mini-deck remain future parity work.
- Event timeline parity remains out of scope.
- Production cutover is still intentionally deferred.

## Recommendation

Treat this QA as a clean browser pass for the module Market Tape card-copy/tag source-map slice.

Recommended next branch:

```text
refactor/module-market-tape-selected-detail-v1
```

Recommended scope:

```text
- add a selected Market Tape detail panel below/near card grid
- surface richer selected setup fields without cluttering every card
- preserve card ranking/tag/copy behavior
- preserve click-to-dropdown sync
- preserve briefing/chart redraw
- no production cutover
- no monolith edits
- no payload regeneration
```

## Non-goals

- no production embed cutover
- no monolith edits
- no payload regeneration
