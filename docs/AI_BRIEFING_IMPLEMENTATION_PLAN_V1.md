# AI Briefing Implementation Plan v1

This document turns the AI briefing schema into an implementation path. It is designed to keep the current GitHub Pages dashboard useful while preparing SETA for generated briefings later.

The core rule: do not call an AI API directly from the static dashboard. API keys, review workflows, and generated content controls belong in a local/offline job first, then a server-side service.

## Objective

AI briefings should explain structured SETA evidence in plain language.

They should not:

- invent facts not present in the input
- provide buy/sell instructions
- create price targets
- imply guaranteed outcomes
- treat attention or breadth as proof
- personalize financial advice

The first useful implementation is not a chatbot. It is a constrained briefing generator that receives a versioned SETA input object and returns a versioned public-safe output object.

## Current state

SETA already has a manual/dashboard Briefing Mode. It uses structured dashboard state to describe:

- setup summary
- evidence
- watch item
- risk
- breadth/trust context
- public/member mode differences

This is the right foundation. The AI path should preserve this shape and replace only the narrative generation layer when the input/output contract is trusted.

## Recommended rollout

### Phase 0 - Deterministic briefing baseline

Status: in progress through the current dashboard Briefing Mode.

Purpose:

- keep briefings fast and static-safe
- prove the sections users actually value
- identify missing fields before AI is introduced

Acceptance:

- public/member dashboards render Briefing Mode without a backend
- breadth appears as a trust layer
- missing breadth degrades to Source Limited
- language stays non-advisory

### Phase 1 - Local offline AI briefing harness

Purpose:

- generate sample briefings from local payloads
- store outputs as review artifacts
- compare generated text against deterministic dashboard briefings
- refine prompts, schema, and safety checks

Recommended output location:

```text
briefing_outputs/
```

This folder should stay out of the committed production path unless a reviewed artifact is intentionally promoted.

Acceptance:

- no API key is committed
- generator reads structured local JSON inputs
- generated outputs include schema version and model metadata
- outputs pass public-safety checks before review
- breadth/trust language appears when the input contains breadth data

### Phase 2 - Reviewed static briefing payloads

Purpose:

- publish reviewed generated briefings as static JSON
- allow GitHub Pages to display AI-assisted copy without exposing an API key

Possible payload:

```text
generated_briefings_reviewed.json
```

Acceptance:

- only reviewed/public-safe outputs are published
- dashboard prefers fresh, reviewed payload matches and falls back to deterministic Briefing Mode otherwise
- payload has date/model/schema metadata
- stale payloads are detectable

### Phase 3 - Server-side briefing service

Purpose:

- move generation behind auth, entitlements, usage controls, and review policy

Acceptance:

- all AI calls are server-side
- user entitlements are enforced outside the client
- generated outputs are stored with lineage
- safety checks run before display
- public/member/pro differences are explicit

## Input contract

The AI generator should receive a compact, evidence-only input. Do not send entire chart payloads when a smaller normalized object will do.

Required envelope:

```json
{
  "schema_version": "ai_briefing_input_v1",
  "asset": "BTC",
  "frequency": "D",
  "display_range": "3M",
  "mode": "public",
  "as_of": "2026-05-03",
  "price_context": {},
  "overlap_context": {},
  "sentiment_context": {},
  "attention_context": {},
  "breadth_trust": {},
  "indicator_context": {},
  "event_context": {},
  "safety_constraints": {}
}
```

### Minimum field groups

`price_context` should include:

- latest close
- recent direction label
- volatility label when available
- whether price confirmation is present, missing, or mixed

`overlap_context` should include:

- overlap source
- overlap state
- structure label
- latest transition
- whether the asset is inside or outside expected range

`sentiment_context` should include:

- sentiment state
- sentiment repair or deterioration flags
- narrative/engagement state when available

`attention_context` should include:

- attention score
- attention label
- attention caveat
- whether attention is material enough to mention

`breadth_trust` should include:

- source breadth label
- source breadth confidence
- concentration or narrowness note when available
- channel caveat
- whether breadth should be mentioned in public copy

`indicator_context` should include:

- MACD label
- RSI label
- Stoch RSI label
- Bollinger/overlap label
- any timing caveat

`event_context` should include:

- latest confirmed event
- latest watch event
- event count in visible window
- whether no visible events exist

`safety_constraints` should include:

- public_safe required boolean
- disallowed phrases
- financial-advice prohibition
- allowed tone
- maximum length

## Output contract

Recommended output:

```json
{
  "schema_version": "ai_briefing_output_v1",
  "asset": "BTC",
  "frequency": "D",
  "as_of": "2026-05-03",
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
  "watch_item": "",
  "limitations": "",
  "public_safe_disclaimer": "",
  "source_breadth_used": true,
  "review_status": "draft",
  "model_metadata": {
    "provider": "",
    "model": "",
    "prompt_version": "seta_briefing_prompt_v2"
  }
}
```

`briefing_cards` is the primary generation target. The legacy top-level fields
are compatibility mirrors and should be derived from the cards until the
dashboard no longer needs them. The dashboard should be able to ignore unknown
fields, keeping future output versions additive where possible.

## Prompt contract

Use a short system instruction plus a strict task prompt. The task prompt should require JSON output.

### System instruction

```text
You write SETA market briefings from structured evidence. You do not invent facts, provide investment advice, create price targets, or use buy/sell instructions. Treat sentiment, attention, and source breadth as context. Breadth is a trust check, not proof of organic demand. Use concise, plain language suitable for an educational market dashboard.
```

### Task prompt

```text
Given the SETA briefing input JSON, produce one JSON object matching ai_briefing_output_v1 using prompt_version seta_briefing_prompt_v2.

Rules:
- Use only facts present in the input.
- If evidence is mixed, say it is mixed.
- If breadth is narrow, source-limited, or unavailable, mention that as a confidence limitation.
- If attention is elevated without structure confirmation, do not call it validation.
- Avoid buy, sell, hold, target, guaranteed, should enter, should exit, and similar advisory language.
- Keep the headline under 90 characters.
- Keep the summary under 45 words.
- Generate briefing_cards first:
  - what_seta_sees: interpretation of the current read.
  - why_it_matters: implication of the read, without advice or prediction.
  - evidence: factual receipts only.
  - participation_quality: participation movement plus authorship/source breadth as a trust layer.
- Mirror briefing_cards into the legacy top-level fields.
- Keep evidence to 3 to 5 bullets.
- Include a watch_item only when the input supports one.
- Include a limitations sentence.
- Return JSON only.
```

## Safety checks

Every generated output should pass a simple local safety check before review or publication.

Minimum checks:

- valid JSON
- required output fields exist
- `briefing_cards` exists with the four required card objects
- card roles match the contract: Interpretation, Implication, Receipts, Trust check
- legacy fields mirror the card copy/items
- evidence card items remain factual receipts
- Participation Quality mentions participation and authorship/source breadth
- headline and summary length limits
- no forbidden advisory phrases
- no price target language
- no unsupported claims such as "will rise" or "will fall"
- no claim that breadth proves organic demand
- trust_check is present when breadth_trust exists
- limitations is present
- public_safe_disclaimer is present

Forbidden phrase examples:

- buy
- sell
- strong buy
- price target
- guaranteed
- will rally
- will crash
- should enter
- should exit
- financial advice

The checker should distinguish forbidden advisory use from allowed disclaimers where needed. For example, "not financial advice" may be allowed in a disclaimer, but "this is financial advice" should fail.

## Human review

For public surfaces, generated briefings should start as review-required.

Suggested statuses:

- `draft`
- `reviewed`
- `suppressed`
- `expired`

Only `reviewed` briefings should be eligible for static publication.

## Dashboard behavior

The dashboard should preserve deterministic Briefing Mode as the fallback.

Recommended display order:

1. reviewed generated briefing if available and fresh
2. deterministic Briefing Mode if generated briefing is missing, stale, suppressed, or invalid
3. compact unavailable state only if neither path has enough data

This protects the current product while AI quality improves.

## Staleness policy

Generated briefings should be treated as stale when the dashboard data date moves beyond the briefing `as_of` date.

Near-term policy:

- daily views: stale after the next data refresh
- weekly views: stale after the next weekly input update or seven calendar days
- public context cards: use existing live health checks

## Test assets

Use a fixed review set:

- BTC
- ETH
- SOL
- LINK
- NVDA
- MSFT
- AAPL
- GLD
- SPY when upstream coverage returns

Review each across:

- daily 3M
- weekly 1Y
- public mode
- member mode when applicable

## Implementation checklist

Recommended first implementation sequence:

1. add a local input normalizer that extracts `ai_briefing_input_v1` from current payloads
2. add a JSON safety checker for generated outputs
3. add a local generator harness that writes draft artifacts outside the production dashboard path
4. review sample outputs against deterministic Briefing Mode
5. add a reviewed static briefing payload only after output quality is stable
6. teach the dashboard to prefer reviewed generated briefings and fall back to deterministic Briefing Mode

Current local harness files:

- `scripts/build_ai_briefing_input.py` extracts `ai_briefing_input_v1` from Fix 26 chart and screener payloads.
- `scripts/generate_ai_briefing_draft.py` writes a deterministic local `ai_briefing_output_v1` draft for review.
- `scripts/ai_briefing_quality_gates.py` applies dashboard briefing safety gates adapted from the SETA reply-engine quality doctrine.
- `scripts/ai_briefing_reference.py` loads compact SETA glossary/reference guidance for briefing inputs and draft metadata.
- `scripts/promote_ai_briefing_reviewed.py` promotes validated local drafts into a `generated_briefings_reviewed_v1` static payload.
- `scripts/check_ai_briefing_output.py` validates generated `ai_briefing_output_v1` JSON before review or publication.
- `scripts/build_ai_briefing_sample_packet.py` creates a local sample review packet with representative inputs, validated v2 drafts, and a Markdown human-review artifact.
- `scripts/smoke_ai_briefing_contract.py` smoke-tests the input normalizer and safety checker.

The briefing quality gates intentionally borrow the reply-engine guardrail philosophy: no trade calls, no price predictions, no internal labels or raw column names, no attention-as-adoption framing, and no claim that breadth proves organic demand.

Briefing inputs also include `reference_guidance`, a compact glossary/caution object built from `agent_reference/`. This gives future model prompts definitions and do-not-overclaim guidance without exposing raw reference files or bloating the dashboard payload.

Example local input build:

```powershell
python scripts/build_ai_briefing_input.py --mode public --asset BTC --frequency D --display-range 3M --output briefing_inputs/btc_d_3m_public.json
```

Example output validation:

```powershell
python scripts/check_ai_briefing_output.py briefing_outputs/btc_d_3m_public_YYYYMMDD_draft.json --input briefing_inputs/btc_d_3m_public.json
```

Example deterministic draft generation:

```powershell
python scripts/generate_ai_briefing_draft.py --mode public --asset BTC --frequency D --display-range 3M
```

The draft generator is intentionally local and deterministic. It proves the review/output workflow without calling an AI provider or publishing anything to the dashboard.

Example sample review packet:

```powershell
python scripts/build_ai_briefing_sample_packet.py
```

This writes a local-only packet under `briefing_outputs/sample_review_<UTC stamp>/`
with representative inputs, validated draft outputs, and
`sample_review_packet.md` for human language review. The packet is the preferred
next checkpoint before asking an AI provider to generate alternative prose for
the same structured inputs.

Example reviewed payload promotion:

```powershell
python scripts/promote_ai_briefing_reviewed.py briefing_outputs/btc_d_3m_public_YYYYMMDD_draft.json --input briefing_inputs/btc_d_3m_public.json --mode public --display-range 3M --output generated_briefings_reviewed.json
```

Only genuinely reviewed outputs should be promoted into `generated_briefings_reviewed.json`. The dashboard now loads that static payload when present, requires a current asset/frequency/range/mode/as-of match with `review_status: reviewed`, and falls back to deterministic Briefing Mode for missing, stale, suppressed, or mismatched items.

The reviewed static payload started with public BTC and NVDA daily/weekly matches, then expanded to all public assets with upstream coverage. SPY remains excluded until the upstream payload gap is resolved. Small reviewed batches make it easier to inspect language quality, confirm source-breadth framing, and catch stale-price edge cases before expanding coverage.

## Open decisions

Decisions to make before Phase 1:

- which provider/model will generate draft briefings
- whether generated outputs should be stored per asset/frequency/range or only per asset/frequency
- who marks outputs as reviewed
- whether member mode can show draft/internal briefings locally
- how much source/channel detail should appear in public copy

## Current recommendation

Proceed with Phase 1 as a local offline harness. It gives SETA the benefits of AI-assisted drafting while preserving the current static dashboard, review discipline, and public-safety posture.
