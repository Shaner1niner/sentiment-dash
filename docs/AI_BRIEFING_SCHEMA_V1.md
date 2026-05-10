# AI Briefing Schema V1

AI-generated SETA briefings should explain structured SETA data. They should not invent market facts.

This schema is a product contract for future generated briefings. It also mirrors the first manual/dashboard Briefing Mode.

See `docs/AI_BRIEFING_IMPLEMENTATION_PLAN_V1.md` for the rollout path, prompt contract, safety checks, and dashboard fallback behavior.

## Required Inputs

```json
{
  "asset": "BTC",
  "frequency": "D",
  "display_range": "3M",
  "price_context": {},
  "overlap_context": {},
  "sentiment_context": {},
  "attention_context": {},
  "breadth_trust": {},
  "indicator_context": {},
  "safety_constraints": {}
}
```

The implementation plan expands these groups into the minimum normalized fields needed for a local offline generator.

## Breadth Trust Object

```json
{
  "source_breadth_score": 72,
  "source_breadth_label": "Broad",
  "source_breadth_confidence": "usable",
  "source_caveat": "X and news inputs may be sample-limited.",
  "interpretation": "Participation appears distributed across a broader source base."
}
```

## Output Shape

```json
{
  "headline": "",
  "summary": "",
  "briefing_cards": {
    "what_seta_sees": {
      "role": "Interpretation",
      "copy": ""
    },
    "why_it_matters": {
      "role": "Implication",
      "copy": ""
    },
    "evidence": {
      "role": "Receipts",
      "items": []
    },
    "participation_quality": {
      "role": "Trust check",
      "copy": ""
    }
  },
  "what_seta_sees": "",
  "why_it_matters": "",
  "evidence": [],
  "trust_check": "",
  "limitations": "",
  "public_safe_disclaimer": "",
  "source_breadth_used": true,
  "review_status": "draft"
}
```

`briefing_cards` is required and is the primary generation target. The legacy
top-level fields remain required for backward compatibility and must mirror the
structured cards:

- `what_seta_sees` mirrors `briefing_cards.what_seta_sees.copy`
- `why_it_matters` mirrors `briefing_cards.why_it_matters.copy`
- `evidence` mirrors `briefing_cards.evidence.items`
- `trust_check` mirrors `briefing_cards.participation_quality.copy`

Until a later schema version intentionally separates them, generators should
write the four cards first and derive the legacy fields from those cards.

## Rules

- Keep the four card jobs distinct: interpretation, implication, receipts, and participation quality.
- Evidence items should be factual receipts only, not interpretation.
- Treat breadth as a trust layer, not a signal.
- Participation Quality should combine participation movement with authorship/source breadth.
- Mention narrow or source-limited breadth when it affects confidence.
- Do not claim that broad breadth proves organic demand.
- Do not treat attention as validation unless structure and context also support the read.
- Avoid buy/sell language, price targets, guarantees, and personalized advice.
- Publish generated briefings only after they pass safety checks and review.
- Preserve deterministic Briefing Mode as the fallback when generated content is missing, stale, suppressed, or invalid.

