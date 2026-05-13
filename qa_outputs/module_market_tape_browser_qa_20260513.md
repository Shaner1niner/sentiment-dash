# Module Market Tape Browser QA

## Purpose

Validate the module Market Tape shell inside the non-production module runtime harness after `refactor/module-market-tape-parity-v1`.

Production public/member embeds remain pinned to `dashboard_fix26_app.js`.

## Test URL

`module_runtime_smoke_harness.html?cb=module_market_tape_parity_001`

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
| Market Tape shows active asset context | PASS | Example: `MODULE MARKET TAPE • ACTIVE BTC`, `ACTIVE AMD`, `ACTIVE AVAX` |
| Market Tape asset cards render | PASS | Cards render for screener assets |
| Market Tape card count is nonzero | PASS | Panel shows `27 assets` |
| Clicking a Market Tape card updates selected asset | PASS | Example: clicking AVAX updates active Market Tape context |
| Asset dropdown follows Market Tape click | PARTIAL | Header/chart/briefing update to clicked asset; observed one screenshot where dropdown still displayed prior asset while context showed AVAX |
| Header asset feedback updates | PASS | Header changes to selected active asset |
| Briefing panel updates after Market Tape click | PASS | Reviewed briefing context follows selected asset |
| Chart updates after Market Tape click | PASS | Plotly chart redraws for selected asset/range |
| Range changes still redraw chart | PASS | Examples include 3M, 6M, and 1Y views |
| No blocking red console errors | PASS | No runtime-blocking chart/briefing/Market Tape errors observed |
| Public production dashboard remains stable | PASS | Production embeds remain on monolith |
| Member production dashboard remains stable | PASS | Production embeds remain on monolith |

## Visual comparison notes versus production monolith

The module Market Tape is a solid shell and proves the core runtime path:

- loads the screener payload
- renders a Market Tape panel
- renders asset cards
- preserves click-to-asset behavior
- keeps the briefing panel and chart synchronized with selected assets

However, the module Market Tape is not yet production-parity with the monolith.

Observed gaps compared with the production monolith screenshot:

- Module cards currently show generic labels such as `AMD market tape candidate`.
- Module cards currently show `0` scores instead of the production ranked priority scores.
- Module cards are missing production rank labels such as `#4 ETH`, `#5 SOL`, `#7 BTC`.
- Module cards are missing richer setup labels such as bullish/quiet/high-quality/conflict/watch states.
- Module layout does not yet include the production guide/help treatment.
- Module layout does not yet include production filter chips such as Top Priority, Fresh Confirmed, Watch Clusters, Narrative Divergence, Sentiment Repair, Bullish Setups, Bearish Setups, High Conflict, Quiet / Monitor.
- Module layout does not yet include the selected-candidate detail deck below the card row.
- Module layout does not yet include the indicator mini-score deck shown in the monolith, such as SETA Score, MACD, RSI, Attention, Bollinger, Ribbon, and Trend.
- Module layout does not yet include the richer market-tape explanation copy used in the production panel.
- Module chart path still lacks some production monolith chart/timing-pane behavior, including the full multi-pane indicator stack visible in the monolith comparison screenshot.
- Module event timeline parity remains out of scope for this branch.

## Console probes

```javascript
document.getElementById('module-market-tape')?.innerText.slice(0, 1000)
document.querySelectorAll('.moduleMarketTapeItem').length
document.querySelector('.moduleMarketTapeKicker')?.innerText
document.querySelector('.moduleMarketTapePill')?.innerText
document.getElementById('asset')?.value
document.querySelector('.moduleBriefingKicker')?.innerText
document.getElementById('chart')?.layout?.title?.text
```

## Recommendation

Treat this branch as a successful module Market Tape shell/parity-foundation pass, not a full production parity pass.

Continue module parity work, but do not cut over production embeds yet.

Recommended next branches:

```text
fix/module-market-tape-score-field-mapping-v1
refactor/module-market-tape-card-richness-v1
refactor/module-event-timeline-parity-v1
qa/module-cutover-readiness-audit-v1
```

## Non-goals

- no production embed cutover
- no monolith edits
- no payload regeneration
