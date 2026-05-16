# Module Public Route Stabilization Rollup

## Purpose

Document the current stabilization checkpoint for the SETA public module route after the production route cutover, homepage splash work, public asset coverage hardening, and browser QA evidence.

This is documentation only. It records the current route contract, what is stable, and what remains gated before broader member/research route replacement.

## Current route state

| Route | Status |
|---|---|
| `interactive_dashboard_fix24_public_embed.html` | Production public module runtime route |
| `interactive_dashboard_fix24_public_legacy_embed.html` | Legacy public fallback retained |
| `interactive_dashboard_fix24_member_embed.html` | Member route remains pinned to legacy monolith |

The public route has been promoted first. Member/research route replacement remains deferred.

## Recent stabilization stack

| PR | Area | Status |
|---:|---|---:|
| #151 | Promote module runtime to production public dashboard route | Complete |
| #152 | Document production route browser QA | Complete |
| #153 | Polish homepage splash design | Complete |
| #155 | Fix homepage splash background layering | Complete |
| #157 | Tighten homepage splash copy | Complete |
| #158 | Remove accidental homepage copy payload churn | Complete |
| #164 | Harden public asset coverage reconciliation | Complete |
| #165 | Ignore local run artifacts | Complete |
| #166 | Document public asset coverage browser QA | Complete |

## Public route contract

The public module route is intentionally scoped to chart-covered public assets.

Current public asset universe:

- AAPL
- BTC
- COIN
- ETH
- GLD
- MSFT
- NVDA
- SOL

The public route should not expose member-only or unsupported public-chart assets such as TLT, META, XRP, DOGE, PLTR, MSTR, SHOP, NFLX, AMZN, AVAX, BNB, or LINK until those assets have explicit public chart coverage and QA.

## Synchronization contract

After an asset change, these surfaces should remain aligned:

- asset dropdown
- page header
- briefing panel
- Market Tape active asset
- selected Market Tape detail
- event / confirmation timeline
- chart title
- chart stack payload

The public route should not allow the upper module surface to show one asset while the chart stack remains on another.

## Hardening completed

The public asset coverage reconciliation work completed the following:

- controls initialize before Market Tape
- unsupported public assets are not silently inserted into the dropdown
- Market Tape card clicks are blocked when a ticker is outside public chart coverage
- Market Tape render no longer mutates global asset state with hidden Store.setAsset behavior
- public Market Tape reflects the 8-asset chart-covered public universe

## Browser QA evidence

Public asset coverage browser QA confirmed:

- public dropdown is limited to chart-covered assets
- public Market Tape shows 8 assets
- unsupported member-only assets are not exposed on the public route
- header, briefing panel, Market Tape, selected detail, and chart stack remain synchronized
- legacy fallback remains separate

Documented in:

`qa_outputs/module_public_asset_coverage_browser_qa_20260516.md`

## Payload policy

No payload regeneration should happen during documentation, QA report, homepage copy, or route-hygiene PRs unless explicitly approved.

Avoid touching generated payload files in non-payload PRs, especially:

- `fix26_chart_store_assets/`
- `fix26_chart_store_member.json`
- `fix26_chart_store_member_index.json`
- `fix26_chart_store_public.json`
- `fix26_chart_store_public_index.json`
- `fix26_screener_store.json`
- `generated_briefings_reviewed.json`
- `generated_briefings_reviewed_v2.json`
- `public_content/seta_website_snippets_latest.json`
- `public_content/seta_website_snippets_latest.md`

## Expected smoke validation

Baseline public-route stabilization checks:

- `python scripts\smoke_module_market_tape_parity.py`
- `python scripts\smoke_module_asset_payload_loading.py`
- `python scripts\smoke_module_store_control_state.py`
- `python scripts\smoke_fix26_dashboard.py`

The mixed cache-token warning is expected while the public route uses the module runtime token and legacy/member routes remain pinned to the legacy monolith token.

## Remaining gates

Before broader cutover:

1. Continue public-route soak testing.
2. Keep member/research route replacement deferred until explicitly approved.
3. Require chart payload coverage, index inclusion, Market Tape coverage, and browser QA before expanding public assets.
4. Keep the legacy public fallback until the module route has more QA history.

## Recommendation

Keep the public route intentionally narrow. The current 8-asset public universe is a better product experience than exposing all assets with partial chart coverage.

Avoid broad route replacement, monolith deletion, or payload regeneration until the public module route has more browser QA history.

## Final checkpoint

Current source of truth:

- public route: module runtime
- public assets: chart-covered 8-asset universe
- legacy public route: retained as fallback
- member route: legacy monolith retained
- payload regeneration: out of scope unless explicitly approved
