# Public Market Context Page

This document defines how to use `seta_public_context_cards.html` as a public website page next to the main SETA dashboard.

The recommended product pattern is:

```text
Dashboard page       = visual market structure / chart interaction
Market Context page = plain-English interpretation / education / SEO
```

The context-card page should be treated as part of the public product layer, not as a replacement for the dashboard.

## Why this page exists

The main dashboard shows price, sentiment, attention, overlap zones, timing panes, and screener/Market Tape structure. That is powerful, but it can be visually dense for a first-time visitor.

The Market Context page translates the daily SETA read into public-safe language:

- what SETA is seeing
- which assets have active context
- whether attention is broadening or contested
- what the next watch condition is
- why the read is context, not a trade signal

This page also gives the public site more indexable explanatory text than an interactive chart alone.

## Current repo artifacts

| Artifact | Role |
| --- | --- |
| `seta_public_context_cards.html` | Static HTML/JS card UI. Loads the public snippet JSON and renders search, filtering, sorting, featured cards, and full card grid. |
| `public_content/seta_website_snippets_latest.json` | Latest public-safe card payload. Contains asset-level headline, note, explanation, watch condition, SETA read line, risk note, and metadata. |
| `public_content/seta_website_snippets_latest.md` | Markdown companion when generated. Useful for review, copying, or future article/email workflows. |
| `scripts/smoke_seta_public_context_cards_v2.py` | Smoke test for public context card artifacts, when present. |

The JSON payload should preserve:

```json
{
  "public_safe": true,
  "posting_performed": false
}
```

## Recommended public site layout

Suggested navigation:

```text
Home
Dashboard
Market Context
How SETA Works
Newsletter
About
```

Recommended URLs:

```text
/dashboard
/market-context
/how-seta-works
/newsletter
/about
```

The dashboard page and Market Context page should link to each other.

Dashboard page CTA:

```text
New to SETA? Read today's Market Context Cards.
```

Market Context page CTA:

```text
Want the chart view? Open the SETA Dashboard.
```

## Best deployment pattern

Use a static host for the card artifact, then embed it in Squarespace with an iframe.

Recommended static hosts:

- GitHub Pages
- Netlify
- Cloudflare Pages
- existing web host/static bucket

The static host should serve both:

```text
/seta_public_context_cards.html
/public_content/seta_website_snippets_latest.json
```

The HTML uses a relative data path by default:

```text
public_content/seta_website_snippets_latest.json
```

So the JSON file must remain available at that relative path unless the page is modified to set `window.SETA_PUBLIC_SNIPPETS_URL` before the app script runs.

## Squarespace iframe embed

Once the static page is hosted, add a Squarespace Code Block with:

```html
<iframe
  src="https://YOUR-STATIC-HOST/seta_public_context_cards.html"
  style="width:100%; height:1400px; border:0; border-radius:18px; overflow:hidden;"
  loading="lazy"
  title="SETA Market Context Cards">
</iframe>
```

Adjust height after testing:

```text
desktop: 1200-1600px
mobile: 1600-2200px
```

If Squarespace adds extra padding around the iframe, use a full-width section and reduce section padding.

## GitHub Pages option

Because this repo is public, GitHub Pages can be a simple first host.

Suggested GitHub Pages settings:

```text
Source: Deploy from a branch
Branch: main
Folder: /root
```

Expected URLs after Pages is enabled:

```text
https://shaner1niner.github.io/sentiment-dash/seta_public_context_cards.html
https://shaner1niner.github.io/sentiment-dash/public_content/seta_website_snippets_latest.json
```

Squarespace iframe source would become:

```html
<iframe
  src="https://shaner1niner.github.io/sentiment-dash/seta_public_context_cards.html"
  style="width:100%; height:1400px; border:0; border-radius:18px; overflow:hidden;"
  loading="lazy"
  title="SETA Market Context Cards">
</iframe>
```

Note: if GitHub Pages is not enabled yet, enable it in GitHub repository settings before using these URLs.

## Recommended Squarespace page copy

Page title:

```text
SETA Market Context
```

Subtitle:

```text
Plain-English explanations of attention, participation, narrative, and structure beneath price.
```

Intro copy:

```text
These cards translate the latest public-safe SETA read into plain language. They explain market context, participation, narrative, and watch conditions by asset. They are educational context only, not predictions, recommendations, or trade signals.
```

Footer/risk copy:

```text
SETA explains behavior beneath price. This page is interpretation context only and should not be treated as financial advice, a forecast, or a buy/sell signal.
```

## How this supports the product

The Market Context page can be reused as:

- public dashboard companion page
- SEO landing page
- newsletter source material
- asset-context teaser layer
- glossary/article seed content
- member conversion layer

Suggested user flow:

```text
Public card: BTC participation is broadening.
Dashboard: show the actual overlap, attention, sentiment, and timing structure.
Member layer: deeper watch conditions, more assets, more history, richer context.
```

## Refresh workflow

The page should consume the latest generated public snippet payload:

```text
public_content/seta_website_snippets_latest.json
```

After refreshing public snippets:

1. Run or inspect the public context card smoke test.
2. Confirm `public_safe=true`.
3. Confirm `posting_performed=false`.
4. Preview the page locally.
5. Push the latest public-safe artifact.
6. Confirm the hosted page updates.
7. Confirm Squarespace iframe renders the current content.

Local preview:

```powershell
cd C:\Users\shane\sentiment-dash
python -m http.server 8765
```

Open:

```text
http://localhost:8765/seta_public_context_cards.html
```

## Acceptance checklist

Before promoting the page in navigation:

- page loads on desktop
- page loads on mobile
- card search works
- universe filter works
- sort works
- reset works
- featured cards render
- all context cards render
- public-safe/status pills render
- no card says buy/sell
- no card makes a price prediction
- no card gives personalized advice
- risk note is visible
- dashboard page links to Market Context
- Market Context page links back to dashboard

## Future upgrades

Potential later improvements:

- add direct card links by ticker
- add `?asset=BTC` support
- add `?universe=crypto` support
- split cards into Crypto / Equities sections
- add a compact embed mode for dashboard sidebar use
- add JSON-LD structured data for SEO
- generate asset-specific static pages from the same payload
- add a weekly archive page powered by timestamped public snippets

## Do not do yet

Avoid these until the public page is stable:

- do not auto-post snippets to social platforms
- do not turn cards into trading alerts
- do not expose private/member-only rows
- do not add raw internal scores as headline public metrics
- do not rename current artifact files without a compatibility plan
