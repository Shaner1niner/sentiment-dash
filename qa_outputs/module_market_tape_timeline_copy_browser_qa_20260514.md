# Module Market Tape Timeline Copy Browser QA

## Purpose

Validate browser behavior after `refactor/module-market-tape-timeline-copy-polish-v1`.

This QA confirms that the module Market Tape event / confirmation timeline now uses more useful fallback copy where richer fields are available, while preserving the existing Market Tape module behavior.

Production public/member embeds remain pinned to `dashboard_fix26_app.js`.

## Test URL

`module_runtime_smoke_harness.html?cb=module_market_tape_timeline_copy_001`

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
| Timeline renders below detail deck | PASS | Event / confirmation timeline remains visible |
| Timeline copy is less repetitive | PASS | Setup and receipt rows now use richer fallback context where available |
| Setup row uses richer fields | PASS | Example: BNB shows `Direction: Bullish; Attention priority: 68.9` |
| Receipt row uses richer fields | PASS | Example: BNB shows `Attention priority 68.9; direction score 73.4; Bullish` |
| Confirmation rows remain useful | PASS | DOGE, ETH, and SOL show missing-confirmation style timeline rows |
| Selected-detail panel remains visible | PASS | Rank/score, setup read, watch item, tags, and payload source still render |
| Detail deck remains visible | PASS | Screener receipt, Archetype read, and Indicator context still render |
| Filter chips remain visible | PASS | Chips still show All, Bullish, Bearish, Momentum, Watch, Confirmation, High Conviction, and Quiet buckets |
| Filter chips still work | PASS | Bullish / Confirmation / Momentum-style filtered sets reviewed |
| Card richness remains intact | PASS | Cards still show rank, score, richer tags, and concise setup/watch copy |
| Market Tape click updates asset dropdown | PASS | Console probe returned clicked asset such as `ETH` |
| Market Tape active state follows click | PASS | Console probe returned `MODULE MARKET TAPE - ACTIVE ETH` |
| Briefing follows clicked asset | PASS | Console probe returned `MODULE BRIEFING - ETH - D - 6M` |
| Chart follows clicked asset/range | PASS | Console probe returned `ETH - Daily - 6M` |
| Range/frequency changes do not break timeline | PASS | 1Y and 6M examples reviewed |
| No `[object Object]` asset sync regression | PASS | Asset sync logs remained normalized |
| No app-blocking runtime errors observed | PASS | No blocking runtime errors observed during valid probes |
| Public production dashboard remains stable | PASS | Production embeds remain on monolith |
| Member production dashboard remains stable | PASS | Production embeds remain on monolith |

## Browser observations

### BNB

Timeline copy shows the desired richer fallback behavior:

- Setup read: `Direction: Bullish; Attention priority: 68.9`
- Confirmation watch: `does not match a high-conviction archetype; monitor current signal family scores.`
- Receipt context: `Attention priority 68.9; direction score 73.4; Bullish`

The selected detail and detail deck remained populated, and the chart followed the selected asset/range.

### DOGE

DOGE still renders a compact event / confirmation timeline:

- Confirmation watch
- Confirmation meta
- `Needs confirmed event, volume, or volatility gate`

The timeline remains useful when richer setup/receipt fallback fields are sparse or when the source payload provides an explicit confirmation gate.

### ETH

ETH renders a focused confirmation row:

- Confirmation watch
- Confirmation meta
- `Price MACD confirmation still missing`

Console probes confirmed:

```javascript
document.querySelector('.moduleMarketTapeEventTimeline')?.innerText
// EVENT / CONFIRMATION TIMELINE ... ETH ... Confirmation watch ... Price MACD confirmation still missing

document.querySelector('.moduleMarketTapeDetailDeck')?.innerText
// Detail deck remained populated with Screener receipt, Archetype read, and Indicator context.

document.querySelector('.moduleMarketTapeSelectedDetail')?.innerText
// Selected detail remained populated with rank/score, setup read, watch item, tags, payload source, detail deck, and timeline.

[...document.querySelectorAll('.moduleMarketTapeFilterChip')].map(x => x.innerText)
// All / Bullish / Bearish / Momentum / Watch / Confirmation / High Conviction / Quiet chips remained visible.

[...document.querySelectorAll('.moduleMarketTapeItem')].slice(0, 8).map(x => x.innerText)
// Cards remained populated with ranks, scores, tags, and copy.

document.querySelector('.moduleMarketTapeKicker')?.innerText
// MODULE MARKET TAPE - ACTIVE ETH

document.getElementById('asset')?.value
// ETH

document.querySelector('.moduleBriefingKicker')?.innerText
// MODULE BRIEFING - ETH - D - 6M

document.getElementById('chart')?.layout?.title?.text
// ETH - Daily - 6M
```

### MSTR

MSTR shows improved fallback copy:

- Setup read: `Direction: Bullish; Attention priority: 26.6`
- Confirmation watch: `does not match a high-conviction archetype; monitor current signal family scores.`
- Receipt context: `Attention priority 26.6; direction score 75.3; Bullish`

### SOL

SOL shows a focused confirmation row:

- Confirmation watch
- `Price breakdown confirmation still missing`

The selected-detail, detail-deck, and chart sections remain stable.

## Remaining known gaps

- Some confirmation-watch rows still repeat the card watch item when that is the richest available payload field.
- Timeline copy quality is still dependent on available screener/archetype/indicator fields.
- Full production timeline/event detail parity remains future work.
- Production cutover is still intentionally deferred.

## Recommendation

Treat this QA as a clean browser pass for the module Market Tape timeline copy-polish slice.

Recommended next branch:

```text
qa/module-market-tape-final-monolith-gap-review-v1
```

Recommended scope:

```text
- compare module Market Tape against production monolith one more time
- document remaining gaps before chart/control parity polish
- do not edit production embeds
- do not edit monolith
- do not regenerate payloads
```

## Non-goals

- no production embed cutover
- no monolith edits
- no payload regeneration
