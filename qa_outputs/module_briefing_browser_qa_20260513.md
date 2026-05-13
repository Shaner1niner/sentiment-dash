# Module Briefing Browser QA

## Purpose

Validate module briefing panel behavior inside the non-production module runtime harness after reviewed briefing lookup shape support.

Production public/member embeds remain pinned to `dashboard_fix26_app.js`.

## Test URL

`module_runtime_smoke_harness.html?cb=module_briefing_panel_parity_001`

## Static validation

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
| Module briefing panel appears above chart | PASS | Panel renders above Plotly chart |
| Module briefing header shows active context | PASS | Example: `MODULE BRIEFING • BTC • D • 3M` |
| Reviewed briefing source pill appears | PASS | Pill shows `reviewed` |
| What SETA Sees section renders reviewed copy | PASS | BTC/LINK reviewed copy visible |
| Why It Matters section renders reviewed copy | PASS | Reviewed implication text visible |
| Evidence section renders reviewed receipts | PASS | Evidence bullet list visible |
| Participation Quality section renders reviewed trust copy | PASS | Participation copy visible |
| BTC initial briefing renders | PASS | BTC reviewed panel renders |
| BTC range change updates context | PASS | 3M / YTD context updates |
| Asset switch updates briefing context | PASS | LINK reviewed panel renders |
| Chart continues to redraw normally | PASS | Plotly chart updates with selected asset/range |
| No blocking red console errors | PASS | No runtime-blocking chart or briefing errors observed |
| Public production dashboard remains stable | PASS | Production embeds remain on monolith |
| Member production dashboard remains stable | PASS | Production embeds remain on monolith |

## Console / visual observations

- `deterministic fallback` is no longer shown for reviewed assets.
- Source pill now shows `reviewed`.
- BTC and LINK panels render active asset/range context.
- Reviewed card sections render real payload copy rather than generic module fallback copy.
- Chart and briefing panel update together across asset/range changes.
- Static module runtime harness smoke now passes after narrowing the monolith check to script-source loading only.

## Observed gaps

- Module panel is now functionally correct, but still visually simpler than the production monolith briefing panel.
- Module market tape and event timeline parity remain separate workstreams.
- Full production cutover is still not recommended until market tape, timeline, and cutover-readiness audit are complete.

## Recommendation

Proceed to the next module parity workstream. Do not cut over production embeds yet.

Recommended next branches:

```text
refactor/module-market-tape-parity-v1
refactor/module-event-timeline-parity-v1
qa/module-cutover-readiness-audit-v1
```

## Non-goals

- no production embed cutover
- no monolith edits
- no payload regeneration
