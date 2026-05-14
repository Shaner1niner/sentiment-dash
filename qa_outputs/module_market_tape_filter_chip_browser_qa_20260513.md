# Module Market Tape Filter Chip Browser QA

## Purpose

Validate browser behavior after `refactor/module-market-tape-filter-chip-parity-v1`.

This QA confirms that module Market Tape filter/category chips render above the card grid, filter the visible Market Tape cards by setup/tag category, and preserve selected-detail behavior, card richness, dropdown sync, briefing sync, and chart redraw behavior.

Production public/member embeds remain pinned to `dashboard_fix26_app.js`.

## Test URL

`module_runtime_smoke_harness.html?cb=module_market_tape_filter_chip_001`

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
| Filter chips render | PASS | Chips render above the Market Tape card grid |
| Filter chip counts render | PASS | Example observed: `All 27`, `Bullish 5`, `Bearish 9`, `Momentum 12`, `Watch 14`, `Confirmation 7`, `High Conviction 9`, `Quiet 9` |
| Bullish filter works | PASS | Visible grid reduced to Bullish-tagged cards such as BTC, ETH, GOOGL, XLE, SHOP |
| Quiet / High Conviction filter works | PASS | Visible grid reduced to quiet/high-conviction family names such as MSTR, AVAX, BNB, NVDA, TLT, NFLX, META, PLTR |
| Filter does not remove card richness | PASS | Cards still show rank, score, richer tags, and concise setup/watch copy |
| Selected-detail panel remains visible | PASS | Selected detail remains below the filtered card grid |
| Selected detail follows clicked asset | PASS | Example observed for MSTR after card click |
| Market Tape click updates asset dropdown | PASS | Console probe returned `MSTR` |
| Market Tape active state follows click | PASS | Console probe returned `MODULE MARKET TAPE - ACTIVE MSTR` |
| Briefing follows clicked asset | PASS | Console probe returned `MODULE BRIEFING - MSTR - D - 3M` |
| Chart follows clicked asset/range | PASS | Console probe returned `MSTR - Daily - 3M` |
| Switching chips does not break card click behavior | PASS | GOOGL and MSTR click logs observed after chip filtering |
| No `[object Object]` asset sync regression | PASS | Asset sync logs remained normalized |
| No blocking red console errors | PASS | No runtime-blocking Market Tape, briefing, control-sync, or chart errors observed |
| Public production dashboard remains stable | PASS | Production embeds remain on monolith |
| Member production dashboard remains stable | PASS | Production embeds remain on monolith |

## Browser observations

The filter chips now provide a useful category layer above the compact Market Tape card grid.

Observed chip set:

```text
All 27
Bullish 5
Bearish 9
Momentum 12
Watch 14
Confirmation 7
High Conviction 9
Quiet 9
```

Observed Bullish-filter cards:

- `#5 BTC`
- `#8 ETH`
- `#14 GOOGL`
- `#24 XLE`
- `#19 SHOP`

Observed Quiet / High Conviction-style filtered cards:

- `#13 MSTR`
- `#1 AVAX`
- `#3 BNB`
- `#10 NVDA`
- `#12 TLT`
- `#11 NFLX`
- `#17 META`
- `#16 PLTR`

Observed console probes after selecting MSTR:

```javascript
[...document.querySelectorAll('.moduleMarketTapeFilterChip')].map(x => x.innerText)
// ["All 27", "Bullish 5", "Bearish 9", "Momentum 12", "Watch 14", "Confirmation 7", "High Conviction 9", "Quiet 9"]

document.querySelector('.moduleMarketTapeSelectedDetail')?.innerText
// "SELECTED MARKET TAPE DETAIL\nRANK / SCORE\n#13 MSTR - 100\nSETUP READ\ndoes not match a high-conviction archetype; monitor current signal family scores.\nWATCH ITEM\nMSTR does not match a high-conviction archetype; monitor current signal family scores.\nTAGS\nWatch / Quiet / High Conviction\nPAYLOAD SOURCE\nscreener / archetype / indicators"

document.querySelector('.moduleMarketTapeKicker')?.innerText
// "MODULE MARKET TAPE - ACTIVE MSTR"

document.getElementById('asset')?.value
// "MSTR"

document.querySelector('.moduleBriefingKicker')?.innerText
// "MODULE BRIEFING - MSTR - D - 3M"

document.getElementById('chart')?.layout?.title?.text
// "MSTR - Daily - 3M"
```

## Remaining known gaps

- Filter chips are category-only; full production chip groups/filter stack parity remains future work.
- Selected-detail text is still compact and sometimes repeats card copy.
- Full production Market Tape detail deck/indicator mini-deck remains future parity work.
- Event timeline parity remains out of scope.
- Production cutover is still intentionally deferred.

## Recommendation

Treat this QA as a clean browser pass for the module Market Tape filter-chip slice.

Recommended next branch:

```text
refactor/module-market-tape-detail-deck-parity-v1
```

Recommended scope:

```text
- add richer selected detail/deck sections from screener, archetype, and indicator fields
- preserve filter chips
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
