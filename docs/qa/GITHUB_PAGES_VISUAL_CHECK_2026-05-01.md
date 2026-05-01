# GitHub Pages Visual Check - 2026-05-01

Branch: `qa/dashboard-v2-github-pages-visual-check`

GitHub Pages baseline checked: `8b64e19`

Related PRs prepared before this QA pass:

- PR #5: Dashboard v2 completion ledger
- PR #6: Dashboard v2 smoke hygiene

## URLs Checked

| Surface | URL | Result |
| --- | --- | --- |
| Public dashboard | `https://shaner1niner.github.io/sentiment-dash/interactive_dashboard_fix24_public_embed.html` | 200 OK |
| Member dashboard | `https://shaner1niner.github.io/sentiment-dash/interactive_dashboard_fix24_member_embed.html` | 200 OK |
| Market Context Cards | `https://shaner1niner.github.io/sentiment-dash/seta_public_context_cards.html` | 200 OK |
| Public snippets JSON | `https://shaner1niner.github.io/sentiment-dash/public_content/seta_website_snippets_latest.json` | 200 OK |

## Remote Payload Checks

Public snippet payload:

- `schema_version`: `seta_public_website_snippets_v1`
- `date`: `2026-04-30`
- `public_safe`: `true`
- `posting_performed`: `false`
- snippet count: `12`

Public chart payload:

- `generated_at_utc`: `2026-05-01T20:13:20Z`
- included assets: `AAPL`, `BTC`, `COIN`, `ETH`, `GLD`, `MSFT`, `NVDA`, `SOL`
- missing configured asset: `SPY`

`SPY` remains a known upstream data coverage issue. The dashboard should keep `SPY` eligible/configured so it starts working normally when upstream coverage returns.

## Screenshots

Desktop:

- [Public dashboard](github-pages-visual-check-2026-05-01/public-dashboard.png)
- [Member dashboard](github-pages-visual-check-2026-05-01/member-dashboard.png)
- [Market Context Cards](github-pages-visual-check-2026-05-01/market-context-cards.png)

Mobile:

- [Public dashboard mobile](github-pages-visual-check-2026-05-01/public-dashboard-mobile.png)
- [Member dashboard mobile](github-pages-visual-check-2026-05-01/member-dashboard-mobile.png)
- [Market Context Cards mobile](github-pages-visual-check-2026-05-01/market-context-cards-mobile.png)

## Findings

### P1 - Dashboard Mobile Chart Width Needs A Dedicated Pass

The public dashboard mobile screenshot loads and renders, but the chart area remains wider than the mobile viewport. Users can still see the chart, but the composition reads as a desktop chart squeezed into a mobile page rather than a fully mobile-optimized surface.

Recommendation:

- Treat mobile dashboard charting as a focused follow-up branch.
- Preserve desktop behavior while testing a mobile layout strategy for Plotly width, chart margins, side alert drawer placement, and pane labels.

### P2 - Performance Diagnostics Badge Is Visible On Public Pages

Both dashboard screenshots show the `Perf:` diagnostics badge over the chart area. This is useful for internal QA but may not belong on the public GitHub Pages experience.

Recommendation:

- Decide whether performance diagnostics should be gated behind an explicit query parameter such as `?diag=1`, member mode only, or local development only.
- If public visibility is intentional for now, keep it documented as a temporary QA artifact.

### P2 - Market Context Cards Look Launch-Usable

The Market Context Cards page loads on desktop and mobile, displays 12 public-safe snippets, shows public-safety status pills, and preserves the risk note. Mobile layout stacks cleanly and does not show obvious overlap.

Recommendation:

- This surface is ready for a link/iframe validation pass after the dashboard/context URL relationship is finalized.

### P3 - Public Dashboard Surface Is Usable On Desktop

The public dashboard desktop view renders the top controls, Market Tape, selected setup, chart, MACD, RSI, and Stoch RSI panes. No blank chart or broken payload state was observed.

Recommendation:

- Keep this as the current desktop golden baseline.
- Re-check after PR #6 is merged because smoke output wording changes, but runtime behavior should not change.

## Suggested Next Branch

```text
fix/dashboard-v2-mobile-chart-fit
```

Purpose:

- Improve mobile dashboard chart fit and reduce mobile overlap/clipping without changing alert policy, payload generation, or desktop chart behavior.

Suggested protected files:

- Generated JSON payloads.
- Payload builders.
- Alert policy logic.
- Public content payloads.

Suggested allowed files:

- `dashboard_fix26_app.js`
- `dashboard_fix26_base.css` only if necessary
- Optional smoke/QA doc updates

Acceptance:

- Public dashboard mobile screenshot no longer clips the primary chart labels or pane annotations.
- Alert Events drawer does not dominate the mobile chart viewport.
- Desktop screenshot remains materially unchanged.
- Market Context Cards remain unaffected.
