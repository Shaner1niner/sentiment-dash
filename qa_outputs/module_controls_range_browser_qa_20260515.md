# Module Controls and Range Browser QA

## Purpose

Document browser QA for the module runtime controls and display-range behavior after the production public-route cutover.

This QA confirms the public module dashboard controls remain synchronized across asset, frequency, range, chart, ribbon, attention, band, and timing selections.

## Branch

qa/module-controls-range-browser-qa-v1

## Runtime surface

interactive_dashboard_fix24_public_embed.html

## Browser QA result

| Surface | Result |
|---|---:|
| Public module route loads | PASS |
| Asset selector updates module surface | PASS |
| Frequency control remains stable | PASS |
| Display range control remains stable | PASS |
| View control remains stable | PASS |
| Chart type control remains stable | PASS |
| Scale mode control remains stable | PASS |
| Ribbon control remains stable | PASS |
| Sentiment ribbon control remains stable | PASS |
| Regime visuals control remains stable | PASS |
| Attention control remains stable | PASS |
| Bands control remains stable | PASS |
| Timing view control remains stable | PASS |
| Market Tape updates after asset changes | PASS |
| Briefing panel updates after asset changes | PASS |
| Chart title reflects selected asset/frequency/range | PASS |
| Chart stack remains visible after control changes | PASS |
| Event / confirmation timeline remains visible | PASS |
| Public route remains module runtime | PASS |
| Legacy fallback remains separate | PASS |

## Assets reviewed

- BTC
- ETH
- SOL
- COIN

## Control combinations reviewed

- Daily / 3M
- Daily / YTD
- Weekly / 1Y where available
- Briefing view
- Candles chart type
- Price + Price Overlays scale mode
- Curated sentiment ribbon
- Regime visuals on
- Context attention mode
- Price + Sentiment timing view

## Smoke validation

Validated before browser QA:

- python scripts\smoke_module_runtime_harness.py
- python scripts\smoke_module_store_control_state.py
- python scripts\smoke_display_range_window_core.py
- python scripts\smoke_module_asset_payload_loading.py
- python scripts\smoke_fix26_dashboard.py

Expected warning retained: embed entry/cache tokens differ.

This is expected because the production public route uses the module runtime manifest token while legacy/member routes remain pinned to the legacy monolith token.

## Non-goals

- no route changes
- no dashboard runtime changes
- no payload regeneration
- no monolith edits
- no member/research route replacement
- no legacy fallback deletion

## Final QA recommendation

Module controls and range browser QA passes.

The public module dashboard controls are stable enough to proceed to the next module parity layer.
