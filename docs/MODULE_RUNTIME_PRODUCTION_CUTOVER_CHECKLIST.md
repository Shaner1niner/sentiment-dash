# Module Runtime Production Cutover Checklist

## Purpose

Define the final checklist for promoting the module runtime candidate toward production routing.

This document is a planning and approval gate. It does not perform the cutover, replace routes, regenerate payloads, edit the monolith, or remove legacy dashboard fallbacks.

## Branch

`docs/module-runtime-production-cutover-checklist-v1`

## Current candidate surface

```text
interactive_dashboard_fix26_module_candidate.html
```

Representative live URL:

```text
https://shaner1niner.github.io/sentiment-dash/interactive_dashboard_fix26_module_candidate.html
```

## Current fallback posture

The module runtime candidate is exposed and browser-QA-confirmed.

The legacy public/member dashboard routes remain available and must remain available during the first cutover window.

## Cutover principle

Do not delete the old dashboard during the first production cutover.

The first cutover should be a reversible routing change only:

```text
promote default route -> module runtime candidate
retain legacy route -> fallback
retain candidate route -> direct QA/debug surface
```

## Completed readiness milestones

| Milestone | Status |
|---|---:|
| Public homepage default can open module candidate | Complete |
| Legacy public dashboard fallback retained | Complete |
| Market Context Cards route retained | Complete |
| Research Dashboard route retained | Complete |
| Module briefing panel renders | Complete |
| Module Market Tape renders | Complete |
| Selected detail deck renders | Complete |
| Chart stack parity restored | Complete |
| Stoch RSI aliases restored | Complete |
| Event timeline depth restored | Complete |
| Typed alert/ribbon/regime markers restored | Complete |
| Smoke coverage for typed marker traces added | Complete |
| Browser QA for chart stack completed | Complete |
| Browser QA for event timeline depth completed | Complete |
| Browser QA for alert/ribbon/regime markers completed | Complete |
| Candidate parity rollup completed | Complete |
| Accidental payload churn cleanup completed | Complete |

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
- `#149` -- Document module runtime candidate parity rollup

## Pre-cutover checklist

Before opening any route replacement branch, confirm all items below.

### Repository hygiene

- [ ] Start from clean `main`.
- [ ] Pull latest `origin/main`.
- [ ] Confirm `git status` is clean.
- [ ] Create a dedicated promotion branch.
- [ ] Confirm no generated payload files are modified before editing.
- [ ] Confirm only intended route/navigation files change in the cutover PR.
- [ ] Confirm no accidental changes to:
  - `fix26_chart_store_assets/`
  - `fix26_chart_store_member.json`
  - `fix26_chart_store_member_index.json`
  - `fix26_chart_store_public.json`
  - `fix26_chart_store_public_index.json`
  - `fix26_screener_store.json`
  - `generated_briefings_reviewed.json`
  - `generated_briefings_reviewed_v2.json`
  - `public_content/seta_website_snippets_latest.json`

### Candidate live browser QA

- [ ] Open the module candidate directly.
- [ ] Confirm the asset dropdown populates.
- [ ] Confirm default asset renders.
- [ ] Confirm briefing panel renders.
- [ ] Confirm Market Tape renders.
- [ ] Confirm card click updates selected detail.
- [ ] Confirm selected detail deck renders.
- [ ] Confirm event timeline renders with depth.
- [ ] Confirm chart stack renders.
- [ ] Confirm typed `Regime:` traces appear on marker-rich assets.
- [ ] Confirm no app-blocking runtime errors.

Representative candidate URL:

```text
https://shaner1niner.github.io/sentiment-dash/interactive_dashboard_fix26_module_candidate.html?cb=cutover_check_candidate_001
```

### Homepage route QA

- [ ] Open homepage.
- [ ] Confirm four homepage cards render.
- [ ] Confirm Public Market Dashboard opens module runtime candidate/default surface.
- [ ] Confirm Legacy Public Dashboard fallback remains available.
- [ ] Confirm Market Context Cards opens.
- [ ] Confirm Research Dashboard opens.
- [ ] Confirm no homepage console blockers.

Representative homepage URL:

```text
https://shaner1niner.github.io/sentiment-dash/?cb=cutover_check_home_001
```

### Representative asset QA

Review a small set across asset types.

Recommended:

```text
BTC
ETH
SOL
XRP
AVAX
PLTR
MSTR
AMZN
```

For each reviewed asset:

- [ ] briefing remains populated
- [ ] Market Tape remains populated
- [ ] selected detail updates
- [ ] event timeline updates
- [ ] chart title matches selected asset / frequency / range
- [ ] chart traces render
- [ ] no app-blocking runtime errors

### Smoke validation

Run before cutover PR:

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

Minimum acceptable smoke set for a documentation-only checklist update:

```powershell
python scripts\smoke_module_plotly_renderer_parity.py
python scripts\smoke_module_market_tape_parity.py
python scripts\smoke_fix26_dashboard.py
```

## Cutover branch rules

The eventual cutover branch should be named:

```text
promote/module-runtime-production-route-cutover-v1
```

The cutover PR should be limited to route/navigation entry files.

It should not include generated payload/data files.

It should not delete legacy dashboard files.

It should not modify the monolith runtime implementation except for explicit navigation/route fallback references, if required.

## First cutover target

The first route cutover should only promote the public/default entry point.

Recommended first-cutover stance:

```text
public/default route -> module runtime
legacy public dashboard -> retained fallback
member/research routes -> unchanged unless explicitly approved
candidate route -> retained
```

## Deferred / explicit-approval items

These should remain out of the first cutover unless explicitly approved:

- member dashboard route replacement
- research dashboard route replacement
- deletion of legacy public dashboard fallback
- deletion of module candidate page
- payload regeneration
- monolith removal
- broad chart-store or briefing payload edits
- deeper hover/card parity beyond current typed marker traces

## Rollback plan

The rollback path must remain simple:

1. Revert the cutover PR.
2. Confirm homepage public dashboard card points back to the legacy public dashboard.
3. Confirm legacy public/member dashboard files still exist.
4. Confirm module candidate page still exists as a parallel surface.
5. Run smoke checks.
6. Re-test homepage navigation.

Rollback should not require payload regeneration.

Rollback should not require restoring deleted dashboard files from history.

## Production cutover PR template

Use this title:

```text
Promote module runtime to production public dashboard route
```

Use this body:

```markdown
## Summary
- promote the public dashboard route/default card to the module runtime surface
- retain the legacy public dashboard as a fallback route
- retain the module candidate page as a direct QA/debug surface
- keep Market Context Cards and Research Dashboard links unchanged

## Validation
- `python scripts\smoke_module_plotly_renderer_parity.py`
- `python scripts\smoke_module_market_tape_parity.py`
- `python scripts\smoke_module_runtime_harness.py`
- `python scripts\smoke_module_briefing_panel_parity.py`
- `python scripts\smoke_module_store_control_state.py`
- `python scripts\smoke_module_asset_payload_loading.py`
- `python scripts\smoke_display_range_window_core.py`
- `python scripts\smoke_fix26_dashboard.py`
- live homepage browser QA
- live module dashboard browser QA
- legacy public dashboard fallback QA

## Notes
- public/default route cutover only
- no payload regeneration
- no monolith deletion
- no member/research route replacement
- rollback path: revert this PR
```

## Post-cutover browser QA

After the cutover merges and deploys, confirm:

- [ ] homepage loads
- [ ] public dashboard route opens module runtime
- [ ] legacy public dashboard fallback opens
- [ ] Market Context Cards route opens
- [ ] Research Dashboard route opens
- [ ] candidate route still opens
- [ ] BTC module view renders
- [ ] ETH module view renders
- [ ] marker-rich asset shows typed `Regime:` traces
- [ ] event timeline depth remains visible
- [ ] chart stack remains visible
- [ ] no app-blocking runtime errors

## Success definition

The cutover is successful only if:

```text
users can reach the module runtime from the public dashboard default
legacy fallback remains one click/path away
all non-dashboard routes remain available
smoke suite passes
browser QA passes
no generated payload churn enters the route cutover PR
rollback is a simple PR revert
```

## Final recommendation

Merge this checklist.

Then perform one final live homepage-to-candidate browser pass.

Only after that explicit approval should the promotion branch `promote/module-runtime-production-route-cutover-v1` be created.
