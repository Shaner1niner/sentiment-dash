# SETA Repo AI Context Index

## Purpose

Give ChatGPT, Codex, and OpenAI API-assisted workflows a compact source-of-truth map for this repository.

Use this file before editing runtime files. It is intentionally short, opinionated, and biased toward safe continuation of current work.

## Current source of truth

| Area | File | Notes |
|---|---|---|
| Public module route | `interactive_dashboard_fix24_public_embed.html` | Production public dashboard route. Filename remains historical. |
| Legacy public fallback | `interactive_dashboard_fix24_public_legacy_embed.html` | Retained fallback. Do not remove during public soak. |
| Member route | `interactive_dashboard_fix24_member_embed.html` | Still pinned to legacy monolith. Migration deferred. |
| Main dashboard runtime | `dashboard_fix26_app.js` | Large Fix 26 monolith. Patch narrowly. |
| Modular renderer | `src/PlotlyRenderer.js` | Module chart rendering, chart stack, overlap band display, hover labels. |
| Mode contract | `dashboard_fix26_mode_manifest.json` | Public/member mode assets, data URLs, defaults, and visible controls. |
| Public chart payload | `fix26_chart_store_public.json` and `fix26_chart_store_assets/public/` | Generated. Protect unless payload regeneration is explicit. |
| Member chart payload | `fix26_chart_store_member.json` and `fix26_chart_store_assets/member/` | Generated. Protect unless payload regeneration is explicit. |
| Market Tape / screener payload | `fix26_screener_store.json` | Generated. Protect unless screener rebuild is explicit. |
| Reviewed briefings | `generated_briefings_reviewed.json`, `generated_briefings_reviewed_v2.json` | Generated/reviewed content. Protect unless briefing promotion is explicit. |
| Public website snippets | `public_content/seta_website_snippets_latest.json`, `public_content/seta_website_snippets_latest.md` | Generated public content. Protect unless website snippet refresh is explicit. |

## Current product decisions

- SETA is behavioral market intelligence for explaining behavior beneath price.
- SETA should remain educational and analytical.
- Public-facing copy must avoid buy/sell language, guarantees, price predictions, and personalized financial advice.
- **Structure Score** is the visible product label for the existing `seta_dashboard_summary_score` field.
- The Structure Score decision is a presentation rename, not a new formula or metric.
- Sentiment is context, not a trading signal.
- Attention is not the same thing as validation.
- Public route remains scoped to chart-covered assets only.

## Public route contract

Current public chart-covered asset universe:

- AAPL
- BTC
- COIN
- ETH
- GLD
- MSFT
- NVDA
- SOL

The public route should not expose unsupported/member-only assets until they have explicit public chart coverage and browser QA.

After asset changes, these surfaces must remain synchronized:

- asset dropdown
- page header
- briefing panel
- Market Tape active asset
- selected Market Tape detail
- event / confirmation timeline
- chart title
- chart stack payload

## Active work sequence

1. Merge `docs/structure-score-product-contract-v1`.
2. Continue `polish/event-timeline-context-copy-v1`.
3. Rename visible `SETA Score` / `Summary Score` labels to **Structure Score** where they map to `seta_dashboard_summary_score`.
4. Remove or suppress visible `Quality n/a` from the event timeline.
5. Replace duplicated Confirmed/Watch timeline metadata with compact context/evidence copy.
6. Then continue TA panel visual hierarchy work.

## Protected generated payloads

Do not modify these in UI-copy, docs, QA, visual-only, or smoke-test-only branches:

- `fix26_chart_store_assets/`
- `fix26_chart_store_public.json`
- `fix26_chart_store_public_index.json`
- `fix26_chart_store_member.json`
- `fix26_chart_store_member_index.json`
- `fix26_screener_store.json`
- `generated_briefings_reviewed.json`
- `generated_briefings_reviewed_v2.json`
- `public_content/seta_website_snippets_latest.json`
- `public_content/seta_website_snippets_latest.md`

## Standard validation commands

Run from repo root:

```powershell
python scripts\smoke_module_plotly_renderer_parity.py
python scripts\smoke_module_asset_payload_loading.py
python scripts\smoke_module_market_tape_parity.py
python scripts\smoke_module_store_control_state.py
python scripts\smoke_fix26_dashboard.py
```

For live GitHub Pages checks after refresh pushes:

```powershell
python scripts\smoke_github_pages_live.py
```

## Browser QA baseline

Minimum visual/runtime QA assets:

| Asset | Frequency | Range | Required checks |
|---|---|---|---|
| BTC | Daily | 3M | public route, Structure Score label, event timeline, chart stack |
| ETH | Daily | 3M | public route, briefing/context copy, Market Tape sync |
| SOL | Weekly | 1Y | weekly chart behavior, timeline copy, overlap states |
| NVDA | Daily | 3M | equity readability, public asset sync |
| MSFT | Daily | 3M | equity readability, public asset sync |

## Runtime editing guidance

- Prefer one branch per focused change.
- Declare allowed files and protected files before implementation.
- Do not mix copy polish, chart renderer changes, payload builder changes, and route migration in one PR.
- Avoid broad monolith edits in `dashboard_fix26_app.js`; patch only the smallest necessary block.
- Prefer module/renderer presentation patches before upstream pipeline changes.
- Keep public/member mode behavior manifest-driven.
- Run smoke tests before merging.
- Document browser QA under `qa_outputs/` for runtime-visible changes.

## Structure Score rename guidance

Use **Structure Score** when visible UI refers to the value from:

- `seta_dashboard_summary_score`
- `seta_score`, only when used as a fallback for the same visible composite context
- `dashboard_score`, only when used as a fallback for the same visible composite context

Avoid creating new payload fields for this rename.

Preferred visible copy:

- `Structure Score: 74`
- `Structure is improving, but confirmation remains incomplete.`
- `Structure reflects stronger alignment across price, sentiment, and participation context.`
- `Structure is mixed; attention is present but validation is still thin.`

Avoid visible copy:

- buy score
- sell score
- signal strength
- entry quality
- expected return
- price target

## Event timeline copy guidance

The event timeline should not spend visible space repeating state labels already represented by pills such as Confirmed or Watch.

Replace brittle/low-value metadata such as `Quality n/a` with compact context language, or omit the row when no useful value exists.

Preferred hierarchy:

1. Pill/state: confirmed, watch, alert, transition, or related category.
2. Context line: what the event means in SETA language.
3. Evidence line: which dimensions are participating.

Suggested visible language:

- `Context: structure alignment watch`
- `Evidence: price + sentiment context`
- `Read: early alignment; confirmation still developing`
- `Read: confirmed overlap context`

## Suggested OpenAI API retrieval set

For API vector-store / file-search workflows, index curated source files first rather than the entire repo.

Recommended include list:

- `AI_CONTEXT.md`
- `README.md`
- `docs/REPO_AI_CONTEXT_INDEX.md`
- `docs/STRUCTURE_SCORE_PRODUCT_CONTRACT_V1.md`
- `docs/MODULE_PUBLIC_ROUTE_STABILIZATION_ROLLUP.md`
- `docs/CHART_TA_VISUAL_IMPROVEMENT_PLAN.md`
- `docs/COMBINED_OVERLAP_STRUCTURE_INVENTORY.md`
- `docs/SETA_METHODOLOGY.md`
- `docs/DASHBOARD_V2_ROADMAP.md`
- `docs/GITHUB_PAGES_LIVE_HEALTH_CHECK.md`
- `dashboard_fix26_mode_manifest.json`
- `src/PlotlyRenderer.js`
- `src/features/MarketTape.js`
- `src/features/Controls.js`
- `src/features/Store.js`
- `src/dashboard_main.js`
- `scripts/smoke_fix26_dashboard.py`
- `scripts/smoke_module_plotly_renderer_parity.py`
- `scripts/smoke_module_asset_payload_loading.py`
- `scripts/smoke_module_market_tape_parity.py`
- `scripts/smoke_module_store_control_state.py`

Recommended exclude list by default:

- `fix26_chart_store_assets/`
- `fix26_chart_store_public.json`
- `fix26_chart_store_member.json`
- `fix26_screener_store.json`
- `generated_briefings_reviewed.json`
- `generated_briefings_reviewed_v2.json`
- `public_content/seta_website_snippets_latest.json`
- local logs, local exports, local model artifacts, and ignored runtime outputs

Reason: generated payloads are large and noisy. They are useful for payload QA, but they are poor default retrieval context for planning, code review, and product-copy work.

## Current branch intent

`polish/event-timeline-context-copy-v1` should remain narrow:

- add repo AI context index
- polish event timeline context copy
- rename visible composite-score labels to Structure Score where safe
- no formula changes
- no payload regeneration
- no route migration
