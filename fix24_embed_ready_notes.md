# Fix 24 — Embed-Ready Dashboard Shell

## Deliverables
- `interactive_dashboard_fix24_public_embed.html`
- `interactive_dashboard_fix24_member_embed.html`
- `interactive_dashboard_fix24_externalized_loader.html`
- `fix24_chart_store.json`

## What changed
- Externalized dashboard data into `fix24_chart_store.json`
- Added **Public mode** and **Member mode** from one codebase
- Public mode exposes a moderate control surface and a curated free asset subset
- Member mode preserves the richer analytical control surface
- Preserved the core analytical hierarchy:
  1. Combined Overlap as primary
  2. Engagement as secondary/contextual
  3. MACD / RSI / Stoch as timing layers
- Added a cleaner top summary card and mode-aware badge row
- Made the dashboard safer for website embedding by loading data via fetch and avoiding inline 40MB payloads

## Public mode defaults
- Assets: BTC, ETH, NVDA
- Controls shown: Asset, Frequency, Display Range, Price Display, Engagement, Bollinger, Oscillator Overlay
- Hidden controls: Scale Mode, Ribbon, Sentiment Ribbon, Regime Visuals
- Defaults:
  - Frequency: Daily
  - Display range: 3M
  - Price display: Candles
  - Bollinger: Combined Overlap
  - Engagement: Context
  - Oscillator overlay: Price + Sentiment

## Member mode defaults
- Assets: BTC, COIN, ETH, NFLX, NVDA
- Fuller control surface retained
- Same defaults as public mode, but richer controls remain visible

## Externalized loader
- `interactive_dashboard_fix24_externalized_loader.html` reads mode from the URL:
  - `?mode=public`
  - `?mode=member`
- It also supports:
  - `?data=fix24_chart_store.json`
  - `?asset=BTC`

Example:

```text
interactive_dashboard_fix24_externalized_loader.html?mode=public&asset=BTC&data=fix24_chart_store.json
```

## Squarespace / iframe path
The fastest replacement path is to host one of the HTML artifacts and embed it with an iframe.

Example iframe:

```html
<iframe
  src="https://YOUR-HOSTED-PATH/interactive_dashboard_fix24_public_embed.html"
  width="100%"
  height="1180"
  style="border:0; overflow:hidden;"
  loading="lazy"
></iframe>
```

## Recommended v1 usage
- Public site page: `interactive_dashboard_fix24_public_embed.html`
- Member page: `interactive_dashboard_fix24_member_embed.html`
- Use the externalized loader version if you want one hosted artifact with mode switching via URL parameters.

## Data contract note
This build depends on the externalized `STORE` generated from the current Fix 23 dataset, including:
- daily + weekly payloads
- combined overlap fields
- confirmed overlap event fields
- engagement / attention fields
- MACD / RSI / Stoch timing fields

## Remaining known limitations
- Public/member asset gating is a **mode-level scaffold**, not true auth-aware gating yet
- The store JSON is still large because it preserves the existing prototype payload breadth
- This is embed-ready, but not yet a fully site-native component
