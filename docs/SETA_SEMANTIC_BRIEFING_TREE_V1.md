# SETA Semantic Briefing Tree V1

This document defines the docs-first design sprint for turning SETA's structured market, sentiment, attention, and technical-indicator payloads into a richer semantic briefing engine.

The goal is not to make generated text sound randomly creative. The goal is to make the underlying interpretation genuinely more expert, then let the prose reflect that structured judgment.

## Product thesis

SETA should not merely summarize chart fields. It should translate the combined indicator stack into a ranked market-state read:

```text
structured data -> semantic state tree -> narrative atoms -> optional AI polish -> reviewed payload
```

The semantic tree decides what matters. The prose layer explains it.

This creates a stronger product experience because the dashboard appears to understand the chart, sentiment backdrop, attention regime, and confirmation quality as one system rather than as disconnected labels.

## Production-grade requirement

A production-grade SETA briefing needs three things:

1. Richer inputs - the tree should use all meaningful dashboard-facing data that can support a defensible public read.
2. Clear precedence - stronger or more specific states must outrank weaker or generic states.
3. Verification - expert-level claims need golden examples, adversarial conflict cases, and deterministic smoke gates.

More available data is useful only when it improves interpretation or confidence calibration. The tree should not claim more than the data supports.

## Input dimensions

The initial production candidate dimensions are:

| Family | Narrative purpose |
| --- | --- |
| SETA score / score band | Establish broad regime before fine-grained timing. |
| Market tape family / archetype | Explain whether the asset is in pressure, repair, deterioration, compression, or validation mode. |
| Asset family | Adjust tone and thresholds for crypto, equities, ETFs, high-beta tech, or macro proxies. |
| Mode and timeframe | Avoid speaking about short-term and structural reads the same way. |
| Shared zone / overlap | Explain price/sentiment agreement, dislocation, or inactive confirmation. |
| Pressure direction | Identify bullish pressure, bearish pressure, reversion context, or exhaustion context. |
| Confirmation status | Separate confirmed, unconfirmed, watch, and inactive states. |
| Latest event | Add recency through rejection, repair, confirmation, watch, or no visible event. |
| MACD label | Establish directional timing. |
| MACD histogram | Capture acceleration, deceleration, or loss of momentum. |
| RSI | Identify momentum health, weakness, constructive posture, or exhaustion. |
| Stoch RSI | Add short-cycle stretched/washout context. |
| Sentiment MA ribbon | Explain sentiment structure, compression, expansion, or deterioration. |
| Attention / engagement level | Explain whether participation is quiet, normal, elevated, crowded, or extreme. |
| Attention direction | Explain whether attention is rising, falling, or stable. |
| Attention polarity | Identify bullish attention spikes, bearish attention spikes, or mixed attention. |
| Volume confirmation | Separate moves supported by volume from moves lacking volume confirmation. |
| Source breadth / authorship | Calibrate whether the read is broad, narrow, stable, broadening, or concentrated. |
| Participation quality | Explain whether participation confirms, warns, broadens, concentrates, or limits confidence. |
| Data quality / freshness | Prevent overconfident copy when context is stale, sparse, or missing. |

Inputs should answer at least one of these questions:

- What is the broad regime?
- Is price/sentiment alignment or dislocation active?
- Is the pressure confirmed, unconfirmed, or only a watch condition?
- Does timing support or conflict with the pressure?
- Does participation confirm, warn, broaden, concentrate, or weaken confidence?
- Is the read supported by broad sources or narrowly concentrated activity?
- Is this a short-cycle move, structural move, or mixed-timeframe conflict?

Production note: more available data is useful only when it maps to a semantic role. Fields that do not change state, confidence, participation role, or evidence quality should stay out of the V1 tree until their role is clear.

## Semantic output object

TODO.

## Primary-state precedence

TODO.

## Conflict rules

TODO.

## Participation Quality as a dynamic modifier

TODO.

## Card-specific narrative rules

TODO.

## Verification strategy

TODO.

## Initial implementation plan

TODO.

## Pro-mode review prompt

TODO.

## Open questions

TODO.
