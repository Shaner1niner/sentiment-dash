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

TODO.

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
