# Reviewed Briefing Coverage Policy

## Purpose

This policy defines which SETA dashboard briefings should be manually reviewed, promoted, and treated as canonical reviewed payloads.

The goal is to avoid blind payload expansion while still giving the public and member dashboards reliable reviewed copy for the most important default contexts.

## Current baseline

The dashboard currently supports:

- Public dashboard asset suite
- Member dashboard asset suite
- Reviewed briefing payloads with the Card Jobs V2 contract
- Compatible reviewed fallback behavior for selected ranges without direct reviewed samples
- Deterministic briefing fallback when no reviewed sample is available
- Pending asset coverage status for assets such as SPY when upstream chart-store coverage is not yet present

The reviewed payload target should be based on active available manifest assets, excluding assets explicitly listed under `pendingAssetCoverage`.

## Coverage tiers

### Tier 1 - Required reviewed coverage

Required for every active asset available in the dashboard asset indexes.

Public mode:

- Daily default range: `3M`
- Weekly default range: `1Y`

Member mode:

- Daily default range: `6M`
- Weekly default range: `1Y`

Rationale:

- These are the default contexts users are most likely to see first.
- These contexts anchor the product voice.
- The dashboard already supports compatible fallback for non-default ranges, so direct review does not need to cover every possible range immediately.

### Tier 2 - Recommended reviewed coverage

Recommended after Tier 1 remains stable.

Public mode:

- Daily `6M` for major assets where `3M` may be too narrow
- Daily `1Y` for macro/context assets if public storytelling requires it

Member mode:

- Daily `3M`
- Daily `1Y`
- Weekly `6M` where useful for macro or long-cycle assets

Rationale:

- These ranges are common user explorations.
- They reduce reliance on compatible reviewed fallback.
- They should be expanded only after editorial quality and generation cost are understood.

### Tier 3 - Optional reviewed coverage

Optional and not required for release readiness.

- All ranges for all assets
- Special event-specific reviewed briefings
- Newsletter-linked or campaign-specific reviewed payloads
- Member-only deep research samples

Rationale:

- Useful for premium/product work.
- Not necessary for the dashboard baseline.
- Should not block dashboard QA or modularization.

## Pending asset policy

Assets listed in the manifest but not yet present in the chart-store indexes should be marked with:

```json
"pendingAssetCoverage": ["SPY"]
```

Pending assets should not create audit or smoke warnings for missing chart-store coverage.

A pending asset may move into active coverage only when:

1. Asset payload exists in the relevant public/member asset index.
2. Screener/store coverage exists if required.
3. Default reviewed briefing coverage is generated or deterministic fallback is accepted temporarily.
4. Full-suite audit and dashboard smoke pass.

## Reviewed fallback policy

When a direct reviewed briefing is unavailable for a selected range, the dashboard may use compatible reviewed fallback only when the context family matches:

- same mode
- same asset
- same frequency
- same `as_of` date
- compatible display range family

Direct reviewed match remains preferred.

If the reviewed fallback context is incompatible, the dashboard should use deterministic briefing output instead.

## Promotion policy

Reviewed payload promotion should be deliberate and scoped.

A reviewed payload promotion PR should include:

- regenerated local drafts for the target assets/ranges
- reviewed payload updates only
- no generator logic changes
- no dashboard runtime changes
- smoke validation
- copy artifact checks

Recommended validation:

```powershell
python scripts\smoke_ai_briefing_contract.py
python scripts\smoke_ai_briefing_semantic_state.py
python scripts\smoke_fix26_dashboard.py
python scripts\audit_fix26_full_asset_suite.py
```

## Expansion decision rules

Do not expand reviewed coverage just because a warning appears.

Expand reviewed coverage when at least one of these is true:

1. The asset/range is a default visible user path.
2. The deterministic fallback is materially weaker than reviewed copy.
3. The asset is part of a public demo, newsletter, launch, or member workflow.
4. The asset has recurring high-priority market-tape visibility.
5. A user-facing QA pass shows the fallback wording is confusing.

## Current recommendation

For the near-term roadmap:

1. Maintain Tier 1 as the required baseline.
2. Keep SPY pending until upstream chart-store coverage is available.
3. Do not generate all possible reviewed ranges yet.
4. Use the audit script to protect baseline coverage.
5. Begin modularization with display-range/window core extraction after this policy is merged.

## Follow-up branches

Recommended next branches:

```text
refactor/display-range-window-core-v1
qa/shared-zone-pressure-copy-fixtures-v1
plan/seta-roadmap-refresh-v1
```

## Non-goals

This policy does not:

- generate new reviewed payloads
- change dashboard runtime behavior
- change semantic classification
- define investment/trading advice
- require reviewed copy for every possible display range
