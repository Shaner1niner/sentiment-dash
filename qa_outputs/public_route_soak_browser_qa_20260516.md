# Public Route Soak Browser QA

## Purpose

Document live public-route soak QA after the module public route stabilization checkpoint.

This QA confirms the production public module route remains stable after the public asset coverage hardening, homepage stabilization, and public asset coverage browser QA.

## Branch

`qa/public-route-soak-browser-qa-v1`

## Runtime surface

`interactive_dashboard_fix24_public_embed.html`

## Browser QA target

```text
https://shaner1niner.github.io/sentiment-dash/interactive_dashboard_fix24_public_embed.html?cb=public_route_soak_001
```

## Related checkpoints

- `#164` -- Harden public asset coverage reconciliation
- `#165` -- Ignore local run artifacts
- `#166` -- Document module public asset coverage browser QA
- `#167` -- Add module public route stabilization rollup

## Browser QA result

| Surface | Expected behavior | Result |
|---|---|---:|
| Public module route | Loads production public module runtime surface | PASS |
| Public asset dropdown | Remains limited to chart-covered public assets | PASS |
| Public Market Tape count | Shows 8 public chart-covered assets | PASS |
| Header asset | Updates to selected public asset | PASS |
| Briefing panel | Updates to selected public asset | PASS |
| Market Tape active label | Updates to selected public asset | PASS |
| Selected Market Tape detail | Remains coherent with selected/clicked public asset | PASS |
| Event / confirmation timeline | Remains visible after asset changes | PASS |
| Chart stack | Renders for selected public asset | PASS |
| Chart title | Follows selected asset, frequency, and display range | PASS |
| Unsupported public assets | Member-only assets remain absent from the public dropdown | PASS |
| Legacy fallback | Remains separate and available | PASS |
| Payload regeneration | Not performed for this QA checkpoint | PASS |

## Public asset universe expected

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

### ETH

Confirmed:

- header showed `ETH`
- asset dropdown showed `ETH`
- briefing panel rendered `ETH`
- Market Tape showed `Active ETH`
- Market Tape badge showed `8 assets`
- selected detail rendered `ETH`
- detail deck remained visible
- event / confirmation timeline remained visible

### MSFT

Confirmed:

- header showed `MSFT`
- asset dropdown showed `MSFT`
- briefing panel rendered `MSFT`
- Market Tape showed `Active MSFT`
- Market Tape badge showed `8 assets`
- selected detail rendered `MSFT`
- detail deck remained visible
- public route remained stable after asset change

### SOL

Confirmed:

- header showed `SOL`
- asset dropdown showed `SOL`
- briefing panel rendered `SOL`
- Market Tape showed `Active SOL`
- selected detail rendered `SOL`
- event / confirmation timeline remained visible
- chart title showed `SOL • Daily • 3M`
- chart stack rendered price, MACD, RSI, and Stoch RSI panels

### NVDA

Previously confirmed during public asset coverage QA:

- public dropdown contained only chart-covered assets
- header showed `NVDA`
- briefing panel rendered `NVDA`
- Market Tape showed `Active NVDA`
- Market Tape badge showed `8 assets`
- selected detail rendered `NVDA`

## Observations

The old mismatch failure mode was not observed.

Specifically, the browser did not show the upper module surface switching to one asset while the chart stack remained stuck on a different asset.

The public route continues to behave as an intentionally scoped chart-covered module surface.

## Minor watch item

For ETH and MSFT, the Market Tape displayed the active card while the badge still showed `8 assets`.

This does not block the soak QA because the active asset, selected detail, briefing panel, and visible module state remained synchronized. Keep watching this behavior in future QA to confirm whether it is intentional active-asset focus behavior or a presentation detail to revisit.

## Smoke validation

Recent stabilization smoke validation passed with the expected mixed-token warning:

```powershell
python scripts\smoke_module_market_tape_parity.py
python scripts\smoke_module_asset_payload_loading.py
python scripts\smoke_module_store_control_state.py
python scripts\smoke_fix26_dashboard.py
```

Expected warning retained:

```text
embed entry/cache tokens differ
```

This is expected while the production public route uses the module runtime manifest token and legacy/member routes remain pinned to the legacy monolith token.

## Non-goals

- no route changes
- no dashboard runtime changes
- no payload regeneration
- no monolith edits
- no member/research route replacement
- no legacy fallback deletion

## Final QA recommendation

Public route soak browser QA passes.

The production public module route remains stable across reviewed public assets. The public 8-asset chart-covered universe is behaving as intended, and the route is ready for continued public use and additional soak cycles before any broader member/research route strategy work.
