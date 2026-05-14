# Unified SETA Roadmap

**Version:** v1.0  
**Date:** 2026-05-14  
**Working project:** SETA / The Emotion Investor / sentiment-dash  
**Primary repo target:** `docs/SETA_ROADMAP.md`

---

## 1. Executive Summary

This roadmap consolidates three planning streams into one operating plan:

1. **Dashboard stabilization roadmap** — preserve the current working baseline, audit the full asset suite, close only proven gaps, then modularize safely.
2. **Module runtime / Market Tape roadmap** — continue the controlled migration from monolith behavior into modular runtime components, using smoke tests and browser QA gates before any production embed cutover.
3. **Broader SETA product roadmap** — align dashboard, newsletters, social content, scorecards, attention maps, and revenue goals into one productized workflow.

The current mission is:

> Stabilize the dashboard and briefing system across the full asset suite, complete modular parity through small scoped branches, then return to the broader SETA product roadmap with a durable publishing, monetization, and QA system.

The operating rule is:

> Extract existing behavior first. Improve behavior second. Replace runtime wiring last.

---

## 2. North-Star Rules

### Do

- Keep `main` clean.
- Use one branch per proven gap or roadmap slice.
- Keep each PR either an audit, one fix, one parity extraction, one QA report, or one documentation step.
- Preserve smoke tests and manual QA gates on every PR.
- Separate payload refresh, dashboard runtime changes, and generator changes unless the branch is explicitly scoped for payload promotion.
- Maintain a rollback path for every production-facing change.
- Add repo-native docs for decisions that should outlive chat context.

### Do Not

- Do big-bang rewrites.
- Merge old/refactor-pipeline work as-is.
- Combine payload generation, dashboard runtime wiring, and copy logic in one PR.
- Patch from screenshots alone when a fixture or full-suite audit is needed.
- Cut over production embeds until module runtime parity and cutover rehearsal are complete.

---

## 3. Current Locked Baseline

### Production baseline

- Production public/member embeds remain protected and must be verified on every relevant branch.
- The legacy monolith path remains the rollback reference until production module cutover is explicitly approved.
- The module runtime harness is the safe non-production surface for parity work.

### Current module runtime status

The module runtime path has made substantial progress:

- Runtime harness exists.
- Module chart rendering path exists.
- Asset payload loading path exists.
- Store/control synchronization exists.
- Reviewed briefing loader and briefing panel parity exist.
- Module Market Tape exists and now includes:
  - screener loading,
  - score/rank mapping,
  - richer card copy and tags,
  - click-to-asset sync,
  - selected detail,
  - filter chips,
  - detail deck,
  - event/confirmation timeline,
  - timeline copy polish.

### Current latest known branch sequence

The most recent completed module roadmap slice is:

```text
refactor/module-market-tape-timeline-copy-polish-v1
```

Recommended immediate next QA branch:

```text
qa/module-market-tape-timeline-copy-browser-qa-v1
```

---

## 4. Track A — Dashboard Stabilization

### Phase A0 — Preserve the Baseline

**Status:** done / locked  
**Goal:** keep `main` clean and avoid regression.  
**Rule:** every PR must be one of:

- audit,
- fix one proven gap,
- extract one small module without behavior change,
- document QA.

**Guardrails:**

- No stale-render regression.
- No bad range-window regression.
- No reviewed-copy fallback regression.
- No accidental generated payload churn.
- No production cutover without a rollback plan.

### Phase A1 — Full Asset-Suite Audit

**Goal:** expand confidence from spot checks to full asset coverage.

Recommended branch:

```powershell
git checkout main
git pull origin main
git checkout -b qa/full-asset-suite-dashboard-briefing-audit-v1
```

Audit dimensions:

- asset coverage,
- public/member availability,
- default range behavior,
- 3M first-load chart window,
- 6M wider-window behavior,
- asset-switch stale-render behavior,
- briefing/chip/chart agreement,
- reviewed vs deterministic fallback behavior,
- copy cleanliness,
- performance rough spots.

Deliverables:

```text
qa_outputs/full_asset_suite_dashboard_briefing_audit_YYYYMMDD.json
qa_outputs/full_asset_suite_dashboard_briefing_audit_YYYYMMDD.md
```

Decision output:

- payload promotion needed,
- asset-store regeneration needed,
- UI/code follow-up only,
- no action needed.

### Phase A2 — Close Only Proven Loose Ends

Do only what the audit proves is necessary.

Likely loose ends:

1. **Shared sentiment/price range matrix copy**  
   Confirm with true active bearish/bullish pressure fixtures. Do not patch from screenshots alone.

2. **Reviewed briefing coverage**  
   Decide whether reviewed samples should expand beyond current defaults.

3. **Full asset first-load range QA**  
   Confirm chart-window fixes hold outside BTC and usual test assets.

4. **Performance/slowness**  
   Identify whether slowness is payload size, Plotly rendering, event churn, stale async work, or embed environment.

5. **Squarespace vs GitHub Pages behavior**  
   Document differences and decide whether GitHub Pages needs a lighter QA mode.

Potential branches:

```text
qa/shared-zone-pressure-copy-fixtures-v1
fix/shared-zone-pressure-copy-matrix-v1
qa/full-suite-reviewed-coverage-v1
perf/dashboard-initial-load-profile-v1
qa/squarespace-vs-github-pages-embed-behavior-v1
```

---

## 5. Track B — Module Runtime / Market Tape Parity

### Phase B1 — Market Tape Timeline Copy Browser QA

**Status:** next immediate QA step.

Recommended branch:

```text
qa/module-market-tape-timeline-copy-browser-qa-v1
```

QA focus:

- timeline labels are less repetitive,
- fallback copy uses attention / direction / indicator context when available,
- selected detail still works,
- detail deck still works,
- filter chips still work,
- card clicks still update dropdown, briefing, Market Tape active state, and chart,
- no blocking console errors.

Expected deliverable:

```text
qa_outputs/module_market_tape_timeline_copy_browser_qa_YYYYMMDD.md
```

### Phase B2 — Final Market Tape Monolith Gap Review

Recommended branch:

```text
qa/module-market-tape-final-monolith-gap-review-v1
```

Goal:

Compare modular Market Tape to the production monolith one more time before treating Market Tape module parity as ready for cutover rehearsal.

Checklist:

- card grid density,
- chip behavior,
- selected asset highlighting,
- selected detail completeness,
- detail deck usefulness,
- event/timeline usefulness,
- chart interaction parity,
- dropdown/range/frequency sync,
- visual spacing and readability,
- mobile/viewport behavior if applicable.

Deliverable:

```text
qa_outputs/module_market_tape_final_monolith_gap_review_YYYYMMDD.md
```

### Phase B3 — Chart / Control Mode Parity Polish

Recommended branches:

```text
refactor/module-chart-control-mode-parity-v1
qa/module-chart-control-mode-browser-qa-v1
```

Focus:

- chart type: candles / line,
- scale mode: price overlays / all visible traces,
- ribbon modes,
- sentiment ribbon modes,
- regime visuals,
- attention modes,
- bands modes,
- timing view,
- display range changes,
- weekly vs daily behavior.

Goal:

Ensure the module runtime respects all user-facing controls, not merely that it renders a chart.

### Phase B4 — Production Cutover Rehearsal

Recommended branch:

```text
qa/module-runtime-production-cutover-rehearsal-v1
```

Scope:

- identify every production entry file,
- identify every GitHub Pages embed path,
- verify public/member mode entrypoints,
- verify cache-buster strategy,
- verify rollback path,
- verify `dashboard_fix26_app.js` remains available as fallback until intentionally retired.

Deliverable:

```text
qa_outputs/module_runtime_cutover_rehearsal_YYYYMMDD.md
```

### Phase B5 — Production Cutover Candidate

Recommended branch:

```text
promote/module-runtime-production-embed-candidate-v1
```

Scope:

- update public/member embed entrypoints to module runtime candidate,
- keep monolith file intact,
- use explicit cache token,
- avoid payload regeneration unless explicitly scoped,
- avoid behavior changes beyond runtime entry switch.

Validation:

- full smoke suite,
- public embed browser QA,
- member embed browser QA,
- module harness browser QA,
- production GitHub Pages refresh check,
- rollback command documented.

### Phase B6 — Post-Cutover QA and Rollback Guard

Recommended branches:

```text
qa/module-runtime-production-cutover-browser-qa-v1
docs/module-runtime-rollback-runbook-v1
```

Confirm:

- public dashboard works,
- member dashboard works,
- chart modes work,
- Market Tape works,
- briefing panel works,
- no fatal console errors,
- cache token updated correctly,
- rollback path is documented and tested.

---

## 6. Track C — Smart Modularization

This track should proceed only after the current dashboard baseline is stable and module Market Tape parity is validated.

Do not start by replacing PlotlyRenderer as the centerpiece. The production renderer contains real behavior, including MACD/bar width handling and relayout listener behavior. Start with pure logic seams.

### Recommended order

1. **Display range/window core**

```text
refactor/display-range-window-core-v1
```

Extract visible-window / display-range calculations. No Plotly replacement.

2. **Reviewed briefing context core**

```text
refactor/reviewed-briefing-context-core-v1
```

Extract exact/compatible reviewed fallback rules. Preserve accepted/rejected fallback behavior.

3. **Dashboard control key core**

```text
refactor/dashboard-control-key-core-v1
```

Extract control-key/render-key logic. Store must eventually track more than current asset.

4. **Chart trace builders**

```text
refactor/chart-trace-builders-v1
```

Extract pure trace builders. No rendering replacement yet.

5. **Plotly renderer parity**

```text
refactor/plotly-renderer-parity-v1
```

Only after trace/window/control logic has parity tests.

### Modularization rule

```text
Extract existing behavior first.
Improve behavior second.
Replace runtime wiring last.
```

---

## 7. Track D — Briefing and Reviewed Payload Roadmap

### Objective

Make SETA briefing behavior reliable, explainable, and scalable across assets, ranges, and public/member surfaces.

### Near-term priorities

- Confirm exact reviewed fallback behavior across the full asset suite.
- Identify assets/ranges with deterministic-only fallbacks.
- Decide whether reviewed samples should expand beyond current defaults.
- Keep reviewed fallback context-compatible; reject mismatched stale context.
- Preserve source breadth / participation quality logic.

### Medium-term priorities

- Build reviewed briefing coverage report by asset / frequency / range.
- Add generation QA for reviewed copy freshness and compatibility.
- Separate product-facing copy from internal diagnostic copy.
- Create a durable “briefing card contract” doc for generator and runtime consumers.

### Potential branches

```text
qa/full-suite-reviewed-coverage-v1
docs/reviewed-briefing-card-contract-v1
refactor/reviewed-briefing-context-core-v1
fix/reviewed-briefing-coverage-gaps-v1
```

---

## 8. Track E — Data, Payload, and Asset Coverage

### Objective

Keep dashboard inputs trustworthy while avoiding accidental payload churn.

### Known policy

Payload refresh should be explicit, named, and isolated. It should not sneak into UI/runtime PRs.

### Priorities

- Full asset-suite audit.
- Public/member asset coverage review.
- SPY pending-coverage decision.
- Chart-store asset coverage review.
- Screener payload shape stability.
- Reviewed briefing payload shape stability.
- Bluesky data integration follow-through where relevant.

### Potential branches

```text
qa/asset-coverage-public-member-matrix-v1
fix/member-public-pending-asset-coverage-policy-v1
data/reviewed-briefing-payload-coverage-expansion-v1
data/chart-store-asset-coverage-regeneration-v1
```

### Gates for payload regeneration

Before regenerating payloads:

- declare reason,
- declare input files/scripts,
- declare affected outputs,
- run full smoke suite,
- diff payload-size and asset counts,
- document rollback.

---

## 9. Track F — Productization Roadmap

### Product north star

SETA / The Emotion Investor should become a repeatable sentiment intelligence product, not just a dashboard project.

The product promise:

> Help readers see market participation, narrative structure, and attention shifts before reducing the story to price predictions or trade signals.

### Audience

- market-curious readers,
- crypto/equity sentiment watchers,
- newsletter subscribers,
- investors who want narrative structure without direct trading calls,
- potential paying members who value dashboards, context, and repeatable weekly reads.

### Product layers

1. **Free/public layer**
   - public dashboard subset,
   - public scorecards,
   - public narrative snippets,
   - social posts,
   - weekly free newsletter.

2. **Member layer**
   - expanded asset suite,
   - richer Market Tape context,
   - deeper reviewed briefing coverage,
   - scorecard archive,
   - attention map snapshots,
   - weekly member memo.

3. **Premium/analyst layer**
   - downloadable reports,
   - deeper dashboard views,
   - historical sentiment/regime context,
   - custom watchlists later.

### Revenue target

Initial target: build toward a modest subscription/content business capable of reaching roughly $20k/year.

Possible paths:

- Substack paid tier,
- member dashboard access,
- sponsored newsletter placements later,
- downloadable monthly sentiment reports,
- affiliate/content partnerships only if aligned with trust.

---

## 10. Track G — Content and Publishing Roadmap

### Objective

Turn dashboard output into repeatable, high-quality content without overpromising predictions.

### Content pillars

1. **Market Tape Weekly**
   - what participation is doing,
   - what assets are attention leaders,
   - where sentiment/price confirmation is missing,
   - what narratives are gaining or fading.

2. **Emotion Investor Notes**
   - short educational posts,
   - narrative structure explainers,
   - market psychology observations.

3. **Scorecard drops**
   - standardized asset scorecards,
   - consistent visual template,
   - no price targets/trade signals.

4. **Attention maps**
   - Reddit / Bluesky / cross-source attention views,
   - attention vs validation framing,
   - participation-quality commentary.

5. **Website product pages**
   - clear positioning,
   - dashboard screenshots,
   - newsletter signup,
   - member/public separation.

### Publishing workflow

Recommended weekly loop:

```text
Monday: full dashboard QA / asset scan
Tuesday: Market Tape notes
Wednesday: scorecard/social snippets
Thursday: attention map or narrative context
Friday: weekly newsletter draft
Weekend: archive, metrics review, roadmap grooming
```

### Content voice

SETA / The Emotion Investor should avoid price predictions and trade calls. The default framing should be:

- participation,
- narrative structure,
- attention vs validation,
- confirmation / non-confirmation,
- source breadth,
- regime context.

---

## 11. Track H — Visual System Roadmap

### Locked visual templates

Maintain consistent visuals across product artifacts.

#### Sentiment Scorecard v2

- ETH/META-style layout.
- Simplified two-color indicator bar scheme.
- Asset brand color + dark gray.
- Subtle gradient / optional glow on filled bars.
- Bar length encodes strength.
- Consistent Dashboard Score, AI Prediction box, and indicator bar placement.

#### SETA Attention Map v2

- Wide dark card scatter.
- Average sentiment vs weighted engagement log.
- Split lines at sentiment zero and engagement median.
- Quadrant labels.
- Footer legend band.
- Collision-safe labels.
- Reddit version avoids centroid/cluster glows; Bluesky version allows depth/grid/cluster glow style.

### Roadmap

- Move scorecard generation into a repeatable pipeline.
- Create a scorecard archive.
- Build social export sizes.
- Standardize asset brand colors.
- Add QA checklist for generated visuals.
- Connect scorecards to newsletter snippets.

Potential branches/files:

```text
docs/scorecard_visual_system_v2.md
docs/attention_map_visual_system_v2.md
visuals/scorecard_export_pipeline_v1
visuals/attention_map_export_pipeline_v1
```

---

## 12. Track I — Social, Newsletter, and Website Funnel

### Objective

Convert dashboard insight into audience growth and recurring revenue.

### Funnel

```text
Social post -> newsletter signup -> free weekly SETA memo -> member dashboard/report -> paid subscriber retention
```

### Immediate priorities

- Define homepage positioning.
- Add newsletter signup CTA.
- Create weekly content templates.
- Create repeatable social post batches.
- Track simple metrics:
  - impressions,
  - profile visits,
  - newsletter signups,
  - open rate,
  - paid conversion,
  - churn.

### Product pages

Recommended website pages:

- Home / What is SETA?
- Dashboard preview.
- Market Tape explainer.
- Attention Maps.
- Scorecards.
- Newsletter archive.
- Subscribe / Member access.

---

## 13. Track J — Automation and QA Reporting

### Objective

Make quality checks repeatable and less dependent on manual memory.

### Current QA pattern

- smoke scripts,
- browser QA reports,
- branch-specific PR descriptions,
- manual GitHub Pages checks,
- generated `qa_outputs` docs.

### Future improvements

- Add a master QA command.
- Add asset-suite audit runner.
- Add browser QA checklist templates.
- Add generated roadmap status report.
- Add PR body generator from branch type.
- Add payload churn detector.
- Add pre-commit branch guard and generated-file restore instructions.

Potential branches:

```text
tools/master-dashboard-qa-runner-v1
tools/branch-pr-template-generator-v1
tools/payload-churn-guard-v1
docs/browser-qa-checklist-template-v1
```

---

## 14. Immediate Next Branch Sequence

### Step 1 — Sync after #123

```powershell
cd C:\Users\shane\sentiment-dash

git checkout main
git pull origin main
git branch -D refactor/module-market-tape-timeline-copy-polish-v1
git status
```

### Step 2 — Browser QA for timeline copy polish

```powershell
git checkout -b qa/module-market-tape-timeline-copy-browser-qa-v1
```

Open:

```text
https://shaner1niner.github.io/sentiment-dash/module_runtime_smoke_harness.html?cb=module_market_tape_timeline_copy_001
```

QA focus:

- timeline copy is less repetitive,
- fallback rows use richer context,
- selected detail is still populated,
- detail deck is still populated,
- filter chips still work,
- chart follows clicked asset,
- briefing follows clicked asset,
- no blocking console errors.

### Step 3 — Final Market Tape gap review

```text
qa/module-market-tape-final-monolith-gap-review-v1
```

### Step 4 — Add this roadmap to the repo

```text
docs/SETA_ROADMAP.md
```

Recommended branch:

```text
docs/seta-roadmap-v1
```

### Step 5 — Full asset-suite audit or chart/control parity

Choose based on confidence after timeline QA:

```text
qa/full-asset-suite-dashboard-briefing-audit-v1
```

or

```text
refactor/module-chart-control-mode-parity-v1
```

---

## 15. Repo Documentation Plan

Recommended docs to add:

```text
docs/SETA_ROADMAP.md
docs/MODULE_RUNTIME_CUTOVER_PLAN.md
docs/MODULE_RUNTIME_ROLLBACK_RUNBOOK.md
docs/BRIEFING_CARD_CONTRACT.md
docs/SCORECARD_VISUAL_SYSTEM_V2.md
docs/ATTENTION_MAP_VISUAL_SYSTEM_V2.md
docs/CONTENT_PUBLISHING_WORKFLOW.md
```

Priority order:

1. `docs/SETA_ROADMAP.md`
2. `docs/MODULE_RUNTIME_CUTOVER_PLAN.md`
3. `docs/MODULE_RUNTIME_ROLLBACK_RUNBOOK.md`
4. `docs/BRIEFING_CARD_CONTRACT.md`
5. `docs/CONTENT_PUBLISHING_WORKFLOW.md`

---

## 16. PR and Branch Discipline

### Branch types

```text
qa/...        audit or browser QA report only
fix/...       one proven bug/gap
refactor/...  parity-preserving extraction or module improvement
docs/...      repo documentation only
perf/...      profiling or performance improvement
promote/...   production-facing cutover candidate
```

### Required PR body sections

```markdown
## Summary
- ...

## Validation
- `python scripts\...`
- manual browser QA if applicable

## Notes
- no production embed cutover unless this is a promote branch
- no monolith edits unless explicitly scoped
- no payload regeneration unless explicitly scoped
```

### Generated payload policy

Before committing, run:

```powershell
git status --short
git diff --stat
```

If generated payload churn appears unexpectedly, restore it before commit:

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

---

## 17. Cutover Gates

Production module cutover should not happen until all of these are true:

- module harness smoke passes,
- full dashboard smoke passes,
- module briefing parity passes,
- module Market Tape parity passes,
- chart/control mode parity is verified,
- full asset-suite audit is reviewed,
- public/member embed plan is documented,
- rollback runbook exists,
- browser QA confirms public/member embeds,
- cache token strategy is explicit,
- no accidental payload regeneration is included,
- `dashboard_fix26_app.js` remains available as fallback unless retirement is explicitly approved.

---

## 18. Parking Lot / Deferred Ideas

These should not interrupt stabilization and cutover work:

- custom watchlists,
- advanced member-only dashboards,
- automated social image generation,
- personalized alerting,
- paid downloadable reports,
- deeper statistical backtesting overlays,
- expanded Bluesky/Reddit attention map automation,
- affiliate/sponsor experiments,
- AI-generated daily briefings at scale,
- mobile-first dashboard redesign.

---

## 19. Current Working Memory Summary

**Current mission:**  
Stabilize the dashboard and briefing system across the full asset suite, complete module parity safely, then return to the broader SETA product roadmap.

**Do not:**

- merge old refactor-pipeline as-is,
- do big-bang rewrites,
- mix payload refresh, dashboard runtime changes, and generator logic in one PR.

**Do:**

- audit first,
- make small scoped branches,
- preserve parity,
- keep smoke tests and manual QA gates attached to each PR,
- write durable roadmap docs into the repo.

---

## 20. Recommended Next Action

Create and merge a QA report for #123:

```text
qa/module-market-tape-timeline-copy-browser-qa-v1
```

Then add this roadmap to the repo:

```text
docs/SETA_ROADMAP.md
```

This gives the project a durable combined roadmap and prevents roadmap context from living only in chat.
