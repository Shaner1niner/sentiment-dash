# Module Market Tape Selected Detail Browser QA

## Purpose

Validate browser behavior after `refactor/module-market-tape-selected-detail-v1`.

This QA confirms that the module Market Tape selected-detail panel renders below the card grid, follows the active/clicked asset, and preserves existing Market Tape card richness, dropdown sync, briefing sync, and chart redraw behavior.

Production public/member embeds remain pinned to `dashboard_fix26_app.js`.

## Test URL

`module_runtime_smoke_harness.html?cb=module_market_tape_selected_detail_001`

## Static validation

- PASS -- `python scripts\smoke_module_market_tape_parity.py`
- PASS -- `python scripts\smoke_module_runtime_harness.py`
- PASS -- `python scripts\smoke_module_briefing_panel_parity.py`
- PASS -- `python scripts\smoke_module_store_control_state.py`
- PASS -- `python scripts\smoke_module_plotly_renderer_parity.py`
- PASS -- `python scripts\smoke_module_asset_payload_loading.py`
- PASS -- `python scripts\smoke_display_range_window_core.py`
- PASS -- `python scripts\smoke_fix26_dashboard.py`

## Manual browser QA

| Check | Result | Notes |
|---|---:|---|
| Harness page loads | PASS | Non-production module harness loads from GitHub Pages |
| Selected-detail panel renders | PASS | Panel appears below the Market Tape card grid |
| Selected detail follows NVDA | PASS | Detail panel shows `#10 NVDA - 100` and NVDA watch/setup fields |
| Selected detail follows DOGE | PASS | Detail panel shows `#2 DOGE - 100` and DOGE watch/setup fields |
| Selected detail follows AVAX | PASS | Detail panel shows `#1 AVAX - 100` and AVAX watch/setup fields |
| Selected detail includes rank/score | PASS | `RANK / SCORE` row renders for active asset |
| Selected detail includes setup read | PASS | `SETUP READ` row renders for active asset |
| Selected detail includes watch item | PASS | `WATCH ITEM` row renders for active asset |
| Selected detail includes tags | PASS | Examples: `Watch / Quiet / High Conviction`, `Confirmation / Watch` |
| Selected detail includes payload source | PASS | `screener / archetype / indicators` row renders |
| Card grid remains compact | PASS | Cards still show rank, score, tags, and concise copy |
| Card copy/tag richness is preserved | PASS | Cards still show richer labels instead of generic `Summary` / `Monitor` |
| Market Tape click updates asset dropdown | PASS | Console probe returned clicked asset such as `AVAX` |
| Market Tape active state follows click | PASS | Console probe returned `MODULE MARKET TAPE - ACTIVE AVAX` |
| Briefing follows clicked asset | PASS | Console probe returned `MODULE BRIEFING - AVAX - D - 1Y` |
| Chart follows clicked asset/range | PASS | Console probe returned `AVAX - Daily - 1Y` |
| Control toggles still work | PASS | Chart type, scale mode, ribbon, and bands controls continued logging cleanly |
| No `[object Object]` asset sync regression | PASS | Asset sync logs remained normalized |
| No blocking red console errors | PASS | No runtime-blocking Market Tape, briefing, control-sync, or chart errors observed |
| Public production dashboard remains stable | PASS | Production embeds remain on monolith |
| Member production dashboard remains stable | PASS | Production embeds remain on monolith |

## Browser observations

The selected-detail panel is now a useful middle layer between the compact card grid and the full chart area.

Observed selected-detail examples:

- NVDA: `#10 NVDA - 100`; setup/watch text: `does not match a high-conviction archetype; monitor current signal family scores.`
- DOGE: `#2 DOGE - 100`; setup/watch text: `has multiple recent watch candidates but no recent confirmed alert.`
- AVAX: `#1 AVAX - 100`; setup/watch text: `does not match a high-conviction archetype; monitor current signal family scores.`
- Payload source row: `screener / archetype / indicators`

Observed console probes after selecting AVAX:

```javascript
document.querySelector('.moduleMarketTapeSelectedDetail')?.innerText
// "SELECTED MARKET TAPE DETAIL\nRANK / SCORE\n#1 AVAX - 100\nSETUP READ\ndoes not match a high-conviction archetype; monitor current signal family scores.\nWATCH ITEM\nAVAX does not match a high-conviction archetype; monitor current signal family scores.\nTAGS\nWatch / Quiet / High Conviction\nPAYLOAD SOURCE\nscreener / archetype / indicators"

document.querySelector('.moduleMarketTapeKicker')?.innerText
// "MODULE MARKET TAPE - ACTIVE AVAX"

document.getElementById('asset')?.value
// "AVAX"

document.querySelector('.moduleBriefingKicker')?.innerText
// "MODULE BRIEFING - AVAX - D - 1Y"

document.getElementById('chart')?.layout?.title?.text
// "AVAX - Daily - 1Y"
```

## Remaining known gaps

- Selected-detail text is useful but still compact and sometimes repeats card copy.
- Full production Market Tape filter chips/detail deck/indicator mini-deck remain future parity work.
- Event timeline parity remains out of scope.
- Production cutover is still intentionally deferred.

## Recommendation

Treat this QA as a clean browser pass for the module Market Tape selected-detail slice.

Recommended next branch:

```text
refactor/module-market-tape-filter-chip-parity-v1
```

Recommended scope:

```text
- add module Market Tape filter chips / category controls
- preserve selected-detail panel behavior
- preserve card rank/score/tag/copy behavior
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
