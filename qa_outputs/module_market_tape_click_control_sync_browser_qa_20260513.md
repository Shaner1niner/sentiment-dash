# Module Market Tape Click Control Sync Browser QA

## Purpose

Validate browser behavior after `fix/module-market-tape-click-control-sync-v1`.

This QA verifies that Market Tape card clicks now synchronize the native asset dropdown with the module Store state, briefing panel, Market Tape active state, and chart title.

Production public/member embeds remain pinned to `dashboard_fix26_app.js`.

## Test URL

`module_runtime_smoke_harness.html?cb=module_market_tape_click_control_sync_001`

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
| Clicking DOGE card updates asset dropdown | PASS | Dropdown shows `DOGE` |
| Clicking AVAX card updates asset dropdown | PASS | Dropdown shows `AVAX` |
| Clicking ETH card updates asset dropdown | PASS | Dropdown shows `ETH` |
| Clicking NVDA card updates asset dropdown | PASS | Dropdown shows `NVDA` |
| Market Tape active state follows click | PASS | Example: `MODULE MARKET TAPE - ACTIVE NVDA` |
| Briefing follows clicked asset | PASS | Example: `MODULE BRIEFING • NVDA • D • 3M` |
| Chart follows clicked asset | PASS | Example: `NVDA • Daily • 3M` |
| Console confirms control sync | PASS | Console logs `Control element synced: asset = NVDA` and other clicked tickers |
| No blocking red console errors | PASS | No runtime-blocking Market Tape, briefing, control-sync, or chart errors observed |
| Public production dashboard remains stable | PASS | Production embeds remain on monolith |
| Member production dashboard remains stable | PASS | Production embeds remain on monolith |

## Browser observations

This QA confirms the prior control-sync bug is fixed.

Before the fix, clicking a Market Tape card could update the module context and chart while the asset dropdown stayed on the prior ticker. After the fix, Market Tape card clicks update all of the following together:

- asset dropdown
- module header asset label
- Market Tape active asset label
- active Market Tape card highlight
- reviewed briefing context
- Plotly chart title/context

Observed examples:

- DOGE selected successfully
- AVAX selected successfully
- ETH selected successfully
- NVDA selected successfully

Console probe results for NVDA:

```javascript
document.getElementById('asset')?.value
// "NVDA"

document.querySelector('.moduleMarketTapeKicker')?.innerText
// "MODULE MARKET TAPE - ACTIVE NVDA"

document.querySelector('.moduleBriefingKicker')?.innerText
// "MODULE BRIEFING • NVDA • D • 3M"

document.getElementById('chart')?.layout?.title?.text
// "NVDA • Daily • 3M"
```

## Minor non-blocking observation

Console logs include transient object-shaped asset sync messages such as:

```text
Control element synced: asset = [OBJECT OBJECT]
```

The final DOM/control state still resolves correctly to the clicked ticker. This is not blocking, but a future polish branch could normalize log payloads or suppress object-shaped intermediate sync messages.

## Remaining known gaps

- Market Tape card bodies still often render `Summary`.
- Market Tape tags still often render `Monitor`.
- Full production Market Tape filter chips/detail deck/indicator mini-deck remain future parity work.
- Event timeline parity remains out of scope.

## Recommendation

Treat this QA as a successful confirmation of the Market Tape click-to-dropdown control sync fix.

Recommended next branches:

```text
fix/module-control-sync-object-log-normalization-v1
refactor/module-market-tape-card-copy-source-map-v1
refactor/module-market-tape-selected-detail-v1
refactor/module-event-timeline-parity-v1
```

## Non-goals

- no production embed cutover
- no monolith edits
- no payload regeneration
