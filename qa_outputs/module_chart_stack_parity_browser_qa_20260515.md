# Module Chart Stack Parity Browser QA

## Purpose

Document browser QA after restoring module chart stack parity for MACD, RSI, and Stochastic RSI lower panels where payload fields exist.

This QA confirms the module runtime now restores a major piece of monolith-style chart cockpit depth while preserving briefing, Market Tape, selected detail, detail deck, event timeline, asset sync, and control sync.

## Branch

`qa/module-chart-stack-parity-browser-qa-v1`

## Related PRs

- `#140` -- Add stochastic RSI field aliases to module chart stack
- `#139` -- Restore module chart stack parity
- `#137` -- Document module runtime public dashboard default browser QA
- `#136` -- Make module runtime the public dashboard default
- `#135` -- Document module runtime navigation link browser QA
- `#134` -- Add module runtime candidate navigation link
- `#132` -- Add module runtime production embed candidate

## Test surface

Module runtime candidate / public dashboard default surface after chart-stack parity and Stochastic RSI alias fix.

Representative URL pattern:

```text
https://shaner1niner.github.io/sentiment-dash/interactive_dashboard_fix26_module_candidate.html?cb=stoch_rsi_alias_001
```

## Scope

This QA validates browser behavior only.

It does not approve payload regeneration, route-file replacement, member-route replacement, or monolith deletion.

## Manual browser QA summary

| Check | Result | Notes |
|---|---:|---|
| Module runtime candidate loads | PASS | Candidate page rendered successfully |
| Briefing panel remains populated | PASS | Briefing sections render above Market Tape |
| Market Tape remains populated | PASS | Active card grid renders and follows selected assets |
| Selected detail remains populated | PASS | Rank/score, setup read, watch item, tags, and payload source render |
| Detail deck remains populated | PASS | Screener receipt, archetype read, and indicator context render |
| Event / confirmation timeline remains populated | PASS | Timeline remains visible below detail deck |
| Chart renders after stack parity patch | PASS | Chart renders without blocking errors |
| MACD lower panel renders where fields exist | PASS | BTC example shows MACD Histogram / MACD / MACD Signal on `y3` |
| RSI lower panel renders where fields exist | PASS | BTC example shows RSI on `y4` |
| Stochastic RSI lower panel renders where fields exist | PASS | BTC example shows Stoch RSI / Stoch RSI Signal on `y5` |
| Existing price chart behavior preserved | PASS | Price chart, candles, and overlays remain visible |
| Asset click sync preserved | PASS | Market Tape clicks update selected asset and chart |
| Control sync preserved | PASS | Scale mode and selected asset changes remain synchronized |
| Console title probe resolves | PASS | `document.getElementById('chart')?.layout?.title?.text` resolves |
| Console trace probe resolves | PASS | `document.getElementById('chart')?.data?.map(...)` returns trace metadata |
| Payload Stochastic RSI probe confirms data | PASS | ETH/BTC selected window contains non-null Stochastic RSI values |
| No app-blocking runtime errors observed | PASS | Favicon 404 is harmless and not app-blocking |

## Assets reviewed

Representative browser checks included:

```text
BTC
ETH
GOOGL
COIN
```

Additional asset clicks were observed during QA, including:

```text
SOL
AVAX
LINK
MSFT
META
MSTR
TLT
SHOP
NFLX
```

These asset-click logs confirmed that Market Tape click-to-asset sync remains active after chart-stack parity.

## Console probes

Chart title probe:

```javascript
document.getElementById('chart')?.layout?.title?.text
```

Trace metadata probe:

```javascript
document.getElementById('chart')?.data?.map(t => ({
  name: t.name,
  type: t.type,
  yaxis: t.yaxis,
  nonNull: (t.y || []).filter(v => v !== null && v !== undefined && Number.isFinite(Number(v))).length
}))
```

Payload availability probe:

```javascript
await (async () => {
  const asset = document.getElementById('asset')?.value || 'BTC';
  const rows = await fetch(`fix26_chart_store_assets/member/${asset}.json?cb=${Date.now()}`)
    .then(r => r.json())
    .then(p => p.D?.[asset] || []);

  const win = rows.slice(-90);

  return ['rsi', 'stochastic_rsi', 'stochastic_rsi_d', 'sentiment_stochastic_rsi_d'].map(k => ({
    field: k,
    fullRows: rows.filter(r => r[k] !== null && r[k] !== undefined && Number.isFinite(Number(r[k]))).length,
    last90: win.filter(r => r[k] !== null && r[k] !== undefined && Number.isFinite(Number(r[k]))).length,
    lastValue: [...rows].reverse().find(r => r[k] !== null && r[k] !== undefined)?.[k]
  }));
})()
```

## Observed Stochastic RSI payload availability

Observed selected asset probe returned:

```text
rsi: fullRows 352, last90 90, lastValue 47.734313
stochastic_rsi: fullRows 337, last90 90, lastValue 13.88294
stochastic_rsi_d: fullRows 335, last90 90, lastValue 13.769508
sentiment_stochastic_rsi_d: fullRows 335, last90 90, lastValue 86.820626
```

This confirmed the selected window had sufficient Stochastic RSI data.

## Observed chart trace metadata

Observed chart trace metadata returned 9 traces:

```text
Price / candlestick / primary axis
Overlap Upper / scatter / primary axis
Overlap Lower / scatter / primary axis
Sentiment MA / scatter / primary axis
Regime Marks / scatter / primary axis
MACD Histogram / bar / y3
MACD / scatter / y3
MACD Signal / scatter / y3
RSI / scatter / y4
```

After the Stochastic RSI alias fix propagated, the chart rendered a visible lower Stochastic RSI panel on the module page.

Expected chart-stack behavior now includes:

```text
MACD Histogram / y3
MACD / y3
MACD Signal / y3
RSI / y4
Stoch RSI / y5
Stoch RSI Signal / y5
```

## Visual QA notes

Browser visual QA confirmed the stacked chart layout now presents:

```text
primary price/candle chart
MACD panel
RSI panel
Stochastic RSI panel
```

This restores the most visible monolith chart cockpit depth without removing the module interpretation layer.

## Production-readiness interpretation

This is a successful chart-stack parity browser pass.

The module runtime now restores MACD, RSI, and Stochastic RSI lower-panel behavior where payload fields exist.

This does not mean every asset must expose every indicator trace. The intended behavior is field-driven: lower panels appear where the payload contains sufficient matching indicator series.

## Remaining parity work

Chart-stack parity closes the largest visible cockpit gap, but remaining monolith-to-module parity areas include:

- event/timeline depth parity
- alert/ribbon/regime marker parity
- remaining control-mode edge parity
- member/research mode parity
- final route/file replacement planning, only after additional QA

## Recommended next branch

```text
refactor/module-event-timeline-depth-parity-v1
```

Rationale:

```text
With chart cockpit depth restored, the next strongest monolith advantage is richer event/timeline context.
```

## Non-goals

- no payload regeneration
- no monolith edits
- no public/member route replacement
- no deletion of legacy public dashboard fallback
- no change to Market Context Cards or Research Dashboard links

## Final recommendation

Merge this QA report.

Proceed next to event/timeline depth parity while preserving the current homepage public default and legacy public fallback.
