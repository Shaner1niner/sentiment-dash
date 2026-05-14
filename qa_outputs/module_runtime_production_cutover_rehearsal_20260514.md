# Module Runtime Production Cutover Rehearsal

## Purpose

Document a dry-run production cutover plan for moving the modular runtime work toward production/public/member embed usage.

This is a rehearsal and readiness report only. It does not perform the production cutover.

## Branch

`qa/module-runtime-production-cutover-rehearsal-v1`

## Current state entering rehearsal

The module runtime has completed the following checkpoints:

- module Market Tape interpretation parity
- browser QA for Market Tape click/control sync
- browser QA for object-log normalization
- Market Tape card copy source mapping
- selected detail panel
- filter chips
- detail deck
- event / confirmation timeline shell
- timeline copy polish
- final monolith gap review
- chart/control mode parity
- Plotly layout-axis sanitizer hotfix
- chart/control browser QA after sanitizer

Current decision from the final monolith gap review:

```text
Module Market Tape = interpretation-parity ready
Full production dashboard parity = not a full monolith replacement yet
Production cutover = not approved until rehearsal and rollback are documented
```

## Rehearsal conclusion

The module runtime is ready for a controlled production cutover rehearsal, but the actual production embed cutover should remain deferred until the cutover and rollback commands are reviewed one more time.

Recommended current status:

```text
Ready for cutover planning.
Not yet approved for live production embed cutover.
```

## Non-goals

- no production embed cutover in this branch
- no monolith edits in this branch
- no generated payload regeneration
- no runtime code changes
- no public/member dashboard file changes
- no cache-busting production link update

## Production surfaces to protect

Before any real cutover, these surfaces should remain recoverable:

- public dashboard entry page
- member dashboard entry page
- market context card page
- research dashboard page
- current monolith dashboard
- generated chart-store payloads
- generated briefing payloads
- GitHub Pages deployment path

## Candidate files likely involved in a future cutover

The exact future cutover branch should inspect current file names before editing, but the likely areas are:

```text
dashboard_fix26_app.js
dashboard_main.js
module_runtime_smoke_harness.html
public/member dashboard entry HTML files, if present
src/PlotlyRenderer.js
src/features/MarketTape.js
src/features/Controls.js
src/features/BriefingPanel.js
src/Store.js
```

Files that should not be changed during cutover unless explicitly intended:

```text
fix26_chart_store_assets/
fix26_chart_store_member.json
fix26_chart_store_member_index.json
fix26_chart_store_public.json
fix26_chart_store_public_index.json
fix26_screener_store.json
generated_briefings_reviewed.json
generated_briefings_reviewed_v2.json
```

## Pre-cutover checklist

Before a real cutover branch begins:

1. Confirm `main` is clean.
2. Confirm latest GitHub Pages deployment is green.
3. Confirm no generated payload churn is present.
4. Confirm module runtime harness works with a fresh cache-buster.
5. Confirm public/member dashboards still load.
6. Confirm rollback target commit is known.
7. Confirm the cutover branch touches only expected files.
8. Confirm no generated payload files are staged.
9. Confirm local browser QA matrix has passed.
10. Confirm PR body states exactly what production surface is changing.

## Recommended real cutover branch name

```text
promote/module-runtime-production-embed-candidate-v1
```

## Recommended rollback branch name

```text
revert/module-runtime-production-embed-candidate-v1
```

## Dry-run cutover sequence

The future real cutover should follow this shape:

```powershell
cd C:\Users\shane\sentiment-dash

git checkout main
git pull origin main

git checkout -b promote/module-runtime-production-embed-candidate-v1

git status --short
```

Then make only the minimal production embed changes required to route the chosen production surface to the module runtime.

After edits:

```powershell
git status --short
git diff --stat
```

Expected cutover files should be a short, explainable list. If generated payload files appear, stop and restore them.

```powershell
git restore fix26_chart_store_assets `
  fix26_chart_store_member.json `
  fix26_chart_store_member_index.json `
  fix26_chart_store_public.json `
  fix26_chart_store_public_index.json `
  fix26_screener_store.json `
  generated_briefings_reviewed.json `
  generated_briefings_reviewed_v2.json
```

Then run validation:

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

Commit only the intended production embed files:

```powershell
git add <intended-cutover-files-only>
git commit -m "Promote module runtime production embed candidate"
git push -u origin promote/module-runtime-production-embed-candidate-v1
```

## Dry-run browser validation after candidate deployment

Use a fresh cache-busted production URL and module reference URL.

Minimum browser QA:

```text
- public dashboard loads
- member/dashboard surface loads, if applicable
- module runtime loads
- Market Tape card grid renders
- filter chips render
- selected detail renders
- detail deck renders
- event timeline renders
- chart renders without Plotly anchor errors
- asset dropdown follows card click
- briefing follows clicked asset
- chart title follows clicked asset
- candles mode renders
- line mode renders
- price-only mode renders
- all-visible mode renders
- no app-blocking console errors
```

Suggested assets:

```text
BTC
ETH
DOGE
AVAX
BNB
MSTR
MSFT
SOL
```

## Rollback sequence

If the production embed candidate causes a live regression, rollback should be simple and commit-based.

Option A: revert the merge commit from GitHub UI.

Use GitHub's **Revert** button on the merged production embed PR, then merge the generated revert PR.

Option B: command-line revert.

```powershell
cd C:\Users\shane\sentiment-dash

git checkout main
git pull origin main

git checkout -b revert/module-runtime-production-embed-candidate-v1

git revert <merge_commit_sha>

git status --short
git diff --stat

python scripts\smoke_fix26_dashboard.py

git push -u origin revert/module-runtime-production-embed-candidate-v1
```

Rollback PR title:

```text
Revert module runtime production embed candidate
```

Rollback PR notes should include:

```text
- restores previous production embed behavior
- no payload regeneration
- no generated chart-store changes
- no unrelated edits
```

## Cutover approval gate

Do not perform the real cutover until all items below are true:

- this rehearsal report is merged
- rollback sequence is accepted
- final cutover file list is known
- one more browser QA pass is planned
- generated payload churn cleanup command is ready
- production cache-buster plan is ready
- user explicitly approves production embed change

## Known risk areas

### Generated payload churn

The local workflow frequently produces changes in:

```text
fix26_chart_store_assets/
fix26_chart_store_member.json
fix26_chart_store_member_index.json
fix26_chart_store_public.json
fix26_chart_store_public_index.json
fix26_screener_store.json
generated_briefings_reviewed.json
generated_briefings_reviewed_v2.json
```

These should not be committed during cutover unless the specific branch is a payload regeneration branch.

### Browser cache

GitHub Pages caching can make production QA confusing. Every cutover test should use a fresh cache-buster.

### Chart/control mode regressions

The Plotly `anchor` regression was fixed by the layout-axis sanitizer, but chart/control modes should remain part of the final browser QA matrix.

### Monolith parity expectations

The module should not be represented as full monolith parity. It is ready as a cleaner Market Tape interpretation layer, while the monolith still remains the richer research cockpit.

## Recommended next steps

1. Merge this rehearsal report.
2. Add a rollback runbook document if desired.
3. Create the production embed candidate branch only after explicit approval.
4. Keep the production embed candidate minimal.
5. Perform browser QA before merge.
6. Use GitHub revert or command-line revert if the candidate regresses.

## Final recommendation

Proceed to merge this rehearsal report as documentation.

Do not perform production cutover in this branch.

After this report is merged, the next safe branch is either:

```text
docs/module-runtime-rollback-runbook-v1
```

or, if explicit approval is given:

```text
promote/module-runtime-production-embed-candidate-v1
```
