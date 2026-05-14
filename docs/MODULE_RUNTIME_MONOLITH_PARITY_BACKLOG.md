# Module Runtime Monolith Parity Backlog

## Purpose

Track the remaining work to restore the useful monolith dashboard functionality into the modular runtime.

The modular runtime is now safe enough to expose as the homepage Public Market Dashboard default, but it is not yet intended to be a reduced replacement. The target state is:

```text
module runtime equals or exceeds the monolith dashboard as the durable production dashboard
```

This backlog keeps the next phase disciplined by separating:

- what the module already does well
- what the monolith still does better
- what should be restored next
- what should remain intentionally deferred
- what should not be changed accidentally

## Current production state

The homepage now routes:

```text
Public Market Dashboard -> interactive_dashboard_fix26_module_candidate.html
Market Context Cards -> seta_public_context_cards.html?dashboard=interactive_dashboard_fix24_public_embed.html
Research Dashboard -> interactive_dashboard_fix24_member_embed.html
Legacy Public Dashboard -> interactive_dashboard_fix24_public_embed.html
```

This means the module runtime is now the public homepage default, while the legacy public dashboard and member/research dashboard remain available as fallback/reference surfaces.

## What this is not

This is not a cutover plan to delete the monolith.

This is not approval to remove:

```text
interactive_dashboard_fix24_public_embed.html
interactive_dashboard_fix24_member_embed.html
dashboard_fix26_app.js
```

This is not approval to regenerate payloads or rewrite generated JSON.

## Current module strengths

The module runtime already has meaningful production-facing strengths.

| Area | Status | Notes |
|---|---:|---|
| Homepage public default | Complete | Public Market Dashboard card now points to module runtime candidate |
| Legacy fallback | Complete | Legacy Public Dashboard remains available |
| Module briefing panel | Complete / improving | Briefing follows selected asset, frequency, and range |
| Market Tape card grid | Complete / improving | Rich cards, rank, score, tags, and body copy are visible |
| Filter chips | Complete | Category chips filter visible Market Tape cards |
| Selected detail | Complete | Rank/score, setup read, watch item, tags, and payload source render |
| Detail deck | Complete | Screener receipt, archetype read, and indicator context render |
| Event / confirmation timeline shell | Complete / partial | Compact setup, confirmation, and receipt context render |
| Chart rendering | Partial | Core chart renders; richer monolith chart stack not fully restored |
| Control sync | Complete / partial | Main controls sync; some edge/control combinations still need parity review |
| Asset click sync | Complete | Card click updates asset dropdown, briefing, Market Tape, detail, and chart |
| Plotly axis safety | Complete | Layout-axis sanitizer removed observed Plotly `anchor` failure |
| Browser QA trail | Complete | Candidate, navigation link, and public default QA reports are in repo |
| Rollback runbook | Complete | Rollback path is documented |

## Monolith capabilities still to restore

The monolith is still stronger as a full research cockpit. The module is stronger as a focused interpretation layer.

The next phase is to migrate the cockpit depth into modules.

## Parity backlog matrix

### 1. Chart stack parity

| Capability | Monolith | Module | Status | Priority |
|---|---:|---:|---:|---:|
| Primary price chart | Yes | Yes | Mostly matched | P0 |
| Candles / line rendering | Yes | Yes | Mostly matched | P0 |
| Price overlays | Yes | Yes | Mostly matched | P0 |
| Sentiment overlay | Yes | Yes | Mostly matched | P0 |
| Context/attention overlays | Yes | Partial | Needs parity review | P0 |
| MACD panel | Yes | No / partial | Missing from module stack | P0 |
| RSI panel | Yes | No / partial | Missing from module stack | P0 |
| Stoch RSI panel | Yes | No / partial | Missing from module stack | P0 |
| Multi-panel chart layout | Yes | No / partial | Missing from module stack | P0 |
| Chart height/layout behavior | Yes | Partial | Needs polish | P1 |
| Y-axis/secondary-axis behavior | Yes | Partial | Improved but needs edge QA | P1 |

Recommended branch:

```text
refactor/module-chart-stack-parity-v1
```

Goal:

```text
Restore MACD / RSI / Stoch RSI style chart stack behavior into the module runtime without touching payload generation.
```

### 2. Event timeline parity

| Capability | Monolith | Module | Status | Priority |
|---|---:|---:|---:|---:|
| Compact event timeline | Yes | Yes | Partial match | P1 |
| Right-side scrollable timeline | Yes | No / partial | Missing from module layout | P1 |
| Confirmed/watch/debate event labels | Yes | Partial | Needs richer mapping | P1 |
| Event date/timestamp depth | Yes | Partial | Needs richer display | P1 |
| Event context text depth | Yes | Partial | Needs richer display | P1 |
| Event-to-chart annotation relationship | Yes | Partial | Needs review | P1 |

Recommended branch:

```text
refactor/module-event-timeline-depth-parity-v1
```

Goal:

```text
Bring richer monolith event/timeline context into the module runtime while preserving the compact timeline shell.
```

### 3. Alert, ribbon, and regime annotation parity

| Capability | Monolith | Module | Status | Priority |
|---|---:|---:|---:|---:|
| Regime ribbons | Yes | Partial | Needs parity review | P1 |
| Alert markers | Yes | Partial | Needs parity review | P1 |
| Confirmation/debate/watch labels | Yes | Partial | Needs richer mapping | P1 |
| Context badges | Yes | Partial | Needs richer surface | P2 |
| Overlay/regime marker legend behavior | Yes | Partial | Needs QA | P2 |

Recommended branch:

```text
refactor/module-regime-alert-marker-parity-v1
```

Goal:

```text
Restore the monolith's richer regime, ribbon, alert marker, and chart annotation semantics into modular components.
```

### 4. Control-mode parity

| Capability | Monolith | Module | Status | Priority |
|---|---:|---:|---:|---:|
| Asset selector | Yes | Yes | Matched | P0 |
| Frequency selector | Yes | Yes | Matched / needs edge QA | P0 |
| Display range selector | Yes | Yes | Matched / needs edge QA | P0 |
| Briefing / research mode | Yes | Partial | Needs research parity | P1 |
| Chart type | Yes | Yes | Improved | P0 |
| Scale mode | Yes | Yes | Improved | P0 |
| Ribbon selector | Yes | Partial | Needs deeper parity | P1 |
| Sentiment ribbon selector | Yes | Partial | Needs deeper parity | P1 |
| Regime visuals | Yes | Partial | Needs deeper parity | P1 |
| Attention selector | Yes | Partial | Needs deeper parity | P1 |
| Bands selector | Yes | Partial | Needs deeper parity | P1 |
| Timing view | Yes | Partial | Needs deeper parity | P1 |

Recommended branch:

```text
refactor/module-control-mode-edge-parity-v1
```

Goal:

```text
Close remaining control-combination gaps after chart stack parity lands.
```

### 5. Market Tape / interpretation parity

| Capability | Monolith | Module | Status | Priority |
|---|---:|---:|---:|---:|
| Active asset read | Yes | Yes | Matched / improved | P0 |
| Card grid | Yes | Yes | Improved in module | P0 |
| Rich card copy | Yes | Yes | Improved in module | P0 |
| Tag/category filtering | Yes | Yes | Improved in module | P0 |
| Selected detail | No / limited | Yes | Module improved | P0 |
| Detail deck | No / limited | Yes | Module improved | P0 |
| Event timeline shell | Yes | Yes | Partial | P1 |
| Watch/confirmation logic text | Yes | Partial | Needs richer copy mapping | P1 |
| Setup confidence/read summary | Yes | Partial | Needs tighter parity | P2 |

Recommended branch:

```text
refactor/module-market-tape-copy-depth-v1
```

Goal:

```text
Improve the explanatory quality of the module interpretation layer while preserving current card/detail behavior.
```

### 6. Member / research mode parity

| Capability | Monolith | Module | Status | Priority |
|---|---:|---:|---:|---:|
| Public mode | Yes | Yes | Public default is module | P0 |
| Member mode | Yes | Partial | Needs deeper validation | P1 |
| Full asset universe | Yes | Yes / partial | Needs member-mode QA | P1 |
| Research dashboard depth | Yes | Partial | Still stronger in monolith | P1 |
| Expanded analytical controls | Yes | Partial | Needs migration | P1 |
| Research route replacement | Yes | No | Deferred | P2 |

Recommended branch:

```text
refactor/module-member-research-parity-v1
```

Goal:

```text
Bring the member/research dashboard depth into the modular runtime only after public default stability is established.
```

### 7. Production route parity

| Capability | Current state | Target state | Status | Priority |
|---|---|---|---:|---:|
| Homepage Public Dashboard default | Module candidate | Module runtime | Complete | P0 |
| Legacy public fallback | Legacy route retained | Keep until parity complete | Complete | P0 |
| Public route file replacement | Not done | Optional later | Deferred | P2 |
| Member route file replacement | Not done | Optional later | Deferred | P2 |
| Candidate page naming | Candidate route | Final route naming TBD | Deferred | P2 |
| Rollback path | Documented | Keep documented | Complete | P0 |

Recommended future branch:

```text
promote/module-runtime-public-route-cutover-v1
```

Only after:

```text
chart stack parity
event timeline depth parity
member/research parity decision
public default observation period
```

## Recommended implementation sequence

### Phase 1: Preserve current milestone

Status: mostly complete.

- module runtime candidate page exists
- candidate QA passed
- homepage candidate link added
- homepage Public Dashboard now defaults to module runtime
- legacy public dashboard remains fallback
- rollback runbook exists

Recommended optional doc:

```text
docs/module-runtime-public-default-release-note-v1
```

### Phase 2: Restore chart cockpit depth

First implementation branch:

```text
refactor/module-chart-stack-parity-v1
```

Scope:

- inspect monolith chart panels
- extract chart-stack behavior into modular renderer/helpers
- restore MACD / RSI / Stoch RSI style lower panels where payload supports them
- preserve current module top chart behavior
- do not regenerate payloads

QA branch:

```text
qa/module-chart-stack-parity-browser-qa-v1
```

### Phase 3: Restore event/timeline depth

Implementation branch:

```text
refactor/module-event-timeline-depth-parity-v1
```

Scope:

- improve compact timeline content
- map richer event fields
- optionally add expanded timeline section or rail
- preserve current selected-detail/deck layout

QA branch:

```text
qa/module-event-timeline-depth-browser-qa-v1
```

### Phase 4: Restore alert/ribbon/regime semantics

Implementation branch:

```text
refactor/module-regime-alert-marker-parity-v1
```

Scope:

- improve regime/ribbon marker behavior
- restore relevant alert/event overlays
- align legends with selected control modes
- verify across crypto and equity assets

QA branch:

```text
qa/module-regime-alert-marker-browser-qa-v1
```

### Phase 5: Member/research parity

Implementation branch:

```text
refactor/module-member-research-parity-v1
```

Scope:

- verify member mode full asset coverage
- bring over research dashboard control depth
- preserve public default stability
- keep old member route available until QA passes

QA branch:

```text
qa/module-member-research-parity-browser-qa-v1
```

### Phase 6: Final route strategy

Only after parity work lands:

```text
promote/module-runtime-public-route-cutover-v1
promote/module-runtime-member-route-cutover-v1
```

These should remain explicit approval-gated branches.

## Guardrails for every parity branch

Do not include generated payload churn.

Before committing, restore generated payloads if they appear:

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

Each implementation branch should target a narrow surface:

```text
one module area
one feature family
one QA report
minimal file list
```

Avoid:

```text
monolith rewrites
payload regeneration
route deletion
copy churn unrelated to the feature
changing public/member routes inside parity branches
```

## Required smoke suite for implementation branches

Run:

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

Add feature-specific smoke tests when a parity branch introduces a new capability.

## Required browser QA assets

Use a cross-section of crypto, equity, and index/ETF-style assets:

```text
BTC
ETH
DOGE
AVAX
BNB
SOL
MSTR
MSFT
NVDA
AAPL
XLE
GLD
```

## Required browser QA controls

Verify at least:

```text
Daily / 3M
Daily / 6M
Daily / YTD
Weekly / 6M
Candles
Line
Price + Price Overlays
Price Only
All Visible Traces
Sentiment ribbon
Regime visuals
Overlay marks
Combined overlay
All bands
Context / attention modes
Briefing / research modes
```

## Stop conditions

Stop and revert/hotfix when:

```text
candidate page does not load
chart fails with runtime exception
asset selection breaks
Market Tape no longer follows selected asset
briefing no longer follows selected asset
homepage public default breaks
legacy fallback link breaks
generated payloads appear unexpectedly
```

## Current recommended next branch

```text
refactor/module-chart-stack-parity-v1
```

Reason:

```text
The biggest visible gap between the current module runtime and the monolith is chart cockpit depth. Restoring MACD / RSI / Stoch RSI style stack behavior is the most valuable next parity slice.
```

## Final principle

The module runtime should not merely replace the monolith.

It should absorb the monolith's useful analytical depth while preserving the module's stronger interpretation layer, cleaner structure, and safer rollback path.
