# AI Briefing Scale Rollout V1

This document defines the next focused rollout track for expanding reviewed SETA AI briefings beyond the current sample set. It assumes Card Jobs V2 quality review has passed and the dashboard can already render reviewed static briefings with deterministic Briefing Mode fallback.

## Objective

Scale reviewed AI-assisted briefings across a larger asset and timeframe population while preserving the current SETA safety model:

- no API calls from the static dashboard
- no committed API keys or local secrets
- no buy/sell instructions, price targets, guarantees, or personalized advice
- no claim that attention, participation, or breadth proves demand
- only reviewed/public-safe static payloads are eligible for dashboard display
- deterministic Briefing Mode remains the fallback for missing, stale, suppressed, or invalid generated content

## Current production contract

The dashboard reads a reviewed briefing payload from `dashboard_fix26_mode_manifest.json`. It should only display reviewed matches for the current mode, asset, frequency, display range, and as-of context. The generated content contract remains `ai_briefing_output_v1`, with Card Jobs V2 as the display model:

- What SETA Sees: interpretation
- Why It Matters: implication
- Evidence: factual receipts
- Participation Quality: trust/read-through layer using participation plus authorship/source breadth

Legacy top-level fields remain compatibility mirrors of the four card jobs until a later schema version removes that requirement.

## Scale target

Initial large-population target:

```text
~50 assets x 2 to 4 contexts per asset
```

Recommended context set:

| Context | Purpose | Initial priority |
| --- | --- | --- |
| Public D 3M | Current public default daily read | Required for public assets |
| Public W 1Y | Slower public structural read | Required for public assets with weekly coverage |
| Member D 6M | Richer daily member read | Required for member assets |
| Member W 1Y | Slower member structural read | Required for member assets with weekly coverage |

Do not generate contexts that are not present in the chart payload/index. Missing upstream coverage should be reported, not patched by hand.

## Model and cost policy

Use low-cost generation for bulk drafts and reserve stronger models for spot QA or disputed outputs.

Recommended defaults:

- bulk candidate generation: low-cost model configured through `OPENAI_BRIEFING_MODEL`
- temperature-style creativity: keep low or deterministic where supported
- reasoning effort: use the lowest setting that still passes quality gates for routine refreshes
- batch/API mode: prefer batch or off-peak local runs when practical

Budget guardrail for the large rollout:

```text
The daily candidate-generation run should estimate expected cost before calling the provider.
Abort or require explicit override if estimated cost exceeds the configured budget cap.
```

Near-term cap:

```text
$0.50/day target for routine bulk drafting
$1.00/day hard warning threshold for standard non-batch runs
```

The dashboard should never depend on a same-day AI call to render. If generation is skipped, delayed, or fails, reviewed static payloads and deterministic Briefing Mode keep the product usable.

## Rollout phases

### Phase S1 - Scale plan and coverage matrix

Purpose:

- define the asset/context matrix from the manifest and chart indexes
- separate available contexts from upstream-missing contexts
- create a local-only review packet target for the larger population

Acceptance:

- no dashboard runtime behavior changes
- no generated reviewed payload changes
- matrix distinguishes public/member coverage
- SPY and other upstream gaps remain explicit warnings, not failures, unless the configured production contract changes

### Phase S2 - Bulk local input and prompt-pack generation

Purpose:

- generate `ai_briefing_input_v1` objects for the available matrix
- build provider-neutral prompt JSONL records
- keep all intermediate input/output artifacts under ignored local folders

Acceptance:

- all inputs validate before any provider call
- prompt pack includes mode, asset, frequency, range, and as_of metadata
- provider-neutral prompt records do not expose secrets
- prompt count and expected output paths are visible before generation

### Phase S3 - Low-cost candidate generation

Purpose:

- generate draft candidate JSON files for the available matrix using the configured local OpenAI model
- validate candidates with existing quality gates
- write a run report with pass/fail counts and error reasons

Acceptance:

- `OPENAI_API_KEY` is read only from the local environment
- failed or invalid candidates remain local-only
- output files are not promoted automatically
- run report includes model, prompt version, candidate count, pass count, and failures

### Phase S4 - Review packet and promotion batch

Purpose:

- produce a human-readable review packet for passing candidates
- promote only reviewed outputs into the reviewed static payload
- keep payload lookup keys stable for dashboard use

Acceptance:

- only `review_status: reviewed` outputs are promoted
- promoted payload validates against the dashboard smoke test
- payload coverage is summarized by mode, asset, frequency, and range
- stale/missing contexts continue to fall back to deterministic Briefing Mode

### Phase S5 - Daily refresh integration

Purpose:

- add an optional, gated local refresh step that can generate or refresh reviewed briefings after chart/screener payloads update
- keep publishing safe when the AI step is skipped or fails

Acceptance:

- refresh runner can skip AI generation without blocking dashboard data refresh
- publishing still requires smoke tests and public-safety gates
- no secrets are staged or committed
- generated reviewed payload commits are easy to review separately from code changes

## Suggested first implementation patch

Branch:

```text
feature/ai-briefing-scale-rollout
```

Allowed files:

- `docs/AI_BRIEFING_SCALE_ROLLOUT_V1.md`
- `README.md`
- optional local-only rollout helper script under `scripts/`
- optional smoke coverage for the helper script

Protected files:

- `dashboard_fix26_app.js`
- `dashboard_fix26_mode_manifest.json`
- embed HTML files
- generated chart/screener JSON payloads
- reviewed briefing payloads, unless the patch is explicitly a reviewed-payload promotion patch

## Local command sequence

Start with the existing small sample packet:

```powershell
python scripts/build_ai_briefing_sample_packet.py
```

Build a provider-neutral prompt pack:

```powershell
python scripts/build_ai_briefing_candidate_prompt_pack.py --sample-packet briefing_outputs/sample_review_<UTC stamp>/sample_review_packet.json
```

Generate local OpenAI candidates with the configured model:

```powershell
set OPENAI_BRIEFING_MODEL=gpt-5.4-nano
python scripts/generate_ai_briefing_candidates_openai.py --prompt-jsonl briefing_outputs/ai_candidate_pack_<UTC stamp>/ai_candidate_prompts.jsonl --reasoning-effort low
```

Compare candidates against the deterministic baseline:

```powershell
python scripts/compare_ai_briefing_candidates.py --sample-packet briefing_outputs/sample_review_<UTC stamp>/sample_review_packet.json --candidate-dir briefing_outputs/ai_candidate_pack_<UTC stamp>/candidate_outputs
```

Promote only reviewed outputs:

```powershell
python scripts/promote_ai_briefing_reviewed.py <reviewed draft files> --output generated_briefings_reviewed_v2.json
```

Run gates before any dashboard publication:

```powershell
python scripts/check_briefing_semantic_regression.py
python scripts/smoke_ai_briefing_contract.py
python scripts/smoke_fix26_dashboard.py
```

## Done criteria for scale rollout

The scale rollout is considered ready when:

- the larger asset/context matrix can be generated locally without hand-building case lists
- candidate generation has a visible cost/budget gate
- quality-gate failures are summarized clearly
- passing candidates produce a human review packet
- reviewed outputs can be promoted without changing dashboard runtime code
- the dashboard still falls back cleanly for missing, stale, suppressed, or invalid reviewed briefings
