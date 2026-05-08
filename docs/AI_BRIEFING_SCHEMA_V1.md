# AI Briefing Schema V1

AI-generated SETA briefings should explain structured SETA data. They should not invent market facts.

This schema is a product contract for future generated briefings. It also mirrors the first manual/dashboard Briefing Mode.

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
  "what_seta_sees": "",
  "why_it_matters": "",
  "evidence": [],
  "trust_check": "",
  "limitations": "",
  "public_safe_disclaimer": ""
}
```

## Rules

- Treat breadth as a trust layer, not a signal.
- Mention narrow or source-limited breadth when it affects confidence.
- Do not claim that broad breadth proves organic demand.
- Do not treat attention as validation unless structure and context also support the read.
- Avoid buy/sell language, price targets, guarantees, and personalized advice.

