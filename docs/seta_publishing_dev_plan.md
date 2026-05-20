# SETA Publishing Dev Plan

This plan captures the near-term product/language work required before publishing the new public dashboard format through Substack and social channels.

## Current product state

The public dashboard now has a reader-facing flow:

1. Public intro
2. Controls
3. Market Radar
4. Asset Briefing
5. Active Setup Snapshot
6. How to Read This Chart
7. Chart

The dashboard is visually ready enough that the next risk is not layout. The next risk is semantic trust: readers need a stable dictionary so they can understand, quote, and share the system without turning SETA into price-prediction language.

## Immediate priority: How SETA Reads the Market

Create a public glossary / SOP page titled:

```text
How SETA Reads the Market
```

Purpose:

- define the core SETA vocabulary in subscriber-safe language
- support Substack and social posts with consistent phrasing
- reduce trust-risk around scores, labels, colors, and AI/model callouts
- reinforce that SETA explains market emotion and setup quality, not price targets or trade instructions

Recommended placement:

- dashboard docs / public education page
- Substack evergreen reference post
- short link from initial dark-mode rollout posts

## Terms to define

### Structure Score

Public definition:

```text
Structure Score is SETA's 0–100 read on setup quality: how coherent the current sentiment, price, technical, confirmation, and participation structure looks.
```

Publishing rules:

- keep the canonical term `Structure Score`
- describe it as setup quality / coherence
- do not rename it to Overall Score
- do not disclose exact formula weights until the pipeline formula is intentionally audited for publication
- do not describe it as a trade signal

Working bands:

```text
0–35     Weak structure
35–65    Mixed / transitional structure
65–85    Constructive structure
85–100   High-conviction structure
```

### Structure Trend

Public definition:

```text
Structure Trend shows whether the Structure Score has recently been improving, softening, or holding stable.
```

Publishing rules:

- separate the current score from the recent direction
- use `Softening` for recent deterioration
- use `Improving` for recent strengthening
- treat `Mixed` as the structure stack classification, not an orphan adjective

Preferred language:

```text
48.5 · Softening
Structure stack: Mixed (-4.5)
```

### Signal State

Public definition:

```text
Signal State summarizes the current directional lean and setup stage.
```

Current visible bias vocabulary:

```text
Bullish
Bearish
Mixed
Neutral
```

Current stage language should mirror dashboard output when available. Common stage/context words include:

```text
Confirmation
Watch
Setup
Repair
Momentum
Confirmed
```

Publishing rules:

- mirror the dashboard rather than inventing a richer taxonomy too early
- do not use `risk-on` or `risk-off` as the primary Bias unless the product explicitly adds it
- translate examples into plain English

Example:

```text
Bias: Bearish · Stage: Momentum
```

Plain-English translation:

```text
SETA sees the setup leaning bearish, and that pressure is still active rather than fully exhausted.
```

### Participation Quality

Public definition:

```text
Participation Quality describes whether a read is supported by broad, durable attention or distorted by thin, noisy, concentrated participation.
```

Inputs to reference qualitatively:

- source breadth
- author / contributor breadth
- engagement volume
- source diversity
- concentration
- stability over time

Publishing rules:

- define it as a reliability/context layer
- do not equate participation with popularity alone
- discount reads when participation is thin

Safe phrasing:

```text
Participation is not unusually loud, but it is broad enough that the read is not relying on one isolated source pocket.
```

### Evidence

Public definition:

```text
Evidence is the receipt layer behind the read.
```

Publishing hierarchy:

1. visible dashboard/chart evidence
2. SETA system receipts
3. external context only when relevant and verified

Publishing rules:

- visible evidence first
- external context must be clearly labeled
- do not imply hidden certainty when evidence is unavailable
- use Research mode as the deeper receipt layer

### Research Mode

Public definition:

```text
Research mode contains the deeper receipts behind the read.
```

Expanded version:

```text
Research mode shows additional evidence inputs, including source mix, drivers, confirmation context, and deeper receipt trails.
```

Publishing rules:

- mention Research mode as a deeper layer
- avoid over-selling it as gated content until the business model is ready
- use it as a trust layer, not a mystery box

### AI / model badge

Public definition:

```text
The AI/model badge is a context flag, not a standalone signal.
```

Safe sentence:

```text
Model bias is down near-term; treat it as context, not a standalone signal.
```

Publishing rules:

- avoid leading with model prediction language unless hit-rate context is shown
- do not turn model output into a price target
- pair model language with structure, confirmation, and participation context

### Chart rows

Working public meanings:

```text
Structure: how coherent the setup looks
Momentum: whether the move still has force
Pressure: where unresolved tension is building
Timing: whether the setup looks early, extended, or vulnerable to mean reversion
```

### Color semantics

Public meanings:

```text
Green  = improving / constructive / confirmation increasing
Yellow = mixed / transitional / watch zone
Red    = weakening / deteriorating / risk rising
```

Publishing rules:

- green does not always mean bullish
- red does not always mean short
- color describes the row's context, not a universal trade direction

## Substack format default

Recommended post structure:

1. one-sentence headline
2. dashboard screenshot
3. SETA read in plain English
4. What SETA sees
5. Why it matters
6. Evidence
7. Participation Quality
8. What would change the read
9. reminder: not a price target or trade instruction

Default timeframe language:

```text
View: Daily / 3M, using the latest available daily SETA read.
```

Default public view:

```text
Daily / 3M
```

Use longer/shorter windows only when the setup requires it.

## Acceptance criteria

The `How SETA Reads the Market` page is ready when it:

- defines Structure Score, Structure Trend, Signal State, Participation Quality, Evidence, Research Mode, and AI/model badge language
- includes color semantics and chart-row meanings
- includes safe Substack/social phrasing examples
- explicitly avoids price targets, trade instructions, and certainty language
- can be linked from the dashboard or early Substack rollout posts

## Status

```text
How SETA Reads the Market glossary/SOP
0%|░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░| planned
```
