# Module Market Tape Card Richness Browser QA

## Purpose

Validate module Market Tape browser behavior after `refactor/module-market-tape-card-richness-v1` and the follow-up cleanup PR that removed accidental generated payload churn.

Production public/member embeds remain pinned to `dashboard_fix26_app.js`.

## Test URL

`module_runtime_smoke_harness.html?cb=module_market_tape_card_richness_001`

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
| Module Market Tape panel appears | PASS | Panel renders between briefing panel and chart |
| Market Tape card count is nonzero | PASS | Panel shows `27 assets` |
| Score/rank mapping remains active | PASS | Cards show rank/ticker labels and scores such as `#6 BTC`, `#1 AVAX`, `#8 ETH`, `100` |
| Active Market Tape card highlights | PASS | Active card receives highlighted treatment |
| Market Tape click updates module context | PASS | Header/briefing/Market Tape/chart update to selected asset |
| Briefing follows clicked Market Tape asset | PASS | Example: SOL briefing context updates after selecting SOL |
| Chart follows clicked Market Tape asset | PASS | Example: chart title updates to `SOL • Weekly • YTD` after SOL selection |
| Range/frequency redraw still works | PASS | Weekly/YTD redraw observed |
| Asset dropdown follows Market Tape click | FAIL | Observed dropdown still displaying `BTC` while header, card, briefing, and chart context show `SOL` |
| Card copy is richer than generic `Summary` | PARTIAL | Header/subhead copy improved for active asset, but card bodies still show `Summary` |
| Tags are richer than only `Monitor` | PARTIAL | Cards still mostly show `Monitor` tags |
| No blocking red console errors | PASS | No runtime-blocking Market Tape, briefing, or chart errors observed |
| Public production dashboard remains stable | PASS | Production embeds remain on monolith |
| Member production dashboard remains stable | PASS | Production embeds remain on monolith |

## Browser observations

The module Market Tape card-richness branch preserves the working module path:

- Market Tape cards render
- rank/score display remains active
- active selected card is highlighted
- Market Tape click updates active module context
- briefing panel follows the selected Market Tape asset
- chart follows the selected Market Tape asset
- weekly/YTD chart redraw works

The QA pass also found two remaining gaps:

1. **Control sync gap** — after clicking a Market Tape card, the module context updates, but the asset `<select>` control can remain on the prior asset. Example observed state: header/briefing/card/chart show `SOL`, while the dropdown still shows `BTC`.
2. **Card richness gap** — card body/tags remain mostly generic. Examples: card bodies still render `Summary`, and tags still render `Monitor`.

## Console probes used

```javascript
[...document.querySelectorAll('.moduleMarketTapeItem')].slice(0, 8).map(x => x.innerText)
document.querySelector('.moduleMarketTapeKicker')?.innerText
document.querySelector('.moduleMarketTapePill')?.innerText
document.getElementById('asset')?.value
document.querySelector('.moduleBriefingKicker')?.innerText
document.getElementById('chart')?.layout?.title?.text
```

## Recommendation

Treat this QA pass as a successful regression check plus gap discovery.

Recommended immediate next branch:

```text
fix/module-market-tape-click-control-sync-v1
```

Recommended scope:

```text
- when Market Tape card click changes active asset, sync the asset select value
- preserve chart/briefing redraw behavior
- preserve score/rank mapping
- document card-richness still partial
- no production cutover
- no monolith edits
- no payload regeneration
```

Card body/tag richness should remain a follow-up after control sync is fixed.

## Non-goals

- no production embed cutover
- no monolith edits
- no payload regeneration
