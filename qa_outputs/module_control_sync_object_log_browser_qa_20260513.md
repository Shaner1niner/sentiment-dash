# Module Control Sync Object Log Browser QA

## Purpose

Validate browser behavior after `fix/module-control-sync-object-log-normalization-v1`.

This QA confirms that Market Tape card clicks still synchronize the native asset dropdown, Market Tape active state, briefing panel, and chart context, while removing the prior transient `[object Object]` asset sync console messages.

Production public/member embeds remain pinned to `dashboard_fix26_app.js`.

## Test URL

`module_runtime_smoke_harness.html?cb=module_control_sync_object_log_001`

## Static validation

- PASS — `python scripts\smoke_module_store_control_state.py`
- PASS — `python scripts\smoke_module_market_tape_parity.py`
- PASS — `python scripts\smoke_module_runtime_harness.py`
- PASS — `python scripts\smoke_module_briefing_panel_parity.py`
- PASS — `python scripts\smoke_module_plotly_renderer_parity.py`
- PASS — `python scripts\smoke_module_asset_payload_loading.py`
- PASS — `python scripts\smoke_display_range_window_core.py`
- PASS — `python scripts\smoke_fix26_dashboard.py`

## Manual browser QA

| Check | Result | Notes |
|---|---:|---|
| Harness page loads | PASS | Non-production module harness loads from GitHub Pages |
| Market Tape cards render | PASS | Cards render with rank/score display |
| Clicking AMZN updates module context | PASS | Header, dropdown, briefing, Market Tape, and chart show AMZN |
| Clicking DOGE updates module context | PASS | Header, dropdown, briefing, Market Tape, and chart show DOGE |
| Clicking AVAX updates module context | PASS | Header, dropdown, briefing, Market Tape, and chart show AVAX |
| Asset dropdown follows clicked asset | PASS | Console probe returned `AVAX` after AVAX click |
| Market Tape active state follows clicked asset | PASS | Console probe returned `MODULE MARKET TAPE - ACTIVE AVAX` |
| Briefing follows clicked asset | PASS | Console probe returned `MODULE BRIEFING • AVAX • D • 3M` |
| Chart follows clicked asset | PASS | Console probe returned `AVAX • Daily • 3M` |
| Console object-log normalization works | PASS | No `asset = [OBJECT OBJECT]` sync messages observed |
| Normal ticker sync logs remain | PASS | Console shows clean ticker logs such as `asset = DOGE` and `asset = AVAX` |
| No blocking red console errors | PASS | No runtime-blocking Market Tape, briefing, control-sync, or chart errors observed |
| Public production dashboard remains stable | PASS | Production embeds remain on monolith |
| Member production dashboard remains stable | PASS | Production embeds remain on monolith |

## Browser observations

This QA confirms the object-shaped sync-log issue is resolved while preserving the functional control-sync fix.

Observed clean sync sequence:

```text
Control element synced: asset = BTC
Control state changed: asset = AMZN
Control state changed: asset = COIN
Market Tape caught click for: DOGE
Control element synced: asset = DOGE
Market Tape caught click for: AVAX
Control element synced: asset = AVAX
```

Observed console probes after selecting AVAX:

```javascript
document.getElementById('asset')?.value
// "AVAX"

document.querySelector('.moduleMarketTapeKicker')?.innerText
// "MODULE MARKET TAPE - ACTIVE AVAX"

document.querySelector('.moduleBriefingKicker')?.innerText
// "MODULE BRIEFING • AVAX • D • 3M"

document.getElementById('chart')?.layout?.title?.text
// "AVAX • Daily • 3M"
```

## Remaining known gaps

- Market Tape card bodies still often render `Summary`.
- Market Tape tags still often render `Monitor`.
- Full production Market Tape filter chips/detail deck/indicator mini-deck remain future parity work.
- Event timeline parity remains out of scope.

## Recommendation

Treat this QA as a clean confirmation of the object-log normalization polish.

Recommended next branch:

```text
refactor/module-market-tape-card-copy-source-map-v1
```

Recommended scope:

```text
- map richer card body copy from available screener / archetype / indicator fields
- reduce generic Summary card body fallback
- preserve rank/score mapping
- preserve control sync behavior
- no production cutover
- no monolith edits
- no payload regeneration
```

## Non-goals

- no production embed cutover
- no monolith edits
- no payload regeneration
