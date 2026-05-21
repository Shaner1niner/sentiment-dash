# Public Dashboard Release Checklist

Use this checklist for dashboard-facing changes in `sentiment-dash`. It is intentionally lightweight: enough structure to prevent regressions, without slowing down product iteration.

The goal is simple:

```text
Ship dashboard improvements with clean git state, targeted smoke coverage, public QA coverage, and visual confidence.
```

## 1. Start clean

```powershell
cd C:\Users\shane\sentiment-dash
git switch main
git pull origin main
git status --short
```

Expected:

```text
# no output from git status --short
```

If Git reports an unfinished merge:

```powershell
git merge --abort
git switch main
git pull origin main
git status --short
```

Do not start a new dashboard branch while `MERGE_HEAD` exists.

## 2. Create a focused branch

Use one branch per product slice:

```powershell
git switch -c feature/short-dashboard-slice-v1
```

Preferred branch families:

```text
feature/     user-facing behavior
fix/         defect repair
polish/      styling/copy/layout refinement
docs/        documentation/process only
qa/          smoke or validation-only changes
```

## 3. Keep the scope narrow

Before editing, write the intended scope in one sentence:

```text
This PR changes only [component/helper/doc] so that [reader-facing benefit].
```

Good examples:

```text
Add a compact freshness pill below the public dashboard banner.
Protect attention context behavior with a focused smoke test.
Document the public dashboard release checklist.
```

Avoid bundling unrelated changes such as payload refreshes, backend contracts, visual polish, and docs in one PR unless they are required for the same release.

## 4. Run targeted smoke first

Run the smoke that directly protects the feature you changed.

Examples:

```powershell
python scripts\smoke_data_freshness_indicator.py
python scripts\smoke_attention_context_parity.py
python scripts\smoke_research_source_mix_panel.py
python scripts\smoke_public_dashboard_ux_contract.py
```

If the feature has no smoke yet, add a small one before merging.

## 5. Run public dashboard QA

Normal dashboard QA:

```powershell
python scripts\run_public_dashboard_qa.py --skip-full-dashboard-smoke
```

Use the full dashboard smoke when the change affects generated payload shape, embedded HTML routing, or chart bootstrap behavior:

```powershell
python scripts\run_public_dashboard_qa.py
```

Expected final line:

```text
[OK] Public dashboard QA bundle passed
```

## 6. Visual QA for UI changes

For any visible dashboard change, inspect the public route manually.

Desktop checklist:

```text
- component is visible where expected
- component does not crowd the controls
- detail copy is secondary when appropriate
- chart area remains readable
- no unexpected horizontal scroll
- no duplicate labels or stale UI fragments
```

Mobile / narrow-width checklist:

```text
- controls wrap cleanly
- new component does not become a giant banner
- copy remains readable
- no horizontal overflow
- chart chrome remains usable
```

## 7. Public-language check

Dashboard copy should be reader-native.

Preferred language:

```text
fresh
reviewed
partial coverage
source warning
stale
attention
structure
confirmation
participation quality
setup quality
```

Avoid exposing backend jargon:

```text
run_registry.jsonl
exit_code
blocking_count
stack trace
DB profile
MERGE_HEAD
```

Avoid financial-advice language:

```text
buy
sell
guaranteed
price target
trade instruction
this will happen
```

Preferred safety framing:

```text
SETA explains market emotion and setup quality, not price targets or trade instructions.
```

## 8. Pre-PR check

```powershell
git diff --check
git status --short
```

Then commit and push:

```powershell
git add <changed-files>
git commit -m "Short imperative summary"
git push -u origin <branch-name>
```

Open a PR with:

```text
Summary
Why
Validation
Guardrails / scope notes
Refs #issue-number
```

## 9. Merge and post-merge sync

After the PR is merged:

```powershell
git switch main
git pull origin main
git status --short
```

Expected:

```text
# no output from git status --short
```

Run the targeted smoke again when the PR touched core dashboard wiring:

```powershell
python scripts\run_public_dashboard_qa.py --skip-full-dashboard-smoke
```

## 10. Closeout note

On the issue, record:

```text
- PR number / merge commit
- targeted smoke result
- public dashboard QA result
- visual QA result if applicable
- any follow-up issues intentionally split out
```

A good closeout sentence:

```text
Closing as completed. Future refinements should be separate polish issues and target only observed defects.
```

## Quick command block

```powershell
cd C:\Users\shane\sentiment-dash
git switch main
git pull origin main
git status --short

python scripts\run_public_dashboard_qa.py --skip-full-dashboard-smoke
```

If `git status --short` is clean and the QA bundle passes, the local dashboard baseline is healthy.
