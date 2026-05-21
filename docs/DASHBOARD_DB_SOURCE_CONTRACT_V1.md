# Dashboard DB Source Contract v1

Status: initial contract / no runtime behavior change

Branch intent: make the dashboard data source explicit before any wider asset-universe or payload changes.

## Purpose

The dashboard should treat `final_combined_data_enriched_tbl` as the canonical enriched data source for chart-history payload generation, with `final_combined_data_enriched_dictionary_tbl` as the human-readable schema companion.

The browser dashboard should not connect to Postgres directly. The safe boundary remains:

```text
Postgres final enriched table
  -> local/export builder using TWT_SNT_DB_URL
  -> generated static JSON payloads
  -> GitHub Pages / static dashboard
```

This preserves the current static-site architecture, keeps database credentials out of public assets, and lets the payload contract stay stable while the upstream pipeline grows.

## Source-of-truth tables

| Table | Role |
| --- | --- |
| `final_combined_data_enriched_tbl` | Canonical row-level enriched dashboard source. Expected to contain `date`, `term`, OHLCV, sentiment, technical indicator, attention, ribbon, and SETA score fields. |
| `final_combined_data_enriched_dictionary_tbl` | Column dictionary / schema companion for explaining and validating the enriched table fields. |

The current payload builder can keep writing the same JSON shape. The DB-backed work should only replace or preflight the upstream input source. The dashboard UI should not need to know whether the builder read from CSV or Postgres.

## Current generated payload boundary

Existing dashboard payloads are still generated files:

```text
fix26_chart_store_public.json
fix26_chart_store_member.json
fix26_chart_store_public_index.json
fix26_chart_store_member_index.json
fix26_screener_store.json
```

Those files should continue to be regenerated, not hand-edited.

## Asset universe rules

The pipeline asset universe and the dashboard mode asset lists are related but not identical.

| Layer | Meaning |
| --- | --- |
| Pipeline universe | Every asset with rows in `final_combined_data_enriched_tbl`. |
| Eligible asset universe | Pipeline assets that pass minimum data quality gates. |
| Public mode assets | Curated public/demo assets exposed by `dashboard_fix26_mode_manifest.json`. |
| Member mode assets | Broader research/member assets exposed by `dashboard_fix26_mode_manifest.json`. |
| Screener universe | Assets with enough alert/screener coverage to appear in Market Tape / screener views. |

A move from 28 assets to 40 assets should be reflected by validation and coverage reporting first. It should not silently expose every upstream asset to public/member mode without quality and product gates.

## Recommended quality gates

An asset should be considered dashboard-eligible only when it passes the required gates for its use case:

- Has at least one latest row in `final_combined_data_enriched_tbl`.
- Has enough history rows for the intended chart range.
- Has required chart columns: `date`, `term`, OHLCV, close moving averages, sentiment moving averages, RSI, MACD, Bollinger/overlap, attention, and ribbon fields where available.
- Has fresh enough data for its asset calendar.
- Has screener coverage when used in Market Tape / active setup surfaces.
- Is intentionally enabled for the relevant mode.

Temporary gaps should be reported explicitly as `missing`, `stale`, `chart_only`, or `pending_screener`, rather than hidden.

## Implementation sequence

### Phase 1 - Contract and report only

Add a DB preflight/report script that:

1. Reads `TWT_SNT_DB_URL` from the local environment.
2. Introspects `final_combined_data_enriched_tbl` through `information_schema.columns`.
3. Introspects `final_combined_data_enriched_dictionary_tbl` when present.
4. Reads the current public/member asset lists from `dashboard_fix26_mode_manifest.json`.
5. Reports source column count, dictionary coverage, required dashboard column coverage, pipeline asset count, configured assets, missing configured assets, unconfigured available assets, stale assets, and eligible assets by mode.

No generated dashboard payloads should change in this phase.

### Phase 2 - DB-to-CSV bridge

Use the DB source to produce the same local chart-history CSV currently expected by `build_fix26_chart_store_payloads.py`.

```text
Postgres -> final_combined_data_enriched_chart_history.csv -> existing payload builder
```

The existing payload builder remains the stable JSON contract.

### Phase 3 - Optional direct DB payload builder

Only after Phase 2 is stable, allow `build_fix26_chart_store_payloads.py` or a wrapper to use a direct DB source mode.

Do not change the public JSON shape unless the UI needs a new persisted field.

## Protected boundaries

Do not commit:

- DB URLs
- `.env` files
- credentials
- raw local dumps containing sensitive/private data
- one-off local patch scripts

Do not do in this contract phase:

- Connect browser JavaScript directly to Postgres.
- Rewrite the dashboard as a server app.
- Hand-edit generated JSON payloads.
- Automatically expose every upstream asset publicly.
- Mix UI tooltip work with DB-source work.

## Acceptance criteria for this contract phase

- A DB source report can be run locally without changing payload files.
- The report clearly distinguishes pipeline assets from public/member configured assets.
- Missing/stale assets are visible and actionable.
- Dictionary coverage for enriched columns is visible.
- The current static dashboard payload format remains unchanged.
