# Module Runtime Production Embed Candidate Browser QA

## Purpose

Document browser QA for the parallel module runtime production candidate page.

This QA validates the candidate page added in `promote/module-runtime-production-embed-candidate-v1` without replacing the existing public/member dashboard routes.

## Branch

`qa/module-runtime-production-embed-candidate-browser-qa-v1`

## Candidate URL

```text
interactive_dashboard_fix26_module_candidate.html?cb=module_candidate_001
```

## Related PRs

- `#132` -- Add module runtime production embed candidate
- `#131` -- Add module runtime rollback runbook
- `#130` -- Document module runtime production cutover rehearsal
- `#129` -- Document module chart control mode browser QA
- `#128` -- Sanitize module Plotly layout axes
- `#127` -- Improve module chart control mode parity

## Scope

This browser QA verifies the new production-adjacent candidate page only.

It does not approve a full replacement of the existing public/member dashboard routes.

## Static validation already completed on candidate branch

- PASS -- `python scripts\smoke_module_plotly_renderer_parity.py`
- PASS -- `python scripts\smoke_module_market_tape_parity.py`
- PASS -- `python scripts\smoke_module_runtime_harness.py`
- PASS -- `python scripts\smoke_module_briefing_panel_parity.py`
- PASS -- `python scripts\smoke_module_store_control_state.py`
- PASS -- `python scripts\smoke_module_asset_payload_loading.py`
- PASS -- `python scripts\smoke_display_range_window_core.py`
- PASS -- `python scripts\smoke_fix26_dashboard.py`

The static suite also confirmed the current public/member embeds still reference the legacy `dashboard_fix26_app.js` route and were not replaced by this candidate branch.

## Manual browser QA summary

| Check | Result | Notes |
|---|---:|---|
| Candidate page loads | PASS | `SETA Module Runtime Candidate` page rendered from GitHub Pages |
| Existing public/member routes remain untouched | PASS | Candidate is a parallel page only |
| Header/beta wording correct | PASS | Page identifies itself as module runtime candidate |
| Controls render | PASS | Asset, frequency, display range, view, chart type, scale mode, ribbon, sentiment ribbon, regime visuals, attention, bands, and timing view controls visible |
| Briefing panel renders | PASS | Briefing followed selected asset/frequency/range |
| Market Tape renders | PASS | Active Market Tape grid rendered with rich cards and filter chips |
| Filter chips render | PASS | Category chips and counts remained visible |
| Selected detail renders | PASS | Rank/score, setup read, watch item, tags, and payload source populated |
| Detail deck renders | PASS | Screener receipt, archetype read, and indicator context populated |
| Event timeline renders | PASS | Setup read, confirmation watch, and receipt context sections populated |
| Chart renders | PASS | Chart panel rendered across tested assets and control modes |
| Chart title resolves | PASS | Console returned `MSFT • Daily • 3M` in final probe |
| Chart traces resolve | PASS | Console returned 5 populated trace descriptors |
| Card click sync works | PASS | Market Tape click updated selected asset |
| Asset dropdown sync works | PASS | Console returned `MSFT` after final selected asset |
| Market Tape kicker sync works | PASS | Console returned `MODULE MARKET TAPE - ACTIVE MSFT` |
| Briefing kicker sync works | PASS | Console returned `MODULE BRIEFING • MSFT • D • 3M` |
| Detail/timeline sync works | PASS | Console detail, deck, and timeline text all referenced selected MSFT context |
| No `Chart load failed` regression | PASS | No Plotly anchor/layout crash observed |
| No app-blocking runtime errors | PASS | Console logs showed control sync activity without app-blocking failure |
| No payload regeneration | PASS | QA observed candidate runtime only |
| No monolith edit/cutover | PASS | Existing public/member routes remain unchanged |

## Assets reviewed

The browser QA screenshots/probes covered:

```text
BTC
ETH
AVAX
NVDA
BNB
MSFT
```

The candidate should still receive follow-up spot checks on:

```text
DOGE
MSTR
SOL
```

before a full navigation promotion, but the core module candidate path is working.

## Control modes reviewed

Observed combinations included:

```text
Daily / 3M
Weekly / 6M
Candles
Price + Price Overlays
All Visible Traces
Price Only
Sentiment ribbon
Full sentiment ribbon
Overlay Marks
Combined Overlay
All Bands
Context timing view
Research briefing mode
```

## Browser observations

### BTC -- Daily / 3M

BTC loaded on the candidate page with the module runtime candidate banner, briefing, Market Tape, selected detail, detail deck, event timeline, and chart all visible.

The chart rendered with price candles and overlay/context traces.

### ETH -- Weekly / 6M

ETH rendered successfully under weekly range settings with multiple sentiment/control traces visible. The chart remained stable and briefing/Market Tape sections stayed populated.

### AVAX -- Weekly / 6M

AVAX rendered with the module sections intact. Combined overlay and sentiment/context chart traces remained visible without chart failure.

### NVDA -- Weekly / 6M

NVDA confirmed equity/large-cap asset behavior on the candidate page. The chart rendered cleanly with the selected detail, detail deck, and event timeline populated.

### BNB -- Daily / 1M

BNB confirmed alternate crypto asset behavior with all-bands/overlay-style controls. The chart rendered with the secondary context axis visible.

### MSFT -- Daily / 3M

MSFT confirmed final asset sync and console probe behavior.

Console probes confirmed:

```javascript
document.getElementById('chart')?.layout?.title?.text
// MSFT • Daily • 3M

document.getElementById('chart')?.data?.map(t => ({name:t.name,type:t.type,mode:t.mode,yaxis:t.yaxis}))
// Returned 5 trace descriptors.

document.querySelector('.moduleMarketTapeKicker')?.innerText
// MODULE MARKET TAPE - ACTIVE MSFT

document.querySelector('.moduleBriefingKicker')?.innerText
// MODULE BRIEFING • MSFT • D • 3M

document.getElementById('asset')?.value
// MSFT
```

The selected detail, detail deck, and event timeline probes returned MSFT-specific content.

## Production candidate assessment

The parallel candidate page is browser-QA ready.

This is not yet a full production cutover approval. It confirms that the candidate page itself can function as a production-adjacent module runtime surface while the existing public/member dashboard routes remain protected.

## Remaining checks before navigation promotion

Before linking this candidate from the root navigation or replacing any public/member route, complete:

- DOGE spot check
- MSTR spot check
- SOL spot check
- public landing page navigation review
- candidate link copy decision
- rollback confirmation
- fresh cache-buster test after any navigation change

## Recommended next branch after this QA merges

```text
promote/module-runtime-production-navigation-link-v1
```

Recommended scope:

```text
- add a controlled beta/candidate link from index.html to interactive_dashboard_fix26_module_candidate.html
- keep existing Public Dashboard and Member Dashboard links unchanged
- no payload regeneration
- no monolith edits
```

## Non-goals

- no replacement of `interactive_dashboard_fix24_public_embed.html`
- no replacement of `interactive_dashboard_fix24_member_embed.html`
- no generated payload changes
- no monolith edits
- no data pipeline changes

## Final recommendation

Merge this QA report.

Then proceed to a navigation-link candidate only if the user explicitly approves adding a visible candidate/beta link to the root page.
