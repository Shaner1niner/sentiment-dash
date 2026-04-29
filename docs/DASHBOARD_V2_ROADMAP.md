# Dashboard v2 Roadmap

Dashboard v2 is the working name for the next disciplined development track of the SETA sentiment dashboard. The current live baseline is the Fix 26 dashboard system in this repository.

This roadmap formalizes what should be preserved, what should change next, and how future patches should be scoped so that prior wins are not overwritten by large mixed-purpose changes.

## Product identity

SETA explains behavior beneath price.

Dashboard v2 should help users understand attention, sentiment, participation, narrative, indicator structure, and validation without turning the interface into a prediction board or signal service.

Non-negotiable product rules:

- SETA is educational and analytical.
- Sentiment is context, not a trading signal.
- Attention is not validation.
- Crypto and equities require different interpretation rules.
- Public/member mode remains manifest-driven.
- Public copy avoids price predictions, buy/sell language, guarantees, and personalized advice.
- Human review remains part of editorial/content workflows.

## Current baseline

The current baseline is defined by the working website output plus the current repo state, not by any one experimental JavaScript branch in isolation.

Freeze these files as the Dashboard v2 starting point:

- `dashboard_fix26_app.js`
- `dashboard_fix26_base.css`
- `interactive_dashboard_fix24_public_embed.html`
- `interactive_dashboard_fix24_member_embed.html`
- `dashboard_fix26_mode_manifest.json`
- `build_fix26_chart_store_payloads.py`
- `refresh_fix26_dashboard_all.bat`
- `scripts/smoke_fix26_dashboard.py`
- `fix26_chart_store_public.json`
- `fix26_chart_store_member.json`
- `fix26_screener_store.json`
- `seta_public_context_cards.html`
- `public_content/seta_website_snippets_latest.json`

Recommended visual baseline artifacts:

- BTC member screenshot
- BTC public screenshot
- one crypto asset with alerts that look correct
- NVDA or MSFT screenshot where equity alerts are missing or weak
- one public context cards screenshot

## Protected architecture

These architectural choices should remain intact unless a phase explicitly targets them:

- Combined Overlap remains the primary interpretive layer.
- Engagement/attention remains contextual.
- Public/member mode stays controlled by `dashboard_fix26_mode_manifest.json`.
- The exporter -> enrichment -> payload -> GitHub workflow stays intact.
- The frontend should not absorb upstream enrichment responsibilities by default.
- The payload builder should only change when the UI clearly needs persisted data.
- The refresh workflow should continue to stop on required upstream failures.

## Development discipline

Every Dashboard v2 patch should declare:

- Purpose
- Allowed files
- Protected files
- Acceptance tests
- Rollback path

Hard rules:

- One patch, one purpose.
- One branch per phase or patch.
- No mixing alert logic and pane redesign in the same patch.
- No full-file save-over rewrites unless it is a true baseline reset.
- Prefer dashboard-only presentation patches before upstream pipeline changes.
- Commit after successful smoke tests.
- Keep screenshots as product truth, not just the last-edited file.

## Recommended branch pattern

```text
feature/dashboard-v2-equity-alert-restoration
feature/dashboard-v2-alert-diagnostics
feature/dashboard-v2-tooltip-cleanup
feature/dashboard-v2-macd-pane-redesign
feature/dashboard-v2-rsi-pane-redesign
feature/dashboard-v2-stoch-rsi-redesign
feature/dashboard-v2-public-member-mode-refinement
```

## Phase roadmap

### Phase 0 - Baseline freeze and patch ledger

Goal: make the current Fix 26 state a stable Dashboard v2 starting point.

Allowed files:

- Documentation only
- Optional patch ledger doc

Protected files:

- `dashboard_fix26_app.js`
- `dashboard_fix26_mode_manifest.json`
- `build_fix26_chart_store_payloads.py`
- embeds
- CSS
- generated payloads

Deliverables:

- Dashboard v2 docs
- patch ledger/checklist
- golden screenshots saved locally
- optional git tag/checkpoint for the pre-Phase-A baseline

Acceptance:

- repo can be understood from README/docs
- current smoke test still passes
- no dashboard behavior changes

### Phase A - Equity alert restoration

Goal: restore sensible stock/equity confirmed diamonds while preserving the stronger crypto alert behavior.

Why first: equity alert parity is the biggest current product inconsistency. Downstream pane redesigns should not sit on top of a partially trusted alert layer.

Allowed files:

- `dashboard_fix26_app.js` only for the first pass

Protected files:

- manifest
- payload builder
- embeds
- CSS
- payload schema
- overlap geometry
- pane layout

Suggested split:

#### A1 - Diagnostic parity pass

Add temporary member-only diagnostics, gated by an explicit query parameter such as `?diag=1`.

Diagnostic fields:

- outside active overlap: yes/no
- legacy volatility: High/Low
- contextual volatility: High/Low
- high volume: yes/no
- universe type: crypto/equity-like
- blocked by: none / volatility / volume / other

No marker behavior should change in A1.

#### A2 - Hybrid confirmation policy

Implement a stable confirmation policy after diagnostics confirm the blocking gate.

Crypto-like policy:

- outside active overlap
- legacy volatility High
- high volume required

Equity-like policy:

- outside active overlap
- high volume required
- either legacy volatility High or contextual-width volatility High under an equity-calibrated threshold

Acceptance:

- BTC, ETH, DOGE, and SOL keep strong-looking confirmed diamonds.
- NVDA, MSFT, AAPL, GLD, and SPY begin printing sensible confirmed diamonds again.
- marker population stays simple.
- no new visible marker families in the final Phase A release.
- no payload rebuild required unless the dashboard-only route clearly fails.

Rollback:

- revert only `dashboard_fix26_app.js` to the frozen baseline commit.
- keep JSON and manifest unchanged.

### Phase B - Tooltip cleanup and hover hierarchy

Goal: make overlap/rim hover text faster to read and more informative without changing geometry or signal logic.

Allowed files:

- `dashboard_fix26_app.js`
- `dashboard_fix26_base.css` only for tiny style adjustments if needed

Protected files:

- builder
- manifest
- payload schema
- alert policy

Acceptance:

- hover blocks have clearer hierarchy
- less repetition
- rim/overlap language is easier to understand
- normal chart view does not get more cluttered

Rollback:

- revert only tooltip/hover changes.

### Phase C - Pane annotation redistribution polish

Goal: move indicator-specific information into the panes where it belongs.

Allowed files:

- `dashboard_fix26_app.js`

Protected files:

- builder
- manifest
- embeds
- alert behavior

Target state:

- top pane focuses on price and overlap context
- MACD note lives in MACD pane
- RSI note lives in RSI pane
- Stoch RSI note lives in Stoch pane

Acceptance:

- top candlestick area is visibly cleaner
- pane notes are shorter and more contextual
- no alert behavior changes

### Phase D - MACD pane redesign

Goal: redesign the MACD pane so price momentum remains dominant while sentiment momentum is cleaner and quieter.

Allowed files:

- `dashboard_fix26_app.js` for the first pass

Protected files:

- alert logic
- overlap logic
- badge hierarchy
- public/member asset gating
- payload builder

Presentation goals:

- keep price MACD line
- keep price signal line
- keep price histogram
- reduce sentiment MACD to one smoother sentiment line
- represent sentiment histogram as a subtle secondary overlay
- use compact language for cross direction, zero-line regime, histogram direction, sentiment confirmation/divergence, and compression/expansion

Example pane language:

```text
MACD Bullish | Cross Below Zero | Histogram Rising | Sentiment Confirming
MACD Bearish | Above Zero | Histogram Fading | Sentiment Diverging
```

Acceptance:

- one sentiment MACD line only
- sentiment histogram overlay is visible but secondary
- price MACD remains visually dominant
- pane reads cleaner than the current version
- no alert behavior changes

Rollback:

- revert only the MACD presentation patch.

### Phase E - Internal MACD state score

Goal: add backend-style MACD scoring logic without exposing a noisy raw score to public users.

Allowed files:

- `dashboard_fix26_app.js` first
- payload builder later only if persistence becomes clearly useful

Protected files:

- manifest
- embeds
- public/member mode contract

Internal fields:

- `macd_state_score_0_100`
- `macd_state_label`

Suggested inputs:

- MACD vs signal
- zero-line regime
- histogram direction
- histogram acceleration/deceleration
- sentiment agreement
- divergence/cross significance

Acceptance:

- score exists internally
- label can power tooltip/annotation language
- raw numeric score is not promoted as a headline public metric

### Phase F - RSI pane redesign

Goal: make RSI a cleaner timing/confirmation pane after MACD semantics are stable.

Allowed files:

- `dashboard_fix26_app.js`

Protected files:

- alerts
- builder
- manifest
- MACD behavior

Acceptance:

- RSI role is clear
- sentiment RSI is contextual, not a primary signal engine
- no extra clutter
- no alert changes

### Phase G - Stoch RSI redesign

Goal: clarify Stoch RSI's role relative to RSI.

Allowed files:

- `dashboard_fix26_app.js`

Protected files:

- alerts
- builder
- manifest

Acceptance:

- Stoch complements RSI instead of duplicating it
- mean-reversion vs continuation context is clearer
- no marker side effects

### Phase H - Bollinger / Combined Overlap interpretation layer

Goal: refine interpretation language and edge-case handling around Combined Overlap without changing canonical source selection.

Allowed files:

- `dashboard_fix26_app.js` unless absolutely necessary

Protected files:

- payload builder
- manifest
- overlap source contract

Acceptance:

- better descriptive language
- clearer rim/overlap interpretation
- same underlying overlap source order

### Phase I - Public/member visual mode refinement

Goal: improve public/member intentionality through manifest-driven defaults and copy.

Allowed files:

- `dashboard_fix26_mode_manifest.json`
- light JS/CSS only if needed

Protected files:

- payload builder unless asset lists or payload contract change

Possible changes:

- control visibility
- default ranges
- helper text
- badge order
- legend behavior
- member-only diagnostic/display toggles

Acceptance:

- public stays selective and educational
- member stays richer but disciplined
- architecture remains manifest-driven

### Phase J - Payload contract refinement

Goal: add or trim fields only after UI needs are stable.

Allowed files:

- `build_fix26_chart_store_payloads.py`
- app reader if needed

Protected files:

- embeds
- manifest unless data URLs or mode behavior change

Acceptance:

- no payload bloat regression
- public/member split remains intact
- generated payloads remain GitHub-safe

### Phase K - Unified internal score family

Goal: build the broader 0-100 internal scoring family once individual pane semantics are stable.

Potential fields:

- `macd_state_score_0_100`
- `rsi_state_score_0_100`
- `stoch_state_score_0_100`
- `bollinger_state_score_0_100`
- `ma_state_score_0_100`

Recommended label convention:

- 0-24: strongly bearish / weak
- 25-44: bearish / deteriorating
- 45-55: neutral / mixed
- 56-75: bullish / improving
- 76-100: strongly bullish / high quality

Acceptance:

- scores are internal-first
- labels are coherent
- no false precision on screen
- no payload bloat regression

## Initial patch backlog

Recommended order:

1. Baseline freeze and patch ledger
2. Equity alert diagnostic/restoration
3. Tooltip cleanup and hover hierarchy
4. Pane annotation redistribution
5. MACD pane redesign
6. Internal MACD state score
7. RSI pane redesign
8. Stoch RSI redesign
9. Bollinger / Combined Overlap interpretation layer
10. Public/member visual mode refinement
11. Payload contract refinement
12. Unified internal score family

## Acceptance assets

Use these assets for recurring smoke checks and screenshot comparison:

- BTC
- ETH
- DOGE
- SOL
- NVDA
- MSFT
- AAPL
- GLD
- SPY

## Source references

This roadmap is based on:

- `Road_Map.docx` uploaded in the Dashboard v2 planning thread
- `SETA_SEO_AND_EDUCATION_MASTER.md` uploaded in the Dashboard v2 planning thread
- current repo inspection of the Fix 26 dashboard files and refresh workflow
