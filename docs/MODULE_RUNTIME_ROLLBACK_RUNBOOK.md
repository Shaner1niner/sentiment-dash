# Module Runtime Rollback Runbook

## Purpose

Provide a durable rollback runbook for any future module runtime production embed candidate.

This runbook is intentionally conservative. It assumes the production embed candidate may affect GitHub Pages public/member surfaces and must be reversible quickly without touching generated payloads.

## Current status

The module runtime has completed:

- Market Tape interpretation parity
- Market Tape browser sync QA
- object-log normalization
- card-copy source mapping
- selected detail panel
- filter chips
- detail deck
- event / confirmation timeline shell
- timeline copy polish
- final monolith gap review
- chart/control mode parity
- Plotly layout-axis sanitizer hotfix
- chart/control browser QA
- production cutover rehearsal report

Production cutover is still not performed by this document.

## Non-goals

- no production embed cutover
- no monolith edits
- no generated payload regeneration
- no runtime code changes
- no public/member dashboard file changes

## Rollback principle

Every production embed candidate must be reversible by one of two paths:

1. GitHub UI revert of the merged PR.
2. Command-line `git revert` of the production embed merge commit.

The rollback should restore the prior production embed behavior without regenerating payloads.

## Files that should usually remain untouched during rollback

Unless the production embed candidate explicitly changed these files, do not include generated payload files in rollback PRs:

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

If these files appear in `git status --short`, stop and restore them before committing:

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

## Pre-rollback triage

Before reverting, identify the failure class:

| Failure | Action |
|---|---|
| Public/member page does not load | Revert immediately |
| Chart panel fails to render | Revert unless a trivial hotfix is already validated |
| Asset dropdown/card sync broken | Revert unless isolated to QA-only harness |
| Briefing sync broken | Revert unless isolated to QA-only harness |
| Generated payload mismatch | Revert production embed and do not regenerate payloads |
| Cosmetic spacing issue only | Consider hotfix instead of revert |
| Cache-only issue | Clear cache / use cache-buster before reverting |

## GitHub UI rollback path

Use this path when the production embed candidate has already been merged and GitHub shows a **Revert** button.

1. Open the merged production embed PR.
2. Click **Revert**.
3. Let GitHub create the revert PR.
4. Review the revert PR file list.
5. Confirm the revert PR does not include generated payload churn.
6. Merge the revert PR.
7. Wait for GitHub Pages deployment.
8. Run the post-rollback browser QA checklist.

Rollback PR title:

```text
Revert module runtime production embed candidate
```

Rollback PR notes:

```markdown
## Summary
- revert module runtime production embed candidate
- restore prior production dashboard/embed behavior
- preserve generated payloads

## Validation
- reviewed revert file list
- confirmed generated payload files are not included
- ran post-rollback smoke/browser QA

## Notes
- rollback only
- no payload regeneration
- no unrelated edits
```

## Command-line rollback path

Use this path when you want local control over the revert commit.

```powershell
cd C:\Users\shane\sentiment-dash

git checkout main
git pull origin main

git checkout -b revert/module-runtime-production-embed-candidate-v1

git revert <merge_commit_sha>
```

Then inspect the working tree:

```powershell
git status --short
git diff --stat
```

If generated payload files appear, restore them:

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

Run smoke checks:

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

Commit and push:

```powershell
git status --short
git add <revert-files-only>
git commit -m "Revert module runtime production embed candidate"
git push -u origin revert/module-runtime-production-embed-candidate-v1
```

## Post-rollback browser QA checklist

After rollback merge and GitHub Pages deployment:

### Production/dashboard surface

- public dashboard loads
- member/dashboard surface loads, if applicable
- current production dashboard route loads
- no app-blocking console errors
- no broken script references
- no blank chart region
- navigation cards still work

### Module/reference surface

- module runtime smoke harness still loads
- Market Tape cards render
- filter chips render
- selected detail renders
- detail deck renders
- event timeline renders
- chart renders
- asset dropdown follows card click
- briefing follows selected asset
- chart title follows selected asset

### Suggested browser assets

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

### Suggested control checks

```text
Candles
Line
Price + Price Overlays
Price Only
All Visible Traces
Sentiment ribbon
Attention / overlay marks
Daily 3M
Daily 6M
Daily YTD
Weekly 6M or 1Y
```

## Cache-buster guidance

Use a new cache-buster for every post-rollback browser test:

```text
?cb=rollback_verify_001
?cb=rollback_verify_002
?cb=rollback_verify_<date>_<shortsha>
```

If GitHub Pages appears stale:

1. Confirm the deployment is complete.
2. Open the URL with a fresh cache-buster.
3. Hard refresh.
4. Test in another browser or private window.
5. Only then assume the rollback did not deploy correctly.

## Emergency stop conditions

If any of the following occur, stop further edits and revert:

- production public dashboard does not load
- chart render fails with a runtime exception
- asset selection breaks globally
- generated payload files appear in the cutover PR unexpectedly
- public/member embed points to missing script path
- GitHub Pages deployment completes but production route is blank

## Hotfix instead of rollback

A hotfix can be considered instead of rollback only when all are true:

- production page still loads
- failure is isolated and well understood
- patch is one or two files
- smoke suite passes locally
- browser QA verifies the fix
- generated payloads are not touched

Examples where hotfix may be acceptable:

- missing layout axis guard
- safe null handling for optional control field
- harmless display label typo
- QA-only console logging polish

Examples where rollback is preferred:

- blank production dashboard
- broken asset selection
- broken script route
- chart cannot render
- payload mismatch affecting many assets

## Required PR review items for any production embed candidate

Before merging a production embed candidate, confirm:

- file list is minimal
- generated payloads are absent
- rollback target is known
- smoke suite passed
- browser QA plan exists
- cache-buster is included in QA notes
- user explicitly approved production embed cutover

## Required PR review items for any rollback PR

Before merging a rollback PR, confirm:

- revert file list matches original cutover files
- generated payloads are absent
- no unrelated docs/code edits are included
- post-rollback smoke checklist is included
- post-rollback browser QA plan is included

## Recommended branch names

Production embed candidate:

```text
promote/module-runtime-production-embed-candidate-v1
```

Rollback branch:

```text
revert/module-runtime-production-embed-candidate-v1
```

Rollback QA branch, if needed:

```text
qa/module-runtime-production-rollback-browser-qa-v1
```

## Final rule

Do not regenerate payloads as part of rollback.

Rollback should restore routing/embedding behavior only. Payload generation should remain a separate, explicit branch if ever needed.
