# Module Public Asset Coverage Browser QA

## Purpose

Document browser QA after the public asset coverage reconciliation hardening.

This QA confirms the production public module route only exposes chart-covered public assets and keeps the header, briefing panel, Market Tape, selected detail, and chart stack synchronized after asset changes.

## Branch

`qa/module-public-asset-coverage-browser-qa-v1`

## Related PRs

- `#164` -- Harden public asset coverage reconciliation
- `#165` -- Ignore local run artifacts

## Runtime surface

`interactive_dashboard_fix24_public_embed.html`

## Browser QA target

```text
https://shaner1niner.github.io/sentiment-dash/interactive_dashboard_fix24_public_embed.html?cb=asset_coverage_reconcile_164
```

## Browser QA result

| Surface | Expected behavior | Result |
|---|---|---:|
| Public module route | Loads production public module dashboard | PASS |
| Public asset dropdown | Limited to chart-covered public assets | PASS |
| Public asset count | Market Tape shows 8 assets | PASS |
| Unsupported public assets | TLT, META, XRP, DOGE, PLTR, and other member-only assets are not exposed in public dropdown | PASS |
| Header asset | Updates to selected public asset | PASS |
| Briefing panel | Updates to selected public asset | PASS |
| Market Tape title | Updates to active selected public asset | PASS |
| Selected detail | Updates to clicked/selected chart-covered asset | PASS |
| Chart title | Stays aligned with selected asset, frequency, and display range | PASS |
| Chart stack | Remains visible after asset changes | PASS |
| Event / confirmation timeline | Remains visible after asset changes | PASS |
| Store asset sync | Asset selector, Market Tape, and chart stack remain synchronized | PASS |
| Legacy fallback | Remains separate and available | PASS |
| Payload regeneration | Not performed for this QA checkpoint | PASS |

## Public asset universe observed

```text
AAPL
BTC
COIN
ETH
GLD
MSFT
NVDA
SOL
```

## Assets reviewed

### NVDA

Confirmed:

- public dropdown contained only chart-covered assets
- header showed `NVDA`
- briefing panel rendered for `NVDA`
- Market Tape showed `Active NVDA`
- Market Tape badge showed `8 assets`
- selected detail rendered for `NVDA`
- chart stack remained available

### Additional control expectations

The following assets should also remain synchronized when selected from the public dropdown:

- `SOL`
- `BTC`
- `AAPL`
- `ETH`
- `COIN`
- `GLD`
- `MSFT`

## DevTools checks

Recommended public dropdown check:

```javascript
Array.from(document.getElementById('asset').options).map(o => o.value)
```

Expected:

```text
AAPL,BTC,COIN,ETH,GLD,MSFT,NVDA,SOL
```

Recommended chart sync check after selecting an asset:

```javascript
({
  selectedAsset: document.getElementById('asset')?.value,
  chartTitle: document.getElementById('chart')?.layout?.title?.text,
  tapeTitle: document.querySelector('.moduleMarketTapeHeader h2')?.innerText
})
```

Expected:

- `selectedAsset` matches selected dropdown value
- `chartTitle` contains selected asset
- `tapeTitle` contains selected asset

## Smoke validation

Validated for the implementation PR:

```powershell
python scripts\smoke_module_market_tape_parity.py
python scripts\smoke_module_asset_payload_loading.py
python scripts\smoke_module_store_control_state.py
python scripts\smoke_fix26_dashboard.py
```

Expected smoke warning retained:

```text
embed entry/cache tokens differ
```

This is expected because the production public route uses the module runtime manifest token while legacy/member routes remain pinned to the legacy monolith token.

## Non-goals

- no route changes
- no dashboard runtime changes
- no payload regeneration
- no monolith edits
- no member/research route replacement
- no legacy fallback deletion

## Final QA recommendation

Module public asset coverage browser QA passes.

The public dashboard now behaves as an intentionally scoped chart-covered public module route. The earlier unsupported-asset mismatch risk is resolved at the UI contract level: users can only choose public assets that the public chart stack can render end-to-end.
