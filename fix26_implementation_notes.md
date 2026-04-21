# Fix 26 — Config-Driven Asset Expansion

## What changed
- Introduced a shared mode manifest: `dashboard_fix26_mode_manifest.json`
- Split live website payloads into:
  - `fix26_chart_store_public.json`
  - `fix26_chart_store_member.json`
- Moved common dashboard presentation and render logic into:
  - `dashboard_fix26_base.css`
  - `dashboard_fix26_app.js`
- Kept public/member live HTML entrypoints, but made them wrappers over the shared app:
  - `interactive_dashboard_fix24_public_embed.html`
  - `interactive_dashboard_fix24_member_embed.html`
- Updated the externalized loader wrapper to use the same shared app.

## Public assets
BTC, ETH, SOL, NVDA, MSFT, COIN, AAPL, SPY, GLD

## Member assets
BTC, ETH, SOL, DOGE, AVAX, LINK, BNB, XRP, NVDA, MSFT, AAPL, AMZN, GOOGL, META, NFLX, TSLA, SPY, QQQ, GLD, XLE, TLT, DXY, COIN, AMD, PLTR, SHOP, SMCI, MSTR

## JSON outputs
- Public payload defaults to `fix26_chart_store_public.json`
- Member payload defaults to `fix26_chart_store_member.json`
- Both preserve the current lean field contract and daily/weekly buckets.

## Refresh flow
Use `refresh_fix26_dashboard_all.bat` for a one-click combined refresh. It:
1. reads the manifest asset union
2. runs the chart-history exporter for that union
3. builds both public and member payloads
4. stages the live site artifacts for git

## Notes
- Public/member behavior is now config-driven from the shared manifest.
- Combined Overlap still prefers advanced -> precomputed band -> derived fallback.
- Missing assets are tolerated in generated payloads and reported by the builder.
