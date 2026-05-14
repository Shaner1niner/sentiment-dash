# Module Market Tape Detail Deck Browser QA

## Purpose

Validate browser behavior after `refactor/module-market-tape-detail-deck-parity-v1`.

This QA confirms that the module Market Tape selected-detail area now includes a richer detail deck with Screener receipt, Archetype read, and Indicator context sections. It also confirms that filter chips, card richness, selected-detail behavior, dropdown sync, briefing sync, and chart redraw behavior still work.

Production public/member embeds remain pinned to `dashboard_fix26_app.js`.

## Test URL

`module_runtime_smoke_harness.html?cb=module_market_tape_detail_deck_001`

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
| Selected-detail panel renders | PASS | Existing selected-detail panel remains below the Market Tape card grid |
| Detail deck renders | PASS | New detail deck renders under selected detail |
| Detail deck has Screener receipt section | PASS | Section shows rank/score/setup fields such as attention priority and consensus direction |
| Detail deck has Archetype read section | PASS | Section shows family/confirmation fields such as missing confirmations and direction labels |
| Detail deck has Indicator context section | PASS | Section shows momentum/participation fields such as indicator family, direction label, strength label, and confidence label |
| Detail deck follows BTC | PASS | BTC detail deck shows Bullish direction and Low indicator labels |
| Detail deck follows SOL | PASS | SOL detail deck shows Mixed / Neutral direction and Medium indicator labels |
| Detail deck follows DOGE | PASS | DOGE detail deck shows confirmed-event gate / Bullish direction and Medium indicator labels |
| Filter chips remain visible | PASS | Chips still show counts such as All 27, Bullish 5, Bearish 9, Momentum 12, Watch 14, Confirmation 7, High Conviction 9, Quiet 9 |
| Filter chips still work | PASS | Filtered card set continues to render correctly |
| Card richness remains intact | PASS | Cards still show rank, score, richer tags, and concise setup/watch copy |
| Market Tape click updates asset dropdown | PASS | Console probe returned clicked asset such as `DOGE` |
| Market Tape active state follows click | PASS | Console probe returned `MODULE MARKET TAPE - ACTIVE DOGE` |
| Briefing follows clicked asset | PASS | Console probe returned `MODULE BRIEFING - DOGE - D - ALL` |
| Chart follows clicked asset/range | PASS | Console probe returned `DOGE - Daily - ALL` |
| Range changes do not break deck | PASS | DOGE was validated with display range `All` after prior BTC/SOL 3M examples |
| No `[object Object]` asset sync regression | PASS | Asset sync logs remained normalized |
| No blocking red console errors | PASS | No runtime-blocking Market Tape, briefing, control-sync, or chart errors observed |
| Public production dashboard remains stable | PASS | Production embeds remain on monolith |
| Member production dashboard remains stable | PASS | Production embeds remain on monolith |

## Browser observations

The detail deck adds the missing middle layer between compact Market Tape cards and the chart. It exposes richer structured context without overcrowding every card.

Observed sections:

- `Screener receipt`
- `Archetype read`
- `Indicator context`

Observed BTC detail deck:

- Screener receipt: attention priority score `62.8`, consensus direction score `63.5`, direction label `Bullish`
- Archetype read: missing confirmation text, attention priority score `62.8`, consensus direction score `63.5`, direction label `Bullish`
- Indicator context: indicator family `Attention`, direction label `Low`, strength label `Low`, confidence label `Low`

Observed SOL detail deck:

- Screener receipt: attention priority score `57.8`, consensus direction score `56.5`, direction label `Mixed / Neutral`
- Archetype read: `Price breakdown confirmation still missing`
- Indicator context: indicator family `Attention`, direction label `Medium`, strength label `Medium`, confidence label `Medium`

Observed DOGE detail deck:

- Screener receipt: attention priority score `69.1`, consensus direction score `75.6`, direction label `Bullish`
- Archetype read: `Needs confirmed event, volume, or volatility gate`
- Indicator context: indicator family `Attention`, direction label `Medium`, strength label `Medium`, confidence label `Medium`

Observed console probes after selecting DOGE:

```javascript
document.querySelector('.moduleMarketTapeSelectedDetail')?.innerText
// Selected detail includes rank/score, setup read, watch item, tags, payload source, and detail deck rows.

document.querySelector('.moduleMarketTapeDetailDeck')?.innerText
// "DETAIL DECK\nscreener / archetype / indicators\nScreener receipt\nrank / score / setup\nSCREENER ATTENTION PRIORITY SCORE\n69.1\nSIGNAL CONSENSUS DIRECTION SCORE\n75.6\nSIGNAL CONSENSUS DIRECTION LABEL\nBullish\nArchetype read\nfamily / confirmation\nMISSING CONFIRMATIONS\nNeeds confirmed event, volume, or volatility gate\n...\nIndicator context\nmomentum / participation\nINDICATOR FAMILY\nAttention\nDIRECTION LABEL\nMedium\nSTRENGTH LABEL\nMedium\nCONFIDENCE LABEL\nMedium"

[...document.querySelectorAll('.moduleMarketTapeDeckCard')].map(x => x.innerText)
// 3 cards observed: Screener receipt, Archetype read, Indicator context

[...document.querySelectorAll('.moduleMarketTapeFilterChip')].map(x => x.innerText)
// ["All 27", "Bullish 5", "Bearish 9", "Momentum 12", "Watch 14", "Confirmation 7", "High Conviction 9", "Quiet 9"]

document.querySelector('.moduleMarketTapeKicker')?.innerText
// "MODULE MARKET TAPE - ACTIVE DOGE"

document.getElementById('asset')?.value
// "DOGE"

document.querySelector('.moduleBriefingKicker')?.innerText
// "MODULE BRIEFING - DOGE - D - ALL"

document.getElementById('chart')?.layout?.title?.text
// "DOGE - Daily - ALL"
```

## Remaining known gaps

- Detail deck is structured and useful, but still compact.
- Full production Market Tape side panel / expanded indicator mini-deck parity remains future work.
- Event timeline parity remains out of scope.
- Production cutover is still intentionally deferred.

## Recommendation

Treat this QA as a clean browser pass for the module Market Tape detail-deck slice.

Recommended next branch:

```text
refactor/module-market-tape-event-timeline-shell-v1
```

Recommended scope:

```text
- add a non-production event/timeline shell below the detail deck
- surface compact latest-event / confirmation context when available
- preserve filter chips
- preserve selected-detail and detail-deck behavior
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
