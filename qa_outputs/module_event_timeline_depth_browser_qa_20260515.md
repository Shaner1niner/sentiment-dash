# Module Event Timeline Depth Browser QA

## Purpose

Document live browser QA after adding module event timeline depth parity and after removing accidental payload churn from the event-timeline parity merge.

This QA confirms the module runtime now shows richer event timeline context while preserving briefing, Market Tape, selected detail, detail deck, chart stack, asset sync, and control sync.

## Branch

`qa/module-event-timeline-depth-browser-qa-v1`

## Related PRs

- `#143` -- Remove accidental payload churn from event timeline parity merge
- `#142` -- Add module event timeline depth parity
- `#141` -- Document module chart stack parity browser QA
- `#140` -- Add stochastic RSI field aliases to module chart stack
- `#139` -- Restore module chart stack parity
- `#137` -- Document module runtime public dashboard default browser QA
- `#136` -- Make module runtime the public dashboard default

## Test surface

Live GitHub Pages module runtime candidate after #142 and #143 were merged.

Representative URL:

```text
https://shaner1niner.github.io/sentiment-dash/interactive_dashboard_fix26_module_candidate.html?cb=event_timeline_depth_live_001
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
| Event / confirmation timeline remains populated | PASS | Timeline remains visible below detail deck |
| Timeline kind badge renders | PASS | Watch / Setup / Receipt / Confirmed-style badges visible where applicable |
| Timeline fact boxes render | PASS | Family, close, priority, direction, confirmation and related facts visible |
| Timeline evidence trail renders | PASS | Evidence bullet remains visible under timeline fact boxes |
| Chart stack still renders | PASS | Price, MACD, RSI, and Stoch RSI stack behavior remains intact where fields exist |
| Asset dropdown and controls remain usable | PASS | Asset/frequency/range/control shell remains populated |
| No app-blocking runtime errors observed | PASS | Browser UI remained functional during representative checks |

## Assets reviewed

Representative live browser checks included:

```text
XRP
ETH
PLTR
AVAX
```

## Asset-specific observations

### XRP

- Live module candidate loaded for XRP.
- Market Tape selected item rendered a bearish momentum/sentiment setup.
- Event timeline showed enriched confirmation context with fact boxes and evidence trail.
- Chart stack remained visible below the detail/timeline section.

### ETH

- Live module candidate loaded for ETH.
- Selected Market Tape item rendered a confirmed bullish overlap event.
- Event timeline showed confirmation-watch context with fact boxes for family, close, priority, and direction.
- Chart stack remained visible and stable.

### PLTR

- Live module candidate loaded for PLTR.
- Timeline rendered the fuller three-step structure:
  - Setup read
  - Confirmation watch
  - Receipt context
- Each timeline item carried richer fact/evidence context.
- Chart stack remained visible below the module panels.

### AVAX

- Live module candidate loaded for AVAX.
- Timeline rendered a confirmed context item with fact boxes and evidence.
- Briefing, Market Tape, selected detail, detail deck, timeline, and chart all remained populated.

## Visual QA notes

The enriched timeline now provides more of the monolith-style context density without abandoning the module shell:

```text
timeline kind badge
fact grid / fact boxes
evidence bullet
preserved setup / confirmation / receipt sequence
```

This confirms the event/timeline depth pass improved interpretation density while keeping the module page readable.

## Payload cleanup confirmation

Before this QA, accidental generated payload churn from #142 was removed in #143.

This QA confirms the event timeline code survived that cleanup and that the live module runtime still renders the enriched timeline.

## Remaining parity work

Event timeline depth parity is now live and browser-confirmed.

Remaining monolith-to-module parity areas include:

- alert/ribbon/regime marker depth parity
- remaining control-mode edge parity
- member/research mode parity
- final public/member route replacement planning, only after explicit approval and rollback coverage

## Recommended next branch

```text
refactor/module-alert-ribbon-regime-marker-parity-v1
```

Rationale:

```text
Chart stack and event timeline depth are now restored. The next visible monolith advantage is richer alert/ribbon/regime-marker context around the chart and selected Market Tape state.
```

## Non-goals

- no payload regeneration
- no monolith edits
- no public/member route replacement
- no deletion of legacy public dashboard fallback
- no change to Market Context Cards or Research Dashboard links

## Final recommendation

Merge this QA report.

Proceed next to alert/ribbon/regime marker parity while preserving the current module runtime candidate, homepage public default, and legacy public dashboard fallback.
