# SETA Dislocation Lexicon Watchlist

Status: provisional dashboard-language watchlist  
Source research lane: `SETA_Prediction_Intelligence_Engine` / SETA Dislocation Reversal Lab  
Purpose: support future sentiment-dash copy, labels, tooltips, and dashboard context language.

This file is **not** the final product dictionary. It is a watchlist of candidate language to refine as the dislocation methodology matures.

## Why this exists

The SETA dislocation research is developing a useful distinction between raw sentiment, price compression, and participation/attention confirmation. The dashboard should eventually translate that into careful, non-trade-instruction language.

The goal is to communicate market-emotion structure:

- price compression
- sentiment resilience
- participation confirmation
- narrative under-validation
- extension / already-validated context
- monitor-only setups

The dashboard should avoid presenting these as buy/sell calls.

## Candidate core concepts

### Narrative under-validation

Working meaning: price has compressed faster than sentiment and participation have deteriorated.

Potential tooltip:

> Price is stretched down while medium-horizon sentiment and/or participation remain intact, suggesting the narrative may not have fully broken despite price stress.

### Compressed but sentiment-supported

Working meaning: short-term price is unusually weak, but 21-day sentiment remains supportive.

Potential tooltip:

> The asset is price-compressed, but sentiment has not deteriorated enough to confirm a full narrative breakdown.

### Ultra-compressed dislocation

Working meaning: a stricter version of sentiment-price dislocation, where both short-term and medium-term price compression are extreme while sentiment remains supportive.

Potential tooltip:

> A deeper price-dislocation condition where price compression is unusually severe and sentiment remains resilient.

### Attention-confirmed under-validation

Working meaning: a compressed, sentiment-supported setup that also has elevated attention or participation.

Potential tooltip:

> Participation is elevated around a price-compressed, sentiment-supported setup, adding confirmation that the market narrative remains active.

### Sniper dislocation

Working meaning: a rare, highly selective research setup with severe price compression, strong sentiment support, and very high attention percentile.

Potential tooltip:

> A rare high-attention research setup. This should be treated as a context signal, not as a trade instruction.

### Monitor-only setup

Working meaning: some dislocation features are present, but the setup is not strong enough for a signal-grade label.

Potential tooltip:

> The asset shows partial dislocation characteristics, but confirmation is not strong enough. Monitor rather than promote.

### Do-not-chase context

Working meaning: price is extended and/or crowding signals suggest the narrative may already be validated.

Potential tooltip:

> Price and sentiment may already be crowded or extended. The narrative may be visible, but not necessarily early.

## Candidate dashboard labels

These labels should be tested for clarity and tone:

- `Compressed / Sentiment Supported`
- `Ultra-Compressed Dislocation`
- `Attention-Confirmed Under-Validation`
- `High-Conviction Research Setup`
- `Watch Only - Needs Confirmation`
- `Extended / Already Validated`
- `Crowded Weak-Sentiment Context`
- `Participation Confirming`
- `Participation Not Confirming`
- `Narrative Resilience Under Price Stress`
- `Under-Validation Candidate`
- `Over-Validated / Crowded Context`

## Suggested label hierarchy

### Tier 0: No setup

Dashboard meaning: no active dislocation pattern.

Candidate phrase:

- `No Active Dislocation Setup`

### Tier 1: Watch only

Dashboard meaning: incomplete setup; monitor only.

Candidate phrase:

- `Watch Only - Needs Confirmation`

### Tier 2: Compressed and sentiment-supported

Dashboard meaning: core under-validation condition.

Candidate phrase:

- `Compressed / Sentiment Supported`

### Tier 3: Ultra-compressed

Dashboard meaning: stricter price/sentiment dislocation.

Candidate phrase:

- `Ultra-Compressed Dislocation`

### Tier 4: Attention-confirmed

Dashboard meaning: ultra-compressed setup plus elevated attention.

Candidate phrase:

- `Attention-Confirmed Under-Validation`

### Tier 5: Research sniper

Dashboard meaning: rare, high-selectivity research tier.

Candidate phrase:

- `High-Conviction Research Setup`

## Guardrail language

Prefer:

- setup
- context
- under-validation
- participation confirmation
- research candidate
- monitor-only
- narrative resilience
- price stress
- attention-confirmed

Avoid:

- buy
- sell
- guaranteed
- trade signal
- price target
- certain reversal
- must own
- bottom is in

## Notes for future dashboard implementation

The prediction engine should eventually export clean fields such as:

- `dislocation_tier`
- `dislocation_score`
- `price_compression_percentile`
- `sentiment_resilience_score`
- `attention_confirmation_label`
- `narrative_under_validation_flag`
- `do_not_chase_flag`
- `risk_guard_reason`
- `historical_3d_hit_rate`
- `historical_3d_excess_vs_universe`
- `historical_3d_excess_vs_asset_class`

The dashboard should consume those fields and render language, tooltips, badges, filters, and explanatory cards. It should not reproduce the full research backtest machinery.

## Open questions

- Should labels differ by asset class, especially crypto versus equities and ETF/index proxies?
- Should high-attention language be softer until sample size expands?
- Should `Sniper` remain internal-only because it may sound too trade-like?
- Should public copy use `High-Conviction Research Setup` instead of `Sniper Dislocation`?
- How should risk-guard labels be displayed without sounding bearish or advisory?
