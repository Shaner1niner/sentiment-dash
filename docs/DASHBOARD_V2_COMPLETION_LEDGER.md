# Dashboard v2 Completion Ledger

Audit date: 2026-05-01

Base branch: `main`

Base commit inspected: `aa310aa` (`Automated SETA website refresh`)

Audit branch: `dashboard-v2-completion-ledger`

## Purpose

This ledger converts the current repo state into a completion plan. It is meant to keep SETA moving toward a finished product without mixing unrelated dashboard logic, generated payloads, refresh scripts, content publishing, and public copy changes in the same patch.

No behavior changes are included in this ledger.

## What Complete Should Mean

Treat Dashboard v2 as complete when these are true:

- Public dashboard loads reliably from the chosen static host.
- Member dashboard loads reliably for the intended member asset set.
- Market Context cards page loads and links cleanly with the dashboard.
- Public copy stays educational, public-safe, and free of buy/sell, forecast, guarantee, or personalized advice language.
- Generated public/member payloads match the manifest asset contract, or missing assets are deliberately documented.
- Core smoke tests pass without stale expectations.
- Daily refresh can run from Shane's production machine with clear preflight failures when local dependencies are missing.
- Content pipeline remains draft-only and preserves `posting_performed=false`.
- Golden screenshots exist for the recurring acceptance assets.

## Current Product Surfaces

### 1. Dashboard Shells

Active files:

- `interactive_dashboard_fix24_public_embed.html`
- `interactive_dashboard_fix24_member_embed.html`
- `dashboard_fix26_app.js`
- `dashboard_fix26_base.css`
- `dashboard_fix26_mode_manifest.json`

Current posture:

- The repo is a static dashboard and payload system, not a React, Vite, or Next app.
- Public/member behavior is manifest-driven.
- The historical `fix24` embed filenames still load the current Fix 26 app.
- `dashboard_fix26_app.js` contains accumulated phase patches for performance diagnostics, custom dropdowns, band layer policy, alert/overlap behavior, Market Tape, glossary/tooltips, and score history help.
- The JavaScript app already includes several items that the older roadmap listed as future work, including hybrid overlap confirmation logic, alert funnel diagnostics, alert side panel behavior, Market Tape production UI, and MACD sentiment overlay polish.

### 2. Dashboard Payloads

Current generated payloads:

- `fix26_chart_store_public.json`
- `fix26_chart_store_member.json`
- `fix26_screener_store.json`

Observed payload state:

| Payload | Mode / model | Included assets | Daily rows | Weekly rows | Notes |
| --- | --- | ---: | ---: | ---: | --- |
| `fix26_chart_store_public.json` | public | 8 | 2725 | 395 | Generated 2026-05-01 18:13 UTC |
| `fix26_chart_store_member.json` | member | 27 | 7788 | 1136 | Generated 2026-05-01 18:13 UTC |
| `fix26_screener_store.json` | `phase_g_market_tape_v1` | 27 terms | n/a | n/a | 9 sections |

Manifest mismatch to track:

- Public manifest configures 9 assets but payload includes 8.
- Member manifest configures 28 assets but payload includes 27.
- Missing asset in both modes: `SPY`.
- `SPY` is also absent from the screener terms inspected during this audit.

Shane decision:

- The missing `SPY` data is an upstream pipeline issue, not a local dashboard issue.
- Keep `SPY` eligible/configured here so it functions normally once the upstream issue is corrected.
- Local smoke checks should surface the gap clearly without forcing a dashboard-side workaround.

### 3. Market Tape And Screener

Current posture:

- The app contains `phaseG_market_tape_metric_deck_v8`.
- The smoke test confirms `SETA Market Tape`, `marketTapeFamily`, and `fix26_screener_store.json` hooks.
- Screener store terms inspected: `AAPL`, `AMD`, `AMZN`, `AVAX`, `BNB`, `BTC`, `COIN`, `DOGE`, `DXY`, `ETH`, `GLD`, `GOOGL`, `LINK`, `META`, `MSFT`, `MSTR`, `NFLX`, `NVDA`, `PLTR`, `QQQ`, `SHOP`, `SMCI`, `SOL`, `TLT`, `TSLA`, `XLE`, `XRP`.

Open completion work:

- Browser QA the Market Tape card layout, selected-detail panel, and glossary/help overlays.
- Confirm whether Market Tape should show a graceful missing-state for manifest assets absent from the screener.
- Preserve the product rule that Market Tape context is not a trade signal.

### 4. Public Market Context Cards

Active files:

- `seta_public_context_cards.html`
- `public_content/seta_website_snippets_latest.json`
- `public_content/seta_website_snippets_latest.md`
- `scripts/smoke_seta_public_context_cards_v2.py`
- `docs/PUBLIC_MARKET_CONTEXT_PAGE.md`

Current posture:

- The page renders public-safe cards from `public_content/seta_website_snippets_latest.json`.
- Latest payload date inspected: `2026-04-30`.
- Payload contains 12 public snippets.
- Safety flags are correct: `public_safe=true`, `posting_performed=false`.
- PR #3 already added direct asset links, universe filters, compact/embed mode, dashboard CTA support, and v2 smoke hooks.

Open completion work:

- Verify GitHub Pages as the public host. GitHub Pages is the only intended host for now.
- Verify dashboard-to-context and context-to-dashboard links on the real hosted URLs.
- Keep public snippets eligible for the broader asset universe; the current 12-card output is acceptable if it reflects the daily editorial/data selection.
- Add browser screenshots for desktop and mobile before promoting the page in public navigation.

### 5. Content And Reply Pipeline

Current posture:

- The content system is intentionally draft-only.
- The pipeline includes daily content packet, website snippets, blog outline, blog draft, social calendar, reply draft queue, review queue, approved replies export, manual posting packets, and public website content publishing.
- Safety posture is consistent across scripts and docs: no auto-posting, `posting_performed=false`, human review for actionable rows.

Fresh-clone caveat:

- `scripts/smoke_seta_content_pipeline.py` fails from this cloned repo because `reply_agent/daily_context/seta_daily_context_latest.json` is absent.
- `scripts/smoke_seta_public_website_content.py` fails for the same reason.
- This is expected if daily context is treated as local runtime state, but the smoke test should make that prerequisite clearer.

Open completion work:

- Keep sanitized test context local-only.
- Add a preflight mode or clearer skip/fail message for content smoke tests when local runtime inputs are absent.
- Run the full content pipeline on the production machine after rebuilding daily context and narrative context.
- Keep social/reply outputs manual-review only.

### 6. Refresh And Operations

Primary runners:

- `refresh_fix26_dashboard_all.bat`
- `run_seta_content_pipeline_daily.bat`
- `run_seta_daily_all.bat`
- `refresh_seta_website_full.bat`

Current posture:

- The workflow is production-shaped but highly local.
- It depends on local Windows paths, local Python installs, Google Drive paths, and `TWT_SNT_DB_URL`.
- `refresh_seta_website_full.bat` is the closest thing to a full production runner: it checks environment, refreshes dashboard data, rebuilds daily context, runs content pipeline, verifies public content, stages selected website-facing files, commits, and pushes to `main`.

Open completion work:

- Add a concise production setup doc or env template for required local paths and environment variables.
- Keep daily pushes if they are the best/working method for refreshing the GitHub Pages website. The current setup appears to work and is acceptable unless a safer equivalent replaces it.
- Confirm logs are ignored and retained locally.
- Confirm GitHub Pages or the chosen static host updates after an automated push.

## Validation Results

Validation run from the cloned workspace on 2026-05-01:

| Check | Result | Notes |
| --- | --- | --- |
| `scripts/smoke_fix26_dashboard.py` | Pass with warnings | Cache-token expectation is stale: embeds use `phase_bands_layer_policy_046`, test expects `phase_g_market_tape_016`. |
| `scripts/smoke_seta_public_context_cards_v2.py` | Pass | v2 hooks and public-safe invariants present. |
| `scripts/smoke_seta_macd_visual_polish_v3.py` | Fail | Test expects token `Hidden by default: scaled_sentiment_macd`; app still hides the fast line via customdata/hover but no longer contains that exact token. Likely stale smoke expectation or missing comment. |
| `scripts/smoke_seta_content_pipeline.py` | Fail from fresh clone | Missing local runtime file: `reply_agent/daily_context/seta_daily_context_latest.json`. |
| `scripts/smoke_seta_public_website_content.py` | Fail from fresh clone | Same missing daily context prerequisite. |

Not run during this audit:

- Full dashboard refresh.
- Full website refresh.
- Browser visual QA.
- Golden screenshot capture.
- GitHub Pages or Squarespace iframe verification.

## Completion Gaps

### Gap A - Baseline Smoke Hygiene

Why it matters:

- The repo currently has passing core dashboard smoke with stale warnings, plus one stale MACD smoke failure.
- Fresh-clone pipeline smoke behavior is ambiguous because it requires local runtime context.

Needed work:

- Update dashboard smoke cache expectation or make it read the expected token from the embed files.
- Add a manifest-to-payload coverage check so missing configured assets are visible.
- Fix the MACD polish smoke test to assert current behavior instead of a brittle comment token.
- Make content pipeline smoke clearly distinguish structural checks from integration checks requiring local context.

### Gap B - SPY Asset Coverage

Why it matters:

- `SPY` is configured in public/member modes but missing from public payload, member payload, and screener store.
- A public user could select or expect an asset that the payload cannot serve cleanly until upstream data coverage returns.

Needed work:

- Treat this as an upstream data/pipeline issue.
- Do not remove `SPY` locally from the dashboard manifest as a workaround.
- Ensure the dashboard and smoke checks tolerate the temporary missing payload while making the gap visible.
- Confirm `SPY` begins functioning normally once upstream export coverage is corrected.

### Gap C - Visual Acceptance

Why it matters:

- Smoke tests confirm file presence and hooks, not visual correctness.
- The product depends heavily on chart readability and interpretation hierarchy.

Needed work:

- Capture golden screenshots for BTC public, BTC member, one crypto with alerts, NVDA/MSFT, AAPL, GLD, SPY after the SPY decision, and public context cards.
- QA desktop and mobile layouts.
- Verify lower panes, alert drawer, Market Tape, glossary/help, public/member controls, and no-text-overlap states.

### Gap D - Deployment Path

Why it matters:

- The repo contains public static assets, but completion requires a verified public URL and update flow.

Needed work:

- Enable or confirm GitHub Pages or chosen static host.
- Verify dashboard and context-card URLs.
- Confirm relative JSON paths work from host.
- Add the final Squarespace iframe only after hosted URLs are verified.

### Gap E - Local Ops Hardening

Why it matters:

- Production refresh depends on local machine state.
- Failures should be fast, clear, and recoverable.

Needed work:

- Document required local paths and env vars in one setup checklist.
- Add or improve runner preflight messaging.
- Decide auto-push policy.
- Confirm refresh logs, local backups, and runtime outputs remain uncommitted.

### Gap F - Roadmap Reconciliation

Why it matters:

- The roadmap is useful but partly behind current `main`.
- Planning from stale phase labels risks redoing completed work or missing current regressions.

Needed work:

- Add a roadmap status pass: Done, Partial, Not Started, Superseded.
- Mark MACD polish, Market Tape productionization, alert funnel diagnostics, and public context page polish as already merged into `main`.
- Keep future refinements scoped to actual remaining gaps.

## Recommended Branch Sequence

### 1. `fix/dashboard-v2-baseline-smoke-hygiene`

Purpose:

- Make the baseline test suite tell the truth about current `main`.

Allowed files:

- `scripts/smoke_fix26_dashboard.py`
- `scripts/smoke_seta_macd_visual_polish_v3.py`
- Optional docs note if behavior is clarified.

Protected files:

- `dashboard_fix26_app.js`
- `dashboard_fix26_mode_manifest.json`
- generated JSON payloads
- embed HTML files
- refresh scripts

Acceptance:

- Dashboard smoke no longer warns on an intentionally current cache token.
- MACD smoke passes by checking actual current behavior.
- Missing manifest assets are reported clearly.
- No dashboard behavior changes.

### 2. `fix/dashboard-v2-spy-coverage`

Purpose:

- Track the `SPY` manifest/payload/screener mismatch without weakening the dashboard contract.

Allowed files:

- Smoke tests or docs only, unless an actual upstream payload refresh restores `SPY`.

Protected files:

- Dashboard manifest, unless there is a new product decision to remove `SPY`.
- Unrelated dashboard UI behavior.
- Public copy.

Acceptance:

- Dashboard smoke reports missing configured assets clearly.
- Missing `SPY` is warning/visibility, not a dashboard-side removal.
- When upstream coverage returns, `SPY` functions normally without another local dashboard change.

### 3. `qa/dashboard-v2-golden-screenshots`

Purpose:

- Establish visual truth before further polish.

Allowed files:

- Local screenshot artifacts if kept outside git, or a dedicated docs/screenshots path if intentionally versioned.
- Optional QA checklist doc.

Acceptance:

- Screenshots exist for recurring acceptance assets and both modes.
- Visual issues are filed as focused follow-up branches.

### 4. `ops/seta-refresh-preflight`

Purpose:

- Make daily refresh and website refresh easier to run safely.

Allowed files:

- Runner docs.
- Light runner preflight improvements.
- Optional env/setup template without secrets.

Acceptance:

- Missing Python, missing `TWT_SNT_DB_URL`, missing Google Drive folders, or missing daily context fail with clear messages.
- No secrets committed.
- Auto-push policy is explicit.

### 5. `deploy/public-site-linkage`

Purpose:

- Verify the public deployment path and link dashboard/context surfaces.

Allowed files:

- Public docs.
- Manifest or public-page config only if URL wiring requires it.

Acceptance:

- Hosted dashboard and Market Context URLs work.
- Squarespace iframe renders current content if Squarespace remains the target.
- Public copy remains safe.

## Exact Next Implementation Branch

Start with:

```text
fix/dashboard-v2-baseline-smoke-hygiene
```

Reason:

- It does not require product-positioning decisions.
- It improves trust in every later branch.
- It should avoid dashboard behavior changes entirely.
- It will surface the `SPY` decision cleanly instead of burying it in generated metadata.

Definition of done for that branch:

- `scripts/smoke_fix26_dashboard.py` reflects the current embed cache-token policy.
- `scripts/smoke_seta_macd_visual_polish_v3.py` reflects the current MACD implementation.
- Missing configured assets are visible in smoke output.
- Core static checks pass locally:
  - `scripts/smoke_fix26_dashboard.py`
  - `scripts/smoke_seta_public_context_cards_v2.py`
  - `scripts/smoke_seta_macd_visual_polish_v3.py`
- No generated payloads are edited by hand.

## Decisions From Shane

Recorded 2026-05-01:

- Missing `SPY` is upstream of this repo. Keep local dashboard support intact so `SPY` works once upstream coverage returns.
- GitHub Pages is the only host for now.
- Daily pushes exist to refresh the website daily. The current setup works and is acceptable unless a better equivalent replaces it.
- Public snippets/cards can draw from the full eligible asset universe. The current 12-card output is acceptable.
- Sanitized test context can remain local-only.
- The completion target is the whole stack.

## Things Not To Do Yet

- Do not rewrite the app into a framework before launch.
- Do not rename `fix24`/`fix26` files without a compatibility plan.
- Do not hand-edit generated JSON as a product fix.
- Do not mix alert policy changes with pane redesign.
- Do not make content auto-post to social platforms.
- Do not expose raw internal scores as public headline metrics.
