# How SETA Reads the Market

SETA is designed to read market emotion, setup quality, and participation context. It is not designed to issue price targets or trade instructions.

This page defines the language used in SETA dashboard posts, Substack writeups, and social excerpts so the system can be discussed consistently.

## The short version

SETA asks four practical questions:

1. **What is the market paying attention to?**
2. **Is the setup structurally coherent?**
3. **Is participation broad enough to trust the read?**
4. **What evidence supports or weakens the interpretation?**

The dashboard is organized around those questions. The top sections tell the story. The chart acts as the receipt.

## Structure Score

**Structure Score** is SETA's 0–100 read on setup quality: how coherent the current sentiment, price, technical, confirmation, and participation structure looks.

It is the public dashboard's primary score, but it is not a trade signal.

Working interpretation bands:

```text
0–35     Weak structure
35–65    Mixed / transitional structure
65–85    Constructive structure
85–100   High-conviction structure
```

Preferred language:

```text
Structure Score is weak and softening.
Structure Score is mixed but improving.
Structure Score is constructive, but participation still needs confirmation.
```

Avoid:

```text
SETA says buy.
SETA says sell.
The score guarantees a reversal.
```

## Structure Trend

**Structure Trend** describes the recent direction of the Structure Score, usually over the latest hourly structure window.

The number and the trend state are separate ideas:

```text
48.5 · Softening
```

This means:

```text
Current Structure Score: 48.5
Recent direction of travel: Softening
```

Common trend states:

```text
Improving   = structure has strengthened recently
Softening   = structure has weakened recently
Stable      = structure is mostly holding steady
Mixed       = recent movement is choppy or not directionally clean
```

When the dashboard says something like:

```text
Structure stack: Mixed (-4.5)
```

`Mixed` describes the overall structure stack classification. It should not be treated as a standalone trade direction.

## Signal State

**Signal State** summarizes the current directional lean and setup stage.

It usually reads like:

```text
Bias: Bearish · Stage: Momentum
```

Plain English:

```text
SETA sees the setup leaning bearish, and that pressure is still active rather than fully exhausted.
```

Current visible Bias vocabulary:

```text
Bullish
Bearish
Mixed
Neutral
```

Current stage/context language should mirror the dashboard when available. Common words include:

```text
Confirmation
Watch
Setup
Repair
Momentum
Confirmed
```

Publishing rule: mirror the dashboard. Do not invent a richer stage taxonomy unless the product explicitly adds it.

## Participation Quality

**Participation Quality** asks whether the read is supported by broad, durable attention or distorted by thin, noisy, concentrated participation.

It is a reliability layer, not a popularity contest.

Useful participation concepts:

```text
source breadth
author / contributor breadth
engagement volume
source diversity
concentration
stability over time
```

Safe phrasing:

```text
Participation is not unusually loud, but it is broad enough that the read is not relying on one isolated source pocket.
```

When participation is thin, discount confidence:

```text
Participation is thin, so confidence in this read should be discounted.
```

Participation quality affects confidence. It does not automatically determine direction.

## Evidence

**Evidence** is the receipt layer behind the read.

In public posts, use this hierarchy:

1. **Receipts** — visible dashboard/chart evidence
2. **System Notes** — SETA system context such as source mix, confirmation, participation, and deeper evidence receipts
3. **External Context** — earnings, macro events, filings, or other outside context only when relevant and verified

Evidence should support the interpretation without pretending to offer certainty.

Preferred phrasing:

```text
The visible receipts support a cautious read, but confirmation remains incomplete.
```

Avoid:

```text
The evidence proves what happens next.
```

## Overlap Band

**Overlap Band** is high-value context for sentiment/price separation and possible floor/ceiling behavior. It is not a mandatory narrative pillar.

The overlap layer can matter when sentiment and price are pressing into an area where they have historically struggled to separate cleanly. That can argue against treating a move as effortless one-way continuation.

Publishing rules:

- default to silent omission
- do not force Overlap Band into every post
- mention it only when the floor/ceiling is visually obvious, materially changes interpretation, price is pressing into it, or the post is specifically about sentiment/price alignment
- when unavailable, usually omit rather than adding boilerplate
- do not replace unavailable overlap with an unlabeled proxy
- never describe overlap as a price target or guaranteed reversal level

Safe phrasing when it matters:

```text
Overlap context argues against treating this as clean one-way continuation.
```

Expanded phrasing:

```text
The overlap band is acting more like context than confirmation here: it suggests price may be pressing into an area where sentiment and price structure have historically struggled to separate cleanly.
```

Avoid:

```text
The overlap band says price will reverse.
```

## Research Mode

**Research Mode** contains the deeper receipts behind the read.

Briefing mode is the clean reader layer. Research mode is the expanded diagnostic layer.

Safe phrasing:

```text
Research mode contains the deeper receipts behind the read.
```

Expanded phrasing:

```text
Research mode shows additional evidence inputs, including source mix, drivers, confirmation context, and deeper receipt trails.
```

Do not make Research mode sound like a mystery box. It is a transparency layer.

## AI / model badge

The AI/model badge is a context flag, not a standalone signal.

Mention it only when it materially agrees or conflicts with the Structure read, is unusually unanimous/extreme, has hit-rate context attached, or the post is specifically about the model layer.

Safe sentence:

```text
Model bias is down near-term; treat it as context, not a standalone signal.
```

When the model and structure disagree:

```text
The model leans down, but SETA still discounts that read unless structure and participation confirm it.
```

Avoid using model output as the headline unless the article is explicitly about the model layer.

## Chart layers

Use these labels as capitalized dashboard-layer names:

```text
Structure
Momentum
Pressure
Timing
```

Working meanings:

```text
Structure: how coherent the setup looks
Momentum: whether the move still has force
Pressure: where unresolved tension is building
Timing: whether the setup looks early, extended, or vulnerable to mean reversion
```

These are diagnostic layers, not separate trade signals.

## Color semantics

Color describes context inside each layer. It should not be flattened into universal bullish/bearish language.

```text
Green  = improving / constructive / confirmation increasing
Yellow = mixed / transitional / watch zone
Red    = weakening / deteriorating / risk rising
```

Important distinction:

```text
Green structure in a bearish setup may mean the bearish setup is becoming more coherent.
Red structure in a bullish setup may mean the bullish setup is weakening.
```

So:

```text
green does not always mean bullish
red does not always mean short
```

## Default Substack format

Use this structure for standard public posts:

1. Headline
2. Dashboard screenshot
3. SETA read in plain English
4. What SETA sees
5. Why it matters
6. Receipts
7. System Notes
8. Participation Quality
9. What would change the read
10. Safety reminder

Default metadata block:

```text
Asset: BTC
View: Daily / 3M
Read: Weak structure, softening
```

Default timeframe:

```text
Daily / 3M
```

This means roughly the last three months of available daily observations, not exactly 90 candles. For equities, weekends and holidays are trading-session gaps. For crypto, the daily view is more continuous.

## Language policy

Use language that explains:

```text
attention
participation
narrative structure
setup quality
confirmation
pressure
validation
```

Avoid language that implies:

```text
price targets
trade instructions
guaranteed reversals
certainty
```

SETA's public promise is simple:

```text
SETA explains market emotion and setup quality. It does not tell readers what to buy or sell.
```
