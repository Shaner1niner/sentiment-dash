# Public Site Data Flow

This public dashboard is generated from a private SETA analytics pipeline and published through a safety-gated artifact bridge.

## High-level flow

```text
Private analytics pipeline
  ->
Reviewed and generated public-safe artifacts
  ->
Safety and smoke checks
  ->
Public dashboard payloads
  ->
GitHub Pages
```

## What this public repo contains

This repository contains public-facing dashboard assets and sanitized data artifacts, including:

- Public dashboard payloads.
- Public chart-store outputs.
- Reviewed/public-safe briefing content.
- Public context-card snippets.
- Public refresh status metadata.

## What this public repo does not contain

This repository intentionally excludes private/proprietary pipeline internals, credentials, raw private exports, and non-public working artifacts.

The public layer is designed to demonstrate the SETA dashboard and narrative intelligence output without exposing private implementation details.

## Public refresh status

The public refresh status file is located at:

```text
public_content/site_refresh_status.json
```

Important fields include:

```json
{
  "artifacts": {
    "website_snippets": {
      "date": "YYYY-MM-DD",
      "published_at_utc": "...",
      "public_safe": true,
      "posting_performed": false
    }
  }
}
```

`published_at_utc` indicates when the public payload was generated.

`website_snippets.date` indicates the market/context packet date represented by the public content.

`public_safe` confirms that the public artifact passed public-content safety checks.

`posting_performed` should remain false for website content generation.

## Safety model

Public artifacts are published only after allowlist checks and public-content smoke tests. The bridge is intended to publish only files suitable for the public site.

## Prediction Accountability freshness

The public dashboard includes a Prediction Accountability overlay for resolved historical outcomes. This module is a public-safe accountability view, not a trade signal, price forecast, or recommendation.

The overlay is refreshed as part of the public publishing flow. Public metadata may include generated time, row count, resolved count, pending count, and selective accuracy.

Rows without auditable public resolution basis are withheld from final Correct/Miss display until sufficient public resolution basis is available. These rows may be treated as `pending_resolution_basis` in the public display layer.

This keeps public accountability tied to auditable outcome evidence rather than unsupported correctness labels.

<!-- BEGIN SETA_PARTIAL_CRYPTO_CANDLES -->

## Partial current-day crypto candles

Some crypto Daily charts may show a partial current-day candle before the confirmed daily candle is available.

This candle is built from intraday crypto OHLCV data and is labeled as partial. It is intended for visual freshness only.

Important interpretation notes:

- The partial candle is not a finalized end-of-day candle.
- Volume on the partial candle is intraday volume so far.
- Confirmed daily candles remain the canonical source for indicators, historical chart context, and accountability views.
- Weekly charts do not roll the partial daily candle into weekly candle calculations.

<!-- END SETA_PARTIAL_CRYPTO_CANDLES -->
