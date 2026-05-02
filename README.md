# SETA Sentiment Dashboard

SETA is a behavioral market intelligence dashboard for explaining behavior beneath price. The dashboard is designed to organize price, sentiment, attention, narrative, indicator structure, and public-safe explanatory copy into a repeatable research and education workflow.

This repository is the working source for Dashboard v2. The current implementation baseline is the Fix 26 dashboard system, which uses manifest-driven public and member modes, generated chart JSON payloads, a SETA market screener store, and smoke-tested public website context cards.

## Core product rules

SETA should remain educational and analytical.

- SETA explains behavior beneath price.
- Sentiment is context, not a trading signal.
- Attention is not the same thing as validation.
- Crypto and equities require different interpretation rules.
- Public-facing copy must avoid buy/sell language, guarantees, predictions, and personalized financial advice.
- Human review remains part of the content workflow.

## Current dashboard baseline

The active dashboard surface is currently built around these files:

| File | Purpose |
| --- | --- |
| `interactive_dashboard_fix24_public_embed.html` | Public dashboard shell. Loads Plotly, the shared CSS, and `dashboard_fix26_app.js`. |
| `interactive_dashboard_fix24_member_embed.html` | Member dashboard shell with a broader asset/control surface. |
| `dashboard_fix26_app.js` | Main dashboard application logic, chart rendering, controls, mode behavior, Market Tape/screener integration, and dashboard presentation rules. |
| `dashboard_fix26_base.css` | Shared dashboard styling. |
| `dashboard_fix26_mode_manifest.json` | Public/member mode contract: assets, data URLs, defaults, visible controls, copy, badge order, and lower-pane behavior. |
| `fix26_chart_store_public.json` | Generated public chart payload. |
| `fix26_chart_store_member.json` | Generated member chart payload. |
| `fix26_screener_store.json` | Generated SETA screener payload for Market Tape / screener views. |
| `seta_public_context_cards.html` | Standalone public-safe context card page powered by `public_content/seta_website_snippets_latest.json`. |

Naming note: the embed shell filenames still contain `fix24`, while the current app, manifest, and payloads are Fix 26. Treat this as historical naming until a dedicated rename/alias phase handles it safely.

## Local preview

From the repo root:

```powershell
python -m http.server 8000
```

Then open:

```text
http://localhost:8000/interactive_dashboard_fix24_public_embed.html
http://localhost:8000/interactive_dashboard_fix24_member_embed.html
http://localhost:8000/seta_public_context_cards.html
```

Useful query parameters:

```text
?mode=public
?mode=member
?asset=BTC
?manifest=dashboard_fix26_mode_manifest.json
?data=fix26_chart_store_public.json
?screener=fix26_screener_store.json
```

## Refresh workflow

The current Windows refresh runner is:

```text
refresh_fix26_dashboard_all.bat
```

It is designed to:

1. Run the local enriched chart-history exporter.
2. Write chart-history, attention, and alert CSV outputs locally and to Tableau AutoSync.
3. Build the SETA market screener, indicator matrix, and archetype outputs.
4. Build `fix26_screener_store.json`.
5. Build public/member chart JSON payloads.
6. Run the dashboard smoke test.
7. Stage dashboard repo changes.
8. Optionally commit and push.

This workflow depends on local paths and environment variables, including `TWT_SNT_DB_URL`. Do not commit API keys, database credentials, `.env` files, or local-only secrets.

## Smoke tests

Run the main dashboard smoke test from the repo root:

```powershell
python scripts/smoke_fix26_dashboard.py
```

This checks that the generated payloads exist, the screener store has the expected structure, the dashboard app contains expected Market Tape hooks, and the embed pages reference the dashboard JS with a cache token.

The public context cards page also has its own smoke-test pattern. The page should continue to read:

```text
public_content/seta_website_snippets_latest.json
```

and preserve these public-safety flags:

```json
{
  "public_safe": true,
  "posting_performed": false
}
```

Run the live GitHub Pages health check after daily refresh pushes:

```powershell
python scripts/smoke_github_pages_live.py
```

See `docs/GITHUB_PAGES_LIVE_HEALTH_CHECK.md` for the production checks and warning policy, including the expected upstream-only `SPY` gap.

## Development workflow

Use one branch per focused change.

Recommended branch examples:

```text
docs/dashboard-v2-foundation
feature/dashboard-v2-equity-alert-restoration
feature/dashboard-v2-macd-pane-redesign
feature/dashboard-v2-tooltip-cleanup
fix/dashboard-v2-smoke-check
```

Rules for Dashboard v2 work:

- One patch, one purpose.
- Declare allowed files and protected files before implementation.
- Do not mix alert logic and pane redesign in the same patch.
- Do not change payload builder/schema unless the UI clearly needs new persisted data.
- Prefer dashboard-only presentation patches before upstream pipeline changes.
- Keep public/member mode behavior manifest-driven.
- Run smoke tests before merging.
- Compare against golden screenshots for public/member BTC and representative crypto/equity assets.

## Documentation

Start here:

- `docs/DASHBOARD_V2_ROADMAP.md`
- `docs/REPO_STRUCTURE.md`
- `docs/DASHBOARD_V2_COMPLETION_LEDGER.md`
- `docs/GITHUB_PAGES_LIVE_HEALTH_CHECK.md`

These docs define the Dashboard v2 operating plan, baseline, file ownership rules, patch discipline, and current repository structure.

- [Dashboard v2 RC Baseline - 2026-05-02](docs/DASHBOARD_V2_RC_BASELINE_2026-05-02.md)
