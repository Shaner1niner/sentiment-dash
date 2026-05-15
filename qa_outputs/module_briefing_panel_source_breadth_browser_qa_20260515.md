# Module Briefing Panel Source Breadth Browser QA

## Purpose

Document browser QA for the module briefing panel source-breadth parity checkpoint.

This QA confirms the public module route renders the briefing panel, source/evidence sections, participation quality language, Market Tape, selected detail, event timeline, and chart stack together without blocking runtime errors.

## Branch

`refactor/module-briefing-panel-source-breadth-parity-v1`

## Runtime surface

`interactive_dashboard_fix24_public_embed.html`

## Browser QA result

| Surface | Expected behavior | Result |
|---|---|---:|
| Public module route | Loads the module dashboard surface | PASS |
| Header | Shows `SETA Public Dashboard` and active asset | PASS |
| Controls | Asset, frequency, range, view, chart type, scale mode, ribbon, sentiment ribbon, regime visuals, attention, bands, and timing controls render | PASS |
| Briefing panel | Renders reviewed SETA briefing sections | PASS |
| What SETA Sees | Visible and readable | PASS |
| Why It Matters | Visible and readable | PASS |
| Evidence | Visible and includes receipt-style context | PASS |
| Participation Quality | Visible and readable as source/trust context | PASS |
| Market Tape | Renders active ranked cards | PASS |
| Selected detail | Updates below Market Tape | PASS |
| Detail deck | Renders screener, archetype, and indicator context cards | PASS |
| Event / confirmation timeline | Renders event rows with status badges | PASS |
| Chart stack | Renders price, MACD, RSI, Stoch RSI, and related traces | PASS |
| Asset switching | Updates briefing, Market Tape, selected detail, timeline, and chart stack | PASS |
| Route behavior | Public route remains module runtime; legacy fallback remains separate | PASS |
| Payload regeneration | Not performed for this QA checkpoint | PASS |

## Assets reviewed

### SOL

Confirmed:

- briefing panel rendered for `SOL`
- `What SETA Sees`, `Why It Matters`, `Evidence`, and `Participation Quality` sections were visible
- Market Tape ranked candidates rendered
- selected detail and detail deck rendered
- event / confirmation timeline rendered
- chart stack rendered with price and technical panels
- source breadth / participation quality area remained readable

### COIN

Confirmed:

- briefing panel rendered for `COIN`
- `What SETA Sees`, `Why It Matters`, `Evidence`, and `Participation Quality` sections were visible
- Market Tape ranked candidates rendered
- selected detail and detail deck rendered
- multiple timeline rows rendered
- chart stack rendered with price and technical panels
- asset switching from SOL to COIN updated the module surface

## Smoke validation

Validated before browser QA:

```powershell
python scripts\smoke_module_briefing_panel_parity.py
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

Module briefing panel source-breadth browser QA passes.

The public module dashboard now has a documented briefing/source-breadth parity checkpoint. The surface is stable enough to proceed to the next module parity layer without modifying the briefing runtime in this PR.
