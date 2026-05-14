# Module Market Tape Event Timeline Browser QA

## Purpose

Validate browser behavior after `refactor/module-market-tape-event-timeline-shell-v1`.

This QA confirms that the module Market Tape selected-detail area now includes an Event / confirmation timeline below the detail deck. It also confirms that filter chips, card richness, selected-detail behavior, detail-deck behavior, dropdown sync, briefing sync, and chart redraw behavior still work.

Production public/member embeds remain pinned to `dashboard_fix26_app.js`.

## Test URL

`module_runtime_smoke_harness.html?cb=module_market_tape_event_timeline_001`

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
| Event / confirmation timeline renders | PASS | Timeline renders below the detail deck |
| Timeline follows selected asset | PASS | AVAX, BNB, and AMD examples reviewed |
| Timeline shows setup context | PASS | Examples include `Setup read` entries |
| Timeline shows confirmation/watch context | PASS | Examples include `Confirmation watch` and missing-confirmation copy |
| Timeline shows receipt context | PASS | Examples include `Receipt context` with close / review context |
| Selected-detail panel remains visible | PASS | Rank/score, setup read, watch item, tags, and payload source still render |
| Detail deck remains visible | PASS | Screener receipt, Archetype read, and Indicator context cards still render |
| Filter chips remain visible | PASS | Chips still show counts such as All 27, Bullish 5, Bearish 9, Momentum 12, Watch 14, Confirmation 7, High Conviction 9, Quiet 9 |
| Filter chips still work | PASS | High Conviction / Bearish-style filtered examples reviewed |
| Card richness remains intact | PASS | Cards still show rank, score, richer tags, and concise setup/watch copy |
| Market Tape click updates asset dropdown | PASS | Console probe returned clicked asset such as `AMD` |
| Market Tape active state follows click | PASS | Console probe returned `MODULE MARKET TAPE - ACTIVE AMD` |
| Briefing follows clicked asset | PASS | Console probe returned `MODULE BRIEFING - AMD - D - YTD` |
| Chart follows clicked asset/range | PASS | Visual chart title showed `AMD - Daily - YTD` |
| Range changes do not break timeline | PASS | AMD validated with display range `YTD` |
| No `[object Object]` asset sync regression | PASS | Asset sync logs remained normalized |
| No app-blocking runtime errors observed | PASS | One red console error was caused by a malformed/manual pasted console probe, not by module runtime execution |
| Public production dashboard remains stable | PASS | Production embeds remain on monolith |
| Member production dashboard remains stable | PASS | Production embeds remain on monolith |

## Browser observations

The event timeline adds a compact chronological/context layer beneath the selected-detail and detail-deck sections.

Observed AVAX timeline:

- `Setup read`
- `Confirmation watch`
- `Receipt context`
- Asset label: `AVAX`

Observed BNB timeline:

- `Setup read`
- `Confirmation watch`
- `Receipt context`
- Asset label: `BNB`

Observed AMD timeline:

- `Price breakdown confirmation still missing`
- Meta: `watch context`
- Asset label: `AMD`

Observed console probes after selecting AMD:

```javascript
document.querySelector('.moduleMarketTapeEventTimeline')?.innerText
// "EVENT / CONFIRMATION TIMELINE\nAMD\n1\nPrice breakdown confirmation still missing\nwatch context\nPrice breakdown confirmation still missing"

[...document.querySelectorAll('.moduleMarketTapeTimelineItem')].map(x => x.innerText)
// ["1\nPrice breakdown confirmation still missing\nwatch context\nPrice breakdown confirmation still missing"]

document.querySelector('.moduleMarketTapeDetailDeck')?.innerText
// Detail deck remained populated with Screener receipt, Archetype read, and Indicator context.

document.querySelector('.moduleMarketTapeSelectedDetail')?.innerText
// Selected detail remained populated with rank/score, setup read, watch item, tags, payload source, detail deck, and timeline.

[...document.querySelectorAll('.moduleMarketTapeFilterChip')].map(x => x.innerText)
// ["All 27", "Bullish 5", "Bearish 9", "Momentum 12", "Watch 14", "Confirmation 7", "High Conviction 9", "Quiet 9"]

document.querySelector('.moduleMarketTapeKicker')?.innerText
// "MODULE MARKET TAPE - ACTIVE AMD"

document.getElementById('asset')?.value
// "AMD"

document.querySelector('.moduleBriefingKicker')?.innerText
// "MODULE BRIEFING - AMD - D - YTD"
```

## Console note

A red console error was observed after a malformed manual probe was pasted without separators:

```text
Uncaught TypeError: Cannot read properties of undefined (reading 'getElementById')
```

This was caused by concatenating probe expressions in the console, not by app runtime execution. After running valid individual probes, briefing and chart state remained accessible and synced to the selected asset.

## Remaining known gaps

- Timeline shell is compact and currently depends on available payload fields.
- Full production timeline/event detail parity remains future work.
- Event chronology/date quality may be sparse for some assets.
- Production cutover is still intentionally deferred.

## Recommendation

Treat this QA as a clean browser pass for the module Market Tape event/timeline shell slice.

Recommended next branch:

```text
refactor/module-market-tape-timeline-copy-polish-v1
```

Recommended scope:

```text
- polish event/timeline labels and fallback copy
- reduce repeated selected-detail/timeline text where richer fields are sparse
- preserve filter chips
- preserve selected-detail, detail-deck, and timeline behavior
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
