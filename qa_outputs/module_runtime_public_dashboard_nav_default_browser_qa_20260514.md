# Module Runtime Public Dashboard Nav Default Browser QA

## Purpose

Document browser QA after making the homepage Public Market Dashboard card open the module runtime candidate page by default.

This confirms the new public dashboard default is working while the previous public dashboard remains available as a legacy fallback.

## Branch

`qa/module-runtime-public-dashboard-nav-default-browser-qa-v1`

## Related PRs

- `#136` -- Make module runtime the public dashboard default
- `#135` -- Document module runtime navigation link browser QA
- `#134` -- Add module runtime candidate navigation link
- `#133` -- Document module runtime production embed candidate browser QA
- `#132` -- Add module runtime production embed candidate
- `#131` -- Add module runtime rollback runbook
- `#130` -- Document module runtime production cutover rehearsal

## Test URL

```text
https://shaner1niner.github.io/sentiment-dash/?cb=module_public_default_001
```

## Scope

This QA verifies homepage navigation behavior after the module runtime became the default public dashboard entry.

It does not replace or modify the underlying legacy public dashboard file, member/research dashboard file, context-card page, payloads, or monolith runtime.

## Manual browser QA summary

| Check | Result | Notes |
|---|---:|---|
| Homepage loads | PASS | Root page rendered with fresh cache-buster |
| Four homepage cards render | PASS | Console probe returned four card objects |
| Public Market Dashboard link points to module runtime candidate | PASS | Public dashboard default now opens module runtime candidate page |
| Market Context Cards link remains valid | PASS | Context-card route opened successfully |
| Research Dashboard link remains valid | PASS | Member/research dashboard route opened successfully |
| Legacy Public Dashboard fallback remains available | PASS | Previous public dashboard route remains linked and openable |
| Public dashboard default route renders module surface | PASS | Briefing, Market Tape, selected detail, detail deck, event timeline, and chart render |
| Existing public fallback route preserved | PASS | Legacy public dashboard remains available as fallback |
| Existing member/research route preserved | PASS | Research Dashboard unchanged |
| No payload regeneration | PASS | Browser QA only |
| No monolith edit | PASS | Homepage navigation default only |
| No app-blocking runtime errors observed | PASS | No blocking failure observed during link checks |

## Homepage console probe

Probe used:

```javascript
[...document.querySelectorAll('.card')].map(a => ({
  title: a.querySelector('h2')?.innerText,
  href: a.getAttribute('href')
}))
```

Observed result:

```text
4 card objects returned
```

Expected card mapping:

```text
Public Market Dashboard -> interactive_dashboard_fix26_module_candidate.html
Market Context Cards -> seta_public_context_cards.html?dashboard=interactive_dashboard_fix24_public_embed.html
Research Dashboard -> interactive_dashboard_fix24_member_embed.html
Legacy Public Dashboard -> interactive_dashboard_fix24_public_embed.html
```

## Link checks

### Public Market Dashboard

Result: PASS

The homepage Public Market Dashboard card opens the module runtime candidate page.

The module runtime candidate page renders:

```text
briefing
Market Tape
selected detail
detail deck
event timeline
chart
```

### Market Context Cards

Result: PASS

The Market Context Cards route remains available and opened successfully from the homepage.

### Research Dashboard

Result: PASS

The member/research dashboard route remains available and opened successfully from the homepage.

### Legacy Public Dashboard

Result: PASS

The previous public dashboard route remains available as a fallback card and opened successfully from the homepage.

## Production-readiness interpretation

The module runtime is now the homepage default for public dashboard entry, but this is still a navigation-level default.

The underlying legacy public dashboard file remains available and recoverable.

This is a successful cautious promotion because it exposes the module runtime as the primary public entry without deleting or replacing the older public dashboard route.

## Remaining approval gates before deeper replacement

Before replacing or retiring old public/member dashboard routes, complete:

- public default observation period
- explicit user approval for file-level public/member route replacement
- final smoke checks
- post-promotion browser QA
- rollback readiness confirmation
- decision on whether to keep or retire legacy fallback link

## Recommended next branches

If continuing cautiously:

```text
qa/module-runtime-public-default-observation-v1
```

If ready to plan deeper production route replacement:

```text
promote/module-runtime-public-route-cutover-v1
```

If ready to preserve the current state and stop:

```text
docs/module-runtime-public-default-release-note-v1
```

## Non-goals

- no replacement of `interactive_dashboard_fix24_public_embed.html`
- no replacement of `interactive_dashboard_fix24_member_embed.html`
- no generated payload changes
- no monolith edits
- no data pipeline changes

## Final recommendation

Merge this QA report.

Keep the module runtime as the homepage public dashboard default and preserve the legacy public dashboard fallback while observing stability.
