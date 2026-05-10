# Briefing Card Jobs V2

This document defines the next product contract for the SETA Briefing panel.

The goal is to reduce repetition between cards and make each card answer a distinct reader question.

## Problem Statement

The current semantic clarity work improved the language, but the cards can still overlap:

- **What SETA Sees** and **Evidence** can repeat the same labels.
- **Why It Matters** can sound like static taxonomy rather than a useful implication.
- **Trust Check** can still read like internal data-quality prose instead of telling the viewer whether participation is improving, fading, broadening, or concentrating.

V2 separates interpretation, implication, receipts, and participation quality.

## Card Jobs

### 1. What SETA Sees

**Reader question:** What is the current read?

This card should synthesize the setup in plain English.

It should include:

- primary read
- shared-zone state
- alignment or conflict between structure and timing

It should avoid:

- listing every supporting label
- repeating evidence bullets
- explaining methodology in detail

Example:

> Quiet Neutral. Price remains inside the shared price/sentiment zone. Structure is constructive, but timing has not confirmed it.

### 2. Why It Matters

**Reader question:** Why should I care about this state?

This card should explain the practical implication of the read.

It should include:

- whether the state is mixed, aligned, dislocated, escalating, fading, or low-conviction
- why SETA treats the condition as context, watch, pressure, or confirmation
- what the state means for interpretation, without giving advice or a trade signal

It should avoid:

- restating attention label + regime label only
- generic language such as "attention describes participation context"
- directional claims, price predictions, or trade instructions

Example:

> This is a mixed, low-escalation state. SETA sees constructive structure, but without stronger timing or participation, the read stays contextual rather than decisive.

### 3. Evidence

**Reader question:** What facts support the read?

This card should be factual receipts only.

It should include compact items such as:

- close / latest available close
- shared-zone state
- structure
- timing
- volume
- latest confirmed or watch event if relevant

It should avoid:

- interpreting what the read means
- repeating the full "What SETA Sees" sentence
- trust caveats

Example:

- Close: 215
- Shared zone: Inside
- Structure: Bullish Expansion
- Timing: Bearish Confirmation
- Volume: Normal

### 4. Trust Check / Participation Quality

**Reader question:** Can I trust the participation signal?

This card should explain participation quality, not just data coverage.

It should include:

- participation level and trend
- authorship/source breadth level and trend
- combined read-through

Preferred framing:

> Participation tells us whether the conversation is getting louder or quieter. Authorship breadth tells us whether that participation is distributed or concentrated. Taken together, they qualify how much confidence to place in the attention read.

It should avoid:

- leading with internal measurement caveats
- repeating "X/news may be sample-limited" by default
- implying breadth proves organic demand
- implying attention validates price action

Example:

> Participation is quiet and not accelerating. Authorship breadth is broad, meaning the available activity is not overly concentrated. Taken together, this supports a measured read rather than a crowd-driven surge.

## Participation Quality Matrix

Use this matrix for the combined read-through:

| Participation | Authorship breadth | Public read-through |
|---|---|---|
| Rising | Broadening | Participation is expanding across more sources. |
| Rising | Narrowing | Attention is increasing, but the activity may be concentrated. |
| Falling | Broad | Broad interest remains, but intensity is cooling. |
| Quiet | Broad | No surge is visible, but participation is not narrowly isolated. |
| Elevated | Source Limited | Attention is visible, but confidence is qualified by available coverage. |
| Quiet | Narrow | The signal is low-intensity and concentrated. |
| Stable | Stable / Broad | Participation quality supports a measured read. |

## Proposed Input Fields

Future implementation should add structured fields rather than relying only on generated prose.

Suggested shape:

```json
{
  "participation_trend": {
    "current_label": "Quiet",
    "direction": "Stable",
    "current_score": 32,
    "prior_score": 34,
    "delta": -2,
    "public_note": "Participation is quiet and not accelerating."
  },
  "authorship_breadth_trend": {
    "current_label": "Broad",
    "direction": "Stable",
    "current_score": 100,
    "prior_score": 96,
    "delta": 4,
    "public_note": "Available participation appears broadly distributed."
  },
  "participation_quality": {
    "label": "Measured / distributed",
    "public_note": "Attention is quiet, but breadth is broad, supporting a measured read rather than a narrow burst."
  }
}
```

## Implementation Roadmap

### Phase 1: Product Contract

- Add this document.
- Reference it from `docs/UX_BRIEFING_MODE_V1.md`.

### Phase 2: Input Builder

Update `scripts/build_ai_briefing_input.py` to compute:

- `participation_trend`
- `authorship_breadth_trend`
- `participation_quality`

Trend calculations should use visible-window data when possible.

### Phase 3: Generator

Update `scripts/generate_ai_briefing_draft.py` so:

- `what_seta_sees` is synthesized interpretation only
- `why_it_matters` explains implication
- `evidence` stays factual
- `trust_check` uses participation quality

### Phase 4: UI Renderer

Update the briefing panel renderer or semantic patch so:

- evidence displays as receipt chips / compact bullets
- trust check becomes participation quality
- card copy avoids repetition

### Phase 5: Regression Tests

Extend `scripts/check_briefing_semantic_regression.py` to assert:

- `what_seta_sees` contains interpretation language
- `evidence` does not duplicate the full interpretation sentence
- `trust_check` includes participation and breadth concepts
- old internal caveat wording does not reappear in public copy

## Acceptance Criteria

- Each card has a distinct reader job.
- "What SETA Sees" and "Evidence" no longer repeat the same message.
- "Why It Matters" explains why the state is useful to understand.
- "Trust Check" explains participation quality using participation + authorship breadth.
- Public copy remains educational, non-advisory, and non-predictive.
