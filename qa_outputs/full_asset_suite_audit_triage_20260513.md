# Full Asset Suite Audit Triage — 2026-05-13

## Summary

The full asset-suite dashboard/briefing audit passed with zero errors.

- Public assets audited: 8
- Member assets audited: 27
- Dashboard guard tokens: present
- Reviewed briefing copy artifacts: 0
- Reviewed payloads: 70 keyed briefings in each reviewed payload file
- Warnings: 144

Conclusion: the current dashboard baseline is stable enough to proceed. The warning set should be treated as a roadmap/coverage inventory, not as a release blocker.

## Warning buckets

### 1. Embed cache token warnings

The audit reported no dashboard cache token for:

- `interactive_dashboard_fix24_public_embed.html`
- `interactive_dashboard_fix24_member_embed.html`

Triage classification: likely audit-script detection issue or embed-format mismatch, not necessarily a product bug.

Recommended follow-up:

- Inspect the embed script tag format.
- Update the audit regex so it recognizes the current valid cache-token pattern.
- Keep this as a small QA-script patch, not a dashboard runtime change.

Suggested branch:

`fix/full-suite-audit-embed-token-detection-v1`

### 2. SPY configured but missing from public/member indexes

The audit reported:

- `SPY` configured but missing from public index
- `SPY` configured but missing from member index

Triage classification: likely known upstream-data/manifest mismatch.

Recommended follow-up:

- Decide whether SPY should be included in the asset store now.
- If yes, generate/promote SPY data.
- If no, remove or mark SPY as pending/upstream-waiting in the manifest so the audit does not treat it as a warning.

Suggested branch:

`fix/asset-manifest-spy-coverage-status-v1`

### 3. Reviewed coverage warnings

The audit reported missing direct reviewed daily/weekly default briefings for many public/member asset/range combinations.

Triage classification: real coverage gap, but not a dashboard failure.

The dashboard can still use deterministic briefing fallback or compatible reviewed fallback rules. Direct reviewed coverage is a product-quality expansion, not an urgent runtime fix.

Recommended follow-up:

- Decide the target reviewed-briefing coverage policy:
  - Tier 1: reviewed only for core demo assets
  - Tier 2: reviewed daily defaults for all public assets
  - Tier 3: reviewed daily + weekly defaults for all member assets
- Avoid blindly generating all reviewed payloads until the editorial policy is clear.

Suggested branch:

`plan/reviewed-briefing-coverage-policy-v1`

## Recommended next actions

1. Patch audit-script embed-token detection.
2. Decide SPY manifest status.
3. Define reviewed coverage policy.
4. Then begin smart modularization with the display-range/window core extraction.

## Decision

Do not treat the 144 warnings as blockers.

Proceed with small follow-up branches:

1. `fix/full-suite-audit-embed-token-detection-v1`
2. `fix/asset-manifest-spy-coverage-status-v1`
3. `plan/reviewed-briefing-coverage-policy-v1`
4. `refactor/display-range-window-core-v1`
