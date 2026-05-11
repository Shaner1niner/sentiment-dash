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

The tree should produce a structured semantic object before any prose is written. This object is the bridge between raw dashboard payloads and user-facing narrative cards.

Example:

```json
{
  "schema_version": "seta_semantic_briefing_state_v1",
  "asset": "LINK",
  "mode": "member",
  "frequency": "D",
  "display_range": "6M",
  "primary_state": "unconfirmed_bullish_pressure",
  "primary_label": "Unconfirmed bullish pressure with bearish rejection risk",
  "secondary_state": "bearish_rejection_counter_signal",
  "timing_state": "negative_divergence_with_constructive_rsi",
  "ribbon_state": "bearish_expansion",
  "participation_state": "quiet_increasing",
  "breadth_state": "broad_stable",
  "confidence_state": "qualified_confirmation",
  "participation_role": "confidence_limiter",
  "evidence_atoms": [
    "outside_shared_zone",
    "bullish_pressure_unconfirmed",
    "bearish_rejection_present",
    "quiet_participation",
    "broad_source_breadth"
  ],
  "semantic_trace": {
    "precedence_rule": "pressure_state_over_generic_archetype",
    "primary_state_source": ["overlap_context", "event_context"],
    "counter_signal_source": ["latest_event"],
    "confidence_limiter": "quiet_participation"
  }
}
```

The dashboard does not need to expose this object initially. It should be used for local draft generation, QA, prompt packs, and reviewed-payload promotion.

The important production rule is that every narrative claim should trace back to one or more semantic fields. If the prose says confirmation is limited, the semantic object should contain a confidence limiter. If the prose says participation is a warning context, the semantic object should contain a participation role that supports that wording.

## Primary-state precedence

Initial precedence order:

1. Strong SETA score / dashboard regime when extreme or decisive.
2. Confirmed pressure state.
3. Unconfirmed pressure state with direction.
4. Latest rejection / repair / confirmation event.
5. MACD direction plus histogram behavior.
6. RSI and Stoch RSI posture.
7. Sentiment ribbon structure.
8. Attention / engagement level, direction, and polarity.
9. Volume confirmation.
10. Source breadth / authorship quality.
11. Generic archetype summary.

Key rule:

```text
Specific active states outrank generic narrative labels.
```

The primary read should not flatten a specific pressure/rejection setup into a broad archetype label. Generic labels are useful only after the tree confirms that no stronger pressure, regime, event, or timing state should dominate.

Examples:

| Situation | Preferred primary read |
| --- | --- |
| Bullish pressure + bearish rejection | Unconfirmed bullish pressure with bearish rejection risk |
| Bearish pressure + bullish repair | Unconfirmed bearish pressure with bullish counter-pressure risk |
| Inactive overlap + bearish MACD + mixed RSI | Bearish timing pressure with mixed RSI |
| Inactive overlap + weakening sentiment + resilient price | Weakening sentiment momentum with price resilience |
| Strong Bearish score + inactive overlap | Strong Bearish SETA risk state; overlap confirmation inactive |
| Strong Bullish score + quiet participation | Strong Bullish SETA opportunity state; participation not yet confirming |
| Bearish attention spike + price extension | Bearish attention spike / possible exhaustion warning |
| Bullish attention spike + washed-out timing | Bullish repair attempt with incomplete confirmation |

Open design question: confirmed pressure and extreme SETA score may both be high-precedence states. V1 should explicitly test which one becomes primary and which one becomes a modifier so that strong score and overlap confirmation do not fight each other in prose.

## Conflict rules

Conflict rules are the heart of the expert layer. They prevent the system from listing mixed facts without judgment.

| Conflict | Interpretation pattern |
| --- | --- |
| Bullish pressure + bearish rejection | Pressure exists, but rejection limits confirmation. |
| Bearish pressure + bullish counter-pressure | Exhaustion pressure exists, but counter-pressure limits confidence. |
| Bearish MACD + constructive RSI | Trend/timing is bearish, but RSI is not capitulating. |
| Positive MACD histogram + negative divergence | Price momentum is not fully broken, but sentiment timing is weakening. |
| Strong price + bearish attention spike | Attention may be warning of exhaustion rather than validating strength. |
| Weak price + bullish attention spike | Participation may be probing repair, but confirmation must come from structure/timing. |
| Quiet participation + broad authorship | The read is not narrowly sourced, but it lacks a participation surge. |
| Elevated participation + narrow authorship | Attention is active, but concentration risk lowers confidence. |
| High volume + bearish rejection | Participation may confirm the rejection event. |
| High volume + bullish pressure | Participation may increase the importance of reversion pressure, but it is not proof. |
| Weekly constructive + daily bearish | Structural context is better than short-term timing. |
| Daily constructive + weekly bearish | Short-term repair is occurring inside weaker structure. |

Verification note: conflict rules should become testable assertions. A future semantic-state smoke test should assert the resolved state, counter-signal, and confidence modifier for each major conflict case.

## Participation Quality as a dynamic modifier

Participation Quality is not a boilerplate trust check. It can change the meaning of the setup.

The same participation state can matter differently depending on regime:

| Participation context | Semantic implication |
| --- | --- |
| Bearish attention spike + price overextension + Stoch RSI stretched high | Possible exhaustion warning even if price remains strong. |
| Bullish attention spike + washed-out Stoch RSI + weak price | Possible repair attempt, but confirmation depends on timing/overlap. |
| Elevated attention + narrow authorship | Concentrated attention; confidence should be qualified. |
| Quiet attention + broad authorship | Distributed but low-intensity read; useful context, not escalation. |
| Rising participation + confirmed pressure | Participation increases confidence in the pressure event. |
| Falling participation + active pressure | Pressure may be technically visible but less participation-supported. |
| Broadening authorship + stable attention | Reliability improves without necessarily implying demand. |
| Crowded bearish attention + strong price | Potential contrarian/exhaustion context, not a standalone signal. |

Participation Quality should answer:

```text
Does participation confirm, warn, broaden, concentrate, or limit confidence?
```

It should not say that attention, breadth, or participation proves demand.

Production rule: Participation Quality should be allowed to become a first-class modifier when attention is extreme, directional, or sharply changing. In quieter regimes, it can remain a confidence/trust layer.

## Card-specific narrative rules

Each card has a different job. The semantic tree should prevent the cards from repeating the same generic summary.

### What SETA Sees

Purpose: expert interpretation.

This card should include:

- primary state
- shared-zone / pressure state
- latest event or counter-signal
- timing stack
- sentiment ribbon
- participation context

Target style:

```text
Primary read: Unconfirmed bullish pressure with bearish rejection risk. Price is outside the shared price/sentiment zone with unconfirmed bullish pressure, while bearish rejection remains a counter-signal. The timing stack shows negative divergence with constructive RSI and stretched Stoch RSI, while participation is quiet but rising.
```

### Why It Matters

Purpose: implication and confidence.

This card should answer:

- Why does this setup deserve attention?
- What confirms it?
- What limits it?
- What remains unresolved?

Target style:

```text
This matters because price and sentiment are no longer moving inside the same shared zone, but the latest rejection and quiet participation keep confirmation qualified rather than decisive.
```

### Evidence

Purpose: receipts.

Evidence should be factual and terse. It should not carry the full interpretation.

Good evidence atoms:

- Latest available close: 10.6.
- Shared-zone receipt: Bullish Pressure Active.
- Latest event: Bearish Rejection on 2026-05-11.
- Timing receipt: negative divergence; RSI constructive; Stoch RSI stretched high.
- Participation receipt: quiet and increasing; volume context high.

Avoid in Evidence unless a validator explicitly permits it:

- this matters
- SETA treats
- should
- proves
- confidence improves
- prediction or advice language

### Participation Quality

Purpose: trust and participation interpretation.

Default target structure:

```text
Participation is quiet but increasing. Authorship breadth is broad and stable. This keeps confidence calibrated to participation breadth and source coverage.
```

Attention-spike target structure:

```text
Bearish attention is elevated while price is extended. That makes participation a warning context rather than a validation signal; breadth determines whether the warning is broadly sourced or narrowly concentrated.
```

### Limitations and disclaimers

Implementation caveats and educational disclaimers should stay in dedicated limitation/disclaimer fields where possible. They should not make the premium card copy sound defensive unless the data itself is stale, sparse, or incomplete.

## Verification strategy

Expert-level analysis cannot be verified only by passing safety checks. Safety gates catch forbidden language; they do not prove analytical quality.

A production-grade system needs layered verification.

### Golden-case fixtures

Create a small set of hand-reviewed canonical examples:

| Fixture | Expected state |
| --- | --- |
| BTC public D 3M | Weakening sentiment momentum with price resilience OR bearish timing pressure with constructive RSI |
| NVDA public D 3M | Weakening sentiment momentum with price resilience |
| LINK member D 6M | Unconfirmed bullish pressure with bearish rejection risk |
| MSFT member D 6M | Bearish timing pressure with mixed RSI |
| Bearish attention spike + price extended | Exhaustion warning / bearish attention spike warning |
| Bullish attention spike + washed-out structure | Repair attempt with incomplete confirmation |
| Strong Bearish score + inactive overlap | Bearish regime with inactive overlap confirmation |
| Strong Bullish score + quiet participation | Bullish regime with participation not yet confirming |

### Adversarial conflict cases

Construct synthetic or captured cases where signals intentionally disagree:

- bullish pressure plus bearish rejection
- bearish pressure plus bullish repair
- positive histogram plus negative divergence
- constructive RSI plus bearish MACD
- strong SETA score plus inactive overlap
- elevated attention plus narrow authorship
- quiet attention plus broad authorship
- high volume plus rejection event
- bearish attention spike plus strong/extended price
- bullish attention spike plus washed-out timing

### Precedence assertions

Tests should assert semantic outcomes directly:

```text
if pressure_state is active, generic archetype must not become primary_state
if latest rejection conflicts with pressure, counter_signal must be present
if participation is elevated and bearish while price is extended, participation_role should be warning_context
if participation is elevated but authorship is narrow, confidence_state should be qualified
if evidence includes interpretive language, evidence validation should warn or fail
```

### Narrative acceptance checks

Generated copy should be checked for:

- no contradiction between primary read and shared-zone language
- no generic label outranking active pressure
- no attention/breadth/proof misuse
- confidence qualifier present when confirmation is incomplete
- evidence remains factual
- participation role is context-specific
- card copy does not repeat the same sentence across all cards
- no buy/sell/hold language, price targets, guarantees, or personalized financial advice

### Human review panel

Before scaling any semantic-tree change, review:

```text
BTC, NVDA, LINK, MSFT + 4 synthetic/adversarial conflict cases
```

A narrative change should not be scaled to all reviewed payloads until the panel passes.

### Done signal for verification V1

The V1 verification layer is ready when the repo can run a semantic smoke test that asserts:

- expected primary_state
- expected primary_label
- expected counter_signal where applicable
- expected participation_role
- expected confidence_state
- factual evidence atoms only


## Initial implementation plan

### PR 1 - Semantic tree spec

Files:

- `docs/SETA_SEMANTIC_BRIEFING_TREE_V1.md`

Scope:

- taxonomy
- precedence
- conflict rules
- participation role matrix
- verification strategy
- Pro-mode review prompt

No runtime code.

### PR 2 - Local semantic-state helper

Files:

- `scripts/build_ai_briefing_semantic_state.py`

Scope:

- read one `ai_briefing_input_v1`
- output `seta_semantic_briefing_state_v1`
- no dashboard changes
- no reviewed payload changes
- include semantic trace fields for QA

### PR 3 - Golden-case semantic tests

Files:

- `scripts/smoke_ai_briefing_semantic_state.py`

Scope:

- assert state precedence
- assert participation role
- assert confidence modifiers
- include BTC, NVDA, LINK, MSFT and synthetic conflict cases

### PR 4 - Generator consumes semantic state

Files:

- `scripts/generate_ai_briefing_draft.py`
- optional prompt-pack guidance updates

Scope:

- replace ad hoc primary-read logic with semantic-state object
- keep output schema stable
- regenerate four sample drafts only

### PR 5 - Reviewed sample promotion

Scope:

- promote only BTC, NVDA, LINK, MSFT after human review
- no full 70-case rollout yet

### PR 6 - Broader dashboard-scheduled rollout

Scope:

- regenerate only dashboard-scheduled assets and timeframes
- avoid upstream-tracked-but-not-displayed assets unless they are added to the dashboard schedule
- require semantic-state smoke gates before reviewed payload promotion

## Pro-mode review prompt

Use this after the V1 design spec exists and before implementation:

```text
Given this SETA semantic framework, identify missing states, precedence conflicts, and better narrative atoms.

Context:
SETA converts structured market, sentiment, attention, source breadth, and technical-indicator data into educational market briefings. It must not provide financial advice, price targets, guarantees, or buy/sell instructions.

Goal:
Improve the semantic state tree before implementation.

Please review:
1. Input dimensions
2. Primary-state precedence
3. Conflict rules
4. Participation Quality role matrix
5. Card-specific narrative rules
6. Verification strategy
7. Implementation plan

Please return:
- missing states
- precedence conflicts
- cases likely to produce contradictory prose
- better primary-state labels
- better counter-signal labels
- better participation/attention spike atoms
- suggested golden fixtures
- suggested adversarial fixtures
- any safety or product risks
```

The desired output is a design critique, not final code. The semantic tree should make the judgment; an AI layer can later polish wording within strict factual and safety constraints.

## Open questions

TODO.
