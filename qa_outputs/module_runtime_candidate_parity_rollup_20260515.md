# Module Runtime Candidate Parity Rollup

## Purpose

Document the current module runtime candidate parity checkpoint before any production route replacement.

This rollup summarizes the restored module surfaces, the completed browser QA reports, the cleanup work that removed accidental payload churn, and the remaining gates before a public/member production cutover.

## Branch

`qa/module-runtime-candidate-parity-rollup-v1`

## Current candidate surface

```text
interactive_dashboard_fix26_module_candidate.html
```

Representative live URL:

```text
https://shaner1niner.github.io/sentiment-dash/interactive_dashboard_fix26_module_candidate.html
```

## Current production/fallback posture

The module runtime candidate is exposed and browser-QA-confirmed, but the legacy public/member dashboard routes remain available as fallback.

This rollup does not approve production route replacement. It documents readiness progress only.

## Completed milestone summary

| Area | Status | Evidence |
|---|---:|---|
| Homepage public dashboard default points to module candidate | Confirmed | Public dashboard card opens module runtime candidate |
| Legacy public dashboard fallback remains available | Confirmed | Legacy route/card retained |
| Market Context Cards remain available | Confirmed | Homepage link retained |
| Research Dashboard remains available | Confirmed | Homepage/member link retained |
| Module briefing panel | Confirmed | Asset-specific module briefing renders |
| Module Market Tape | Confirmed | Active cards, selected detail, and click-to-asset sync render |
| Module selected detail deck | Confirmed | Rank/score, setup read, watch item, tags, payload source render |
| Module chart stack parity | Confirmed | Price, overlays, MACD, RSI, Stoch RSI render |
| Stoch RSI payload aliases | Confirmed | Canonical `stochastic_rsi` and related aliases recognized |
| Event timeline depth parity | Confirmed | Kind badges, fact boxes, evidence trails render |
| Alert/ribbon/regime marker parity | Confirmed | Typed `Regime:` marker traces render live |
| Smoke coverage for marker parity | Confirmed | Plotly renderer smoke includes marker-context assertions |
| Accidental payload churn cleanup | Confirmed | Event timeline and alert-marker QA payload churn cleaned up |
| Current working tree expectation | Clean | Main should be clean before and after this report branch |

## Related PR sequence

- `#136` -- Make module runtime the public dashboard default
- `#137` -- Document module runtime public dashboard default browser QA
- `#139` -- Restore module chart stack parity
- `#140` -- Add stochastic RSI field aliases to module chart stack
- `#141` -- Document module chart stack parity browser QA
- `#142` -- Add module event timeline depth parity
- `#143` -- Remove accidental payload churn from event timeline parity merge
- `#144` -- Document module event timeline depth browser QA
- `#145` -- Add module alert ribbon regime marker parity
- `#146` -- Add alert ribbon regime marker smoke coverage
- `#147` -- Document module alert ribbon regime marker browser QA
- `#148` -- Remove accidental payload churn from alert marker QA merge

## Browser QA rollup

### Public default / navigation

Confirmed:

```text
homepage renders four cards
Public Market Dashboard opens module runtime candidate
Market Context Cards route remains valid
Research Dashboard route remains valid
Legacy Public Dashboard fallback remains available
```

### Chart stack parity

Confirmed:

```text
price/candle rendering
price overlays
sentiment MA
MACD histogram
MACD / MACD signal
RSI
Stoch RSI
Stoch RSI signal
chart controls remain interactive
```

### Event timeline depth

Confirmed:

```text
setup read
confirmation watch
receipt context
timeline kind badges
fact boxes
evidence bullet / evidence trail
event timeline remains synced to selected Market Tape item
```

### Alert / ribbon / regime marker parity

Confirmed live console result included typed marker traces:

```text
Regime: Confirmed Overlap
Regime: Ribbon Transition
Regime: High Volume
```

This confirms the typed marker implementation is executing in the module candidate and is no longer stuck on generic-only `Regime Marks` for marker-rich surfaces.

## Validation commands already used across milestone sequence

Representative smoke coverage:

```powershell
python scripts\smoke_module_plotly_renderer_parity.py
python scripts\smoke_module_market_tape_parity.py
python scripts\smoke_module_runtime_harness.py
python scripts\smoke_module_briefing_panel_parity.py
python scripts\smoke_module_store_control_state.py
python scripts\smoke_module_asset_payload_loading.py
python scripts\smoke_display_range_window_core.py
python scripts\smoke_fix26_dashboard.py
```

## Recommended validation for this rollup

Run the lightweight checkpoint set before merging this report:

```powershell
python scripts\smoke_module_plotly_renderer_parity.py
python scripts\smoke_module_market_tape_parity.py
python scripts\smoke_fix26_dashboard.py
```

## Payload churn policy

Recent QA/report branches twice picked up generated payload churn that was already present in the working tree before the report commit.

Both incidents were corrected:

```text
#143 cleaned event timeline parity payload churn
#148 cleaned alert marker QA payload churn
```

Going forward, any report-only branch should check `git status --short` before writing and should only commit the intended report file.

## Remaining production cutover gates

Before route replacement, complete or explicitly accept the following:

1. Candidate rollup QA report merged.
2. One final live browser pass from the homepage into:
   - module candidate/public dashboard
   - legacy public dashboard fallback
   - Market Context Cards
   - Research Dashboard
3. Confirm no accidental payload churn in the final cutover branch.
4. Confirm rollback path:
   - revert cutover PR
   - retain legacy public/member dashboard routes
   - do not delete candidate page during first cutover
5. Decide whether member/research route replacement is in scope or deferred.
6. Decide whether deeper alert hover/card parity is required before production replacement or can remain post-cutover backlog.

## Recommended next branch after this rollup

If this rollup merges cleanly, the next branch should be documentation/planning, not runtime code:

```text
docs/module-runtime-production-cutover-checklist-v1
```

Then, only after explicit approval:

```text
promote/module-runtime-production-route-cutover-v1
```

## Non-goals

- no payload regeneration
- no monolith edits
- no public/member route replacement
- no deletion of legacy dashboard fallback
- no change to Market Context Cards
- no change to Research Dashboard
- no generated chart-store or briefing payload edits

## Final recommendation

Merge this rollup report.

Do one final homepage-to-candidate browser check after merge. Then prepare a production cutover checklist branch before any route replacement PR.
