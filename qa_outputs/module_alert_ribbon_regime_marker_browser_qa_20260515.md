# Module Alert / Ribbon / Regime Marker Browser QA

## Purpose

Document live browser QA after restoring typed alert/ribbon/regime marker traces in the module Plotly renderer and after adding smoke coverage for that implementation.

This QA confirms the module runtime now displays typed regime-marker context in the chart while preserving briefing, Market Tape, selected detail, event timeline depth, and chart-stack behavior.

## Branch

`qa/module-alert-ribbon-regime-marker-browser-qa-v1`

## Related PRs

- `#146` -- Add alert ribbon regime marker smoke coverage
- `#145` -- Add module alert ribbon regime marker parity
- `#144` -- Document module event timeline depth browser QA
- `#143` -- Remove accidental payload churn from event timeline parity merge
- `#142` -- Add module event timeline depth parity
- `#141` -- Document module chart stack parity browser QA
- `#140` -- Add stochastic RSI field aliases to module chart stack
- `#139` -- Restore module chart stack parity

## Test surface

Live GitHub Pages module runtime candidate after #145 and #146 were merged.

Representative URL:

```text
https://shaner1niner.github.io/sentiment-dash/interactive_dashboard_fix26_module_candidate.html?cb=alert_ribbon_regime_live_001
```

## Scope

This QA validates browser behavior only.

It does not approve payload regeneration, route-file replacement, member-route replacement, or monolith deletion.

## Manual browser QA summary

| Check | Result | Notes |
|---|---:|---|
| Live module candidate loads | PASS | GitHub Pages module candidate page rendered successfully |
| Briefing panel remains populated | PASS | Asset-specific briefing remains visible above Market Tape |
| Market Tape remains populated | PASS | Active Market Tape cards render and follow selected asset |
| Selected detail remains populated | PASS | Rank/score, setup read, watch item, tags, and payload source render |
| Detail deck remains populated | PASS | Screener receipt, archetype read, and indicator context render |
| Event timeline depth remains populated | PASS | Fact boxes, kind badges, and evidence trails continue to render |
| Chart stack remains populated | PASS | Price, overlays, MACD, RSI, and Stoch RSI remain visible |
| Typed regime marker traces render | PASS | Browser console confirmed names beginning with `Regime:` |
| Generic-only regime marker state resolved | PASS | The live chart no longer only reports legacy `Regime Marks` for the tested marker-rich BTC surface |
| Controls remain usable | PASS | Asset, frequency, display range, chart type, scale, ribbon, sentiment ribbon, regime, attention, bands, and timing controls remain interactive |
| No app-blocking runtime errors observed | PASS | Browser UI remained functional during representative checks |

## Browser console confirmation

The following console probe was used:

```javascript
document.getElementById('chart')?.data?.map(t => t.name)
```

A representative BTC result included:

```text
Price
Overlap Upper
Overlap Lower
Sentiment MA
Regime: Confirmed Overlap
Regime: Ribbon Transition
Regime: High Volume
MACD Histogram
MACD
MACD Signal
RSI
Stoch RSI
Stoch RSI Signal
```

This confirms the typed marker traces are active in the live module runtime.

## Assets / states reviewed

Representative live browser checks included:

```text
BTC
SOL
DOGE
SHOP
MSTR
AMZN
LINK
META
```

## Asset-specific observations

### BTC

- Live module candidate loaded successfully.
- Browser console confirmed typed regime marker traces:
  - `Regime: Confirmed Overlap`
  - `Regime: Ribbon Transition`
  - `Regime: High Volume`
- Chart stack remained intact with price, overlap bands, sentiment MA, MACD, RSI, and Stoch RSI.
- Event timeline depth remained visible and populated.

### SOL

- Live module candidate loaded successfully.
- Market Tape and event timeline remained populated.
- Chart stack rendered YTD view with price, sentiment, overlap, MACD, RSI, and Stoch RSI.
- Console/legend initially showed marker behavior under tested state, but BTC provided the definitive typed marker confirmation.

### DOGE

- Live module candidate loaded successfully.
- Market Tape and event timeline rendered confirmation context.
- Chart stack remained visible.
- No app-blocking runtime errors observed.

### SHOP

- Live module candidate loaded successfully.
- Timeline displayed setup, confirmation, and receipt context.
- Chart stack rendered price and indicator sections.
- No app-blocking runtime errors observed.

### MSTR

- Live module candidate loaded successfully.
- Market Tape and timeline remained populated.
- Weekly / 1Y chart stack rendered.
- No app-blocking runtime errors observed.

### AMZN

- Live module candidate loaded successfully.
- Market Tape and event timeline remained populated.
- Weekly / 1Y chart stack rendered with attention/context overlays.
- No app-blocking runtime errors observed.

### LINK

- Live module candidate loaded successfully.
- All-visible / research-style chart state rendered with attention and SETA score traces.
- Market Tape, selected detail, event timeline, and chart stack remained stable.
- No app-blocking runtime errors observed.

### META

- Live module candidate loaded successfully.
- Weekly / 1Y all-visible state rendered with attention, SETA score, sentiment, MACD, RSI, and Stoch RSI.
- Market Tape, selected detail, and timeline remained stable.

## Cache / stale-state note

During initial browser QA, the live page still showed the legacy `Regime Marks` trace. After hard refresh / updated cache path behavior, the console probe returned typed `Regime:` traces.

The final accepted condition is the live console output showing typed marker trace names, which is confirmed.

## Visual QA notes

The typed marker pass improves the chart from generic marker context toward monolith-style marker specificity:

```text
Regime: Confirmed Overlap
Regime: Ribbon Transition
Regime: High Volume
```

This gives users clearer event/marker context without changing the module shell or replacing production routes.

## Remaining parity work

Alert/ribbon/regime marker parity is now live and browser-confirmed.

Remaining monolith-to-module parity areas include:

- deeper alert detail hover/card parity
- member/research mode parity
- final public/member route replacement planning after explicit approval and rollback coverage
- final candidate-to-production cutover QA package

## Recommended next branch

```text
qa/module-runtime-candidate-parity-rollup-v1
```

Rationale:

```text
The module now has public-default routing, chart stack parity, Stoch RSI support, event timeline depth, typed regime marker traces, and browser QA for the major restored surfaces. A rollup checkpoint will make the remaining cutover gates easier to see before any route replacement.
```

## Non-goals

- no payload regeneration
- no monolith edits
- no public/member route replacement
- no deletion of legacy public dashboard fallback
- no change to Market Context Cards or Research Dashboard links

## Final recommendation

Merge this QA report.

Proceed next to a module runtime candidate parity rollup before any production route replacement.
