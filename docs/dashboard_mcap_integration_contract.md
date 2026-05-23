# Dashboard Market-Cap Integration Contract

_Last updated: 2026-05-23_

This document defines the first dashboard-side contract for consuming market-cap-weighted SETA outputs from `SETA_engine`.

It is intentionally read-only documentation. It does not change dashboard UI behavior, payload builders, chart rendering, or public/member access rules.

## Background

`SETA_engine` now produces validated market-cap-weighted analytics bundles alongside equal-weight outputs.

Engine-side validation has confirmed:

- market-cap coverage is restored for all coverable terms,
- DXY and future FX/currency-pair-style instruments are excluded from fake market-cap requirements,
- ETF/fund/commodity proxy instruments are covered through reviewed AUM proxy rows,
- market-cap provenance persists into `final_combined_data_enriched_tbl`,
- equal and mcap sector/ecosystem bundles are produced for `all`, `crypto`, and `stocks`,
- the pipeline and export/sync path complete successfully.

This repo, `sentiment-dash`, is the working dashboard source. `Sentiment-Analytics-Dashboard` is the polished public portfolio/showcase repo.

## Current dashboard architecture

The active dashboard baseline is Fix 26.

The current website data path is built around:

- `dashboard_fix26_mode_manifest.json`
- `dashboard_fix26_app.js`
- `fix26_chart_store_public.json`
- `fix26_chart_store_member.json`
- `fix26_chart_store_public_index.json`
- `fix26_chart_store_member_index.json`
- `fix26_screener_store.json`
- `refresh_fix26_dashboard_all.bat`
- smoke tests under `scripts/`

The refresh runner already supports a DB chart-history overlay from `final_combined_data_enriched_tbl`, then builds public/member chart JSON payloads.

## New mcap data now available upstream

`SETA_engine` can produce equal and market-cap-weighted bundle families such as:

```text
sector_daily_analytics_all_equal.csv
sector_daily_analytics_all_mcap.csv
sector_level_SETA_all_equal.csv
sector_level_SETA_all_mcap.csv
ecosystem_level_SETA_all_equal.csv
ecosystem_level_SETA_all_mcap.csv
eco_weight_history_all_equal.csv
eco_weight_history_all_mcap.csv
asset_level_SETA_all_equal.csv
asset_level_SETA_all_mcap.csv
multi_level_SETA_output_all_equal.csv
multi_level_SETA_output_all_mcap.csv
```

Equivalent files are available for:

```text
crypto_equal
crypto_mcap
stocks_equal
stocks_mcap
```

## Product rule

Equal-weight views must remain the stable baseline.

Market-cap weighting should be introduced as an explicit alternate analytical lens, not as a silent replacement for equal weighting.

Recommended language:

```text
Equal Weight: treats each covered asset equally.
Market-Cap Weight: weights covered assets by market cap or reviewed AUM proxy where appropriate.
```

Avoid implying that market-cap weighting is more predictive or more correct. It is a different participation structure lens.

## Recommended first integration shape

Use a separate SETA bundle package first.

Do not initially modify the existing Fix 26 chart-history payload contract unless the UI clearly needs mcap values inside asset charts.

Recommended package shape:

```text
seta_bundles/
  latest/
    manifest.json
    ecosystem_level_SETA_all_equal.csv
    ecosystem_level_SETA_all_mcap.csv
    sector_level_SETA_all_equal.csv
    sector_level_SETA_all_mcap.csv
    asset_level_SETA_all_equal.csv
    asset_level_SETA_all_mcap.csv
    multi_level_SETA_output_all_equal.csv
    multi_level_SETA_output_all_mcap.csv
    ...
```

This keeps the new mcap analytics bundle distinct from the existing asset chart-store path.

## Proposed manifest contract

A dashboard-facing bundle manifest should be small, explicit, and static-hosting friendly.

Example:

```json
{
  "schema_version": "seta_dashboard_bundle_v1",
  "generated_at": "2026-05-23T00:43:19",
  "latest_date": "2026-05-23",
  "universes": ["all", "crypto", "stocks"],
  "weightings": ["equal", "mcap"],
  "files": {
    "all": {
      "equal": {
        "ecosystem": "ecosystem_level_SETA_all_equal.csv",
        "sector": "sector_level_SETA_all_equal.csv",
        "asset": "asset_level_SETA_all_equal.csv",
        "multi_level": "multi_level_SETA_output_all_equal.csv"
      },
      "mcap": {
        "ecosystem": "ecosystem_level_SETA_all_mcap.csv",
        "sector": "sector_level_SETA_all_mcap.csv",
        "asset": "asset_level_SETA_all_mcap.csv",
        "multi_level": "multi_level_SETA_output_all_mcap.csv"
      }
    }
  }
}
```

The dashboard should load from the manifest rather than hardcoding every file name in UI code.

## Recommended first dashboard use

First dashboard use should be read-only comparison context, not a full redesign.

Recommended first surfaces:

1. Member-mode SETA overview card: Equal vs Market-Cap selected state.
2. Sector leaderboard comparison: same universe, selected weighting.
3. Ecosystem score context: selected universe and weighting clearly labeled.

Public mode can stay equal-weight first until the mcap interpretation copy is mature.

## Universe and weighting controls

Longer term, the dashboard should support:

```text
Universe: all / crypto / stocks
Weighting: equal / market-cap
```

Initial rollout recommendation:

- member mode first,
- equal selected by default,
- mcap visible as an analytical alternate,
- public mode unchanged unless explicitly promoted later.

## Safety and interpretation rules

Mcap output is educational context, not a trade signal.

Dashboard copy should preserve these rules:

- no buy/sell language,
- no price predictions,
- no personalized financial advice,
- no claim that mcap is superior to equal weighting,
- clearly label ETF/fund AUM proxies where relevant,
- clearly label macro/FX exclusions such as DXY as no-market-cap-policy cases.

## Public/private boundary

The dashboard may consume public-safe aggregate files.

It should not expose:

- raw private database connection details,
- source credentials,
- ingestion internals,
- proprietary scoring internals beyond public-safe output fields,
- private provider diagnostics.

The first integration should consume static files generated by `SETA_engine`, not connect the hosted dashboard directly to the production database.

## Smoke-test expectations

Future implementation should add smoke checks that verify:

- bundle manifest exists and is valid JSON,
- expected universes are present: `all`, `crypto`, `stocks`,
- expected weightings are present: `equal`, `mcap`,
- each manifest-listed file exists,
- mcap files are not silently replaced by equal files,
- public/member existing chart payloads still load,
- current Fix 26 smoke test still passes.

Suggested future smoke script:

```text
scripts/smoke_seta_bundle_manifest.py
```

## What not to change in the first implementation

Do not change these until the bundle contract is validated:

- chart-store asset payload schema,
- Plotly asset chart rendering,
- existing public/member asset lists,
- existing default public dashboard behavior,
- briefing payload contract,
- screener store contract.

## Recommended next PRs

1. Add a SETA bundle manifest smoke test.
2. Add a local/static sample `seta_bundles/latest/manifest.json` and tiny fixture files, or document the expected generated location if files are too large.
3. Update the refresh runner to optionally stage the SETA bundle package.
4. Add a member-mode experimental UI card for selected universe/weighting.
5. Promote public-mode exposure later after copy and interpretation are reviewed.

## Related tracking

- Dashboard mcap integration audit: issue #365
- Upstream engine: `SETA_engine`
- Public showcase repo: `Sentiment-Analytics-Dashboard`
