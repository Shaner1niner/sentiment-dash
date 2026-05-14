# Module Runtime Production Navigation Link Browser QA

## Purpose

Document browser QA after adding the controlled homepage link to the module runtime candidate page.

This QA verifies that the homepage exposes the new candidate link while preserving existing public/member dashboard routes.

## Branch

`qa/module-runtime-production-navigation-link-browser-qa-v1`

## Related PRs

- `#134` -- Add module runtime candidate navigation link
- `#133` -- Document module runtime production embed candidate browser QA
- `#132` -- Add module runtime production embed candidate
- `#131` -- Add module runtime rollback runbook
- `#130` -- Document module runtime production cutover rehearsal

## Test URL

```text
https://shaner1niner.github.io/sentiment-dash/?cb=module_nav_link_001
```

## Scope

This QA verifies the homepage navigation link only.

It does not replace current production dashboard routes.

## Manual browser QA summary

| Check | Result | Notes |
|---|---:|---|
| Homepage loads | PASS | Root page rendered with cache-buster |
| Four-card navigation renders | PASS | Public Dashboard, Market Context Cards, Research Dashboard, and Module Runtime Candidate are visible |
| Public dashboard link preserved | PASS | Existing Public Market Dashboard card remains visible |
| Market Context Cards link preserved | PASS | Existing Market Context Cards card remains visible |
| Research Dashboard link preserved | PASS | Existing Research Dashboard card remains visible |
| Module Runtime Candidate link added | PASS | New beta candidate card appears in the first-row navigation grid |
| Desktop layout remains clean | PASS | Four cards fit cleanly on desktop |
| Public dashboard opens | PASS | Public dashboard surface loaded and rendered charts/briefing/Market Tape |
| Market Context Cards opens | PASS | Context-card surface loaded and rendered card grid |
| Research Dashboard opens | PASS | Member/research dashboard surface loaded and rendered charts/briefing/Market Tape |
| Module Runtime Candidate opens | PASS | Candidate page loaded and rendered module runtime sections |
| Existing routes remain available | PASS | No existing top-level dashboard card was removed |
| Candidate route remains isolated | PASS | Candidate page remains a parallel route, not a route replacement |
| No payload regeneration | PASS | Browser QA only |
| No monolith edit | PASS | Navigation link only |
| No app-blocking runtime errors observed | PASS | No blocking browser failure observed in tested surfaces |

## Homepage navigation observed

The homepage now presents four primary cards:

```text
Public Market Dashboard
Market Context Cards
Research Dashboard
Module Runtime Candidate
```

The new Module Runtime Candidate card is labeled as a beta candidate and links to:

```text
interactive_dashboard_fix26_module_candidate.html
```

## Console probe

Homepage console probe used:

```javascript
[...document.querySelectorAll('.card')].map(a => ({
  title: a.querySelector('h2')?.innerText,
  href: a.getAttribute('href')
}))
```

The browser returned four card objects, matching the four visible homepage cards.

## Route checks

### Public Market Dashboard

The public dashboard route loaded successfully. The public surface continued to render the existing dashboard/monolith-style production view with briefing, controls, Market Tape, chart stack, and event timeline.

### Market Context Cards

The market context cards route loaded successfully. The page rendered context-card content with featured cards, filters, and the broader card grid.

### Research Dashboard

The research/member dashboard route loaded successfully. The page rendered the richer research dashboard with briefing, controls, Market Tape, chart stack, and timeline.

### Module Runtime Candidate

The module candidate route loaded successfully. The candidate page rendered the module briefing, Market Tape, selected detail, detail deck, event timeline, and chart.

## Production-readiness interpretation

This is a successful navigation-link QA pass.

The homepage now exposes the module runtime candidate in a controlled way while preserving all existing production routes.

This still does not approve replacement of the current public/member dashboard routes.

## Remaining approval gates before route replacement

Before replacing public/member dashboard routes, complete:

- explicit user approval for route replacement
- final candidate spot check with fresh cache-buster
- public/member replacement branch with minimal file list
- post-merge production browser QA
- rollback readiness confirmation

## Recommended next branch after this QA merges

If continuing cautiously:

```text
qa/module-runtime-candidate-public-feedback-watch-v1
```

If ready for route replacement planning:

```text
promote/module-runtime-public-member-cutover-v1
```

Recommended first route replacement should still be narrow and reversible.

## Non-goals

- no replacement of `interactive_dashboard_fix24_public_embed.html`
- no replacement of `interactive_dashboard_fix24_member_embed.html`
- no generated payload changes
- no monolith edits
- no data pipeline changes

## Final recommendation

Merge this QA report.

Keep the candidate link live as a controlled beta/candidate surface. Do not replace the existing public/member dashboard routes without a separate explicit approval gate.
