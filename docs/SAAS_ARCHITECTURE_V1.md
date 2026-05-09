# SETA SaaS Architecture v1

This document describes the likely SaaS migration path for SETA. It is a planning artifact, not an immediate rewrite mandate.

The current GitHub Pages dashboard should remain the working product while the SaaS architecture is introduced in small, reversible phases.

## Product architecture goal

SETA should become a behavioral market intelligence layer for explaining behavior beneath price.

The SaaS product should preserve the current dashboard strengths:

- explainable chart context
- Market Tape ranking
- public/member mode separation
- educational and non-advisory language
- source breadth as a trust layer
- repeatable refresh and smoke-test discipline

The SaaS product should add capabilities that GitHub Pages cannot provide cleanly:

- authenticated users
- saved views
- briefing history
- account-level settings
- billing and entitlements
- server-side AI briefing generation
- durable data storage
- alert and notification workflows
- stronger observability

## Current implementation baseline

The current production surface is static-first:

- GitHub Pages hosts public and member dashboard shells.
- `dashboard_fix26_app.js` handles controls, rendering, Market Tape integration, and Briefing Mode.
- `dashboard_fix26_mode_manifest.json` controls public/member defaults and visible controls.
- generated JSON files provide chart, screener, and public-content payloads.
- daily refresh runners rebuild and push the website.
- smoke tests validate local payloads and live GitHub Pages behavior.

This baseline is useful and should not be discarded. It is the public proof-of-product layer.

## Target SaaS stack

Recommended target stack:

| Layer | Recommended direction |
| --- | --- |
| Frontend | Next.js or React app with dashboard components migrated from the current shell |
| API | FastAPI or similar Python service |
| Database | Postgres with TimescaleDB if time-series storage becomes central |
| Auth | Clerk, Supabase Auth, or another managed auth provider |
| Billing | Stripe |
| Jobs | GitHub Actions first, then Prefect or another job orchestrator when refresh complexity grows |
| Hosting | Vercel for frontend; Render, Fly, Railway, or similar for API/jobs |
| Charts | Plotly initially, with migration only if interaction requirements justify it |
| AI | server-side OpenAI calls using structured briefing inputs and explicit guardrails |
| Observability | Sentry plus uptime/live health checks |

The first SaaS version should not rebuild every part of SETA. It should wrap the proven dashboard and move only the capabilities that require users, persistence, billing, or server-side AI.

## Trust and breadth layer

Authorship/source breadth should remain part of the SaaS data model.

Breadth is not proof that a move is organic. It is a confidence and trust check that helps separate wider participation from narrow amplification by a small number of loud accounts or repeated sources.

Recommended persisted concepts:

- author/source count
- unique source count by channel
- concentration score or top-source share
- breadth confidence label
- API/sample limitation note
- channel-specific caveat for X, news, Reddit, and other sources

For X, breadth should be confidence-weighted because API limits can make the sample incomplete. For news, breadth should account for syndication, repeated outlet coverage, and headline clustering. In both cases, the briefing should present breadth as a qualifier, not as a verdict.

## Data flow

Initial SaaS data flow:

1. existing local/export jobs generate enriched market, sentiment, attention, and screener outputs
2. refresh workflow writes static JSON for GitHub Pages
3. selected outputs are also loaded into a durable store
4. API reads normalized asset/timeframe payloads
5. frontend requests dashboard and briefing payloads by asset, timeframe, mode, and entitlement
6. AI briefing generator receives a constrained structured input
7. generated briefings are stored with model/version metadata and public-safety flags

The static website can remain the fallback and public demo even after the SaaS layer exists.

## Suggested phases

### Phase 0 - Preserve the public product

Keep GitHub Pages healthy. Continue daily refreshes, smoke tests, and public/member dashboard validation.

Acceptance:

- public dashboard works
- member dashboard works
- Briefing Mode remains readable
- SPY upstream gaps stay treated as upstream issues
- daily refreshes continue

### Phase 1 - Productized Briefing Mode

Make Briefing Mode the preferred explanatory surface inside the existing dashboard.

Acceptance:

- briefing language is concise and non-advisory
- breadth/trust language is visible but not overbearing
- public/member behavior remains manifest-driven
- no server dependency is required

### Phase 2 - AI briefing service

Move generated narrative behind a server-side process.

Acceptance:

- AI input schema is versioned
- output schema is versioned
- source breadth appears in the trust layer
- public-safety guardrails are enforced
- generated content can be reviewed or suppressed

Near-term bridge:

- start with a local offline briefing harness
- publish only reviewed static outputs if needed
- keep deterministic Briefing Mode as the dashboard fallback
- move live generation server-side only when auth, persistence, and review controls exist

### Phase 3 - Auth and entitlements

Add user accounts and separate public/member/pro capabilities.

Acceptance:

- public users can still view a useful dashboard
- member users get broader assets and richer briefings
- entitlement rules are server-side
- no secrets are committed to the repo

### Phase 4 - Billing

Add Stripe only after the member value proposition is clear.

Acceptance:

- plan tiers map to real product differences
- cancellation and account management are simple
- no investment-advice claims are used in pricing copy

### Phase 5 - Durable product platform

Move recurring jobs, saved views, alert preferences, and briefing history into the SaaS stack.

Acceptance:

- GitHub Pages remains a public/demo fallback
- data lineage is inspectable
- failures are observable
- AI outputs are reproducible by schema/model version

## Near-term architecture rule

Do not migrate architecture for its own sake. The next change should be the smallest move that unlocks a real user-facing capability.
