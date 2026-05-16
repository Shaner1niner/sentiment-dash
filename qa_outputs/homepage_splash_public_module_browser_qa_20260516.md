# Homepage Splash and Public Module Browser QA

## Purpose

Document the final browser QA checkpoint after the homepage splash polish, splash background layering fix, module asset loader cache-bust, and public chart coverage guard.

This report confirms that the SETA homepage now works as the polished public front door and that the public module dashboard no longer exposes assets it cannot chart.

## Branch

`qa/homepage-splash-public-module-browser-qa-v1`

## Related PRs

- `#153` -- Polish homepage splash design
- `#155` -- Fix homepage splash background layering
- `#161` -- Cache-bust module asset payload loader
- `#162` -- Guard public module chart coverage

## Summary

Confirmed live browser behavior:

- homepage splash background renders behind live HTML content
- homepage card routes remain intact
- public dashboard route loads the module runtime
- module asset loader no longer requests retired `/fix2/public/*.json` paths
- public asset dropdown is limited to chart-covered public assets
- Market Tape rows are limited to chart-covered public assets
- selected asset, detail panel, and chart title remain synchronized
- legacy public fallback remains available

## Homepage splash QA

Reviewed URL:

```text
https://shaner1niner.github.io/sentiment-dash/?cb=splash_final_155
```

| Check | Expected | Result |
|---|---|---:|
| Homepage renders | Polished splash homepage visible | PASS |
| Splash background | SETA ribbon background visible behind content | PASS |
| Hero copy | Live HTML text remains sharp/readable | PASS |
| Main cards | Four cards remain visible and clickable | PASS |
| Supporting panels | Info panels remain visible/readable | PASS |
| Live badge | GitHub Pages live pill visible | PASS |
| Accessibility posture | Text and links remain real HTML, not baked into image | PASS |

## Homepage route QA

| Card | Expected route | Result |
|---|---|---:|
| Public Market Dashboard | `interactive_dashboard_fix24_public_embed.html` | PASS |
| Market Context Cards | `seta_public_context_cards.html?dashboard=interactive_dashboard_fix24_public_embed.html` | PASS |
| Research Dashboard | `interactive_dashboard_fix24_member_embed.html` | PASS |
| Legacy Public Dashboard | `interactive_dashboard_fix24_public_legacy_embed.html` | PASS |

## Public module dashboard QA

Reviewed URL:

```text
https://shaner1niner.github.io/sentiment-dash/interactive_dashboard_fix24_public_embed.html?cb=public_chart_coverage_guard_162
```

| Check | Expected | Result |
|---|---|---:|
| Module runtime loads | Dashboard modules initialize | PASS |
| Asset loader | Uses current `fix26_chart_store_assets/public` payload path | PASS |
| Retired path guard | No `/fix2/public/*.json` chart payload requests | PASS |
| Public asset dropdown | Shows only public chart-covered tickers | PASS |
| Public Market Tape | Shows only chart-covered public tickers | PASS |
| Detail synchronization | Selected detail follows selected card/control | PASS |
| Chart synchronization | Chart title follows selected asset | PASS |
| Unsupported asset mismatch | No DOGE-detail / ETH-chart stale mismatch | PASS |

## Public chart-covered asset universe

Confirmed from DevTools:

```javascript
Array.from(document.getElementById('asset').options).map(o => o.value)
```

Observed result:

```text
AAPL
BTC
COIN
ETH
GLD
MSFT
NVDA
SOL
```

Expected count:

```text
8 public chart-covered tickers
```

Result:

```text
PASS
```

## Chart/detail synchronization check

Confirmed from DevTools after selecting `NVDA`:

```javascript
document.getElementById('chart')?.layout?.title?.text
```

Observed result:

```text
NVDA • Daily • 3M
```

Result:

```text
PASS
```

## Console QA

Allowed:

```text
/favicon.ico 404
```

Not allowed:

```text
/fix2/public/*.json 404
selected asset does not match chart title
stale previous-asset chart after selected asset changes
app-blocking module runtime errors
```

Observed after fixes:

```text
Only harmless favicon noise observed during final checks.
```

## Smoke validation

Validation commands used during the fix stack:

```powershell
python scripts\smoke_module_asset_payload_loading.py
python scripts\smoke_module_market_tape_parity.py
python scripts\smoke_module_runtime_harness.py
python scripts\smoke_fix26_dashboard.py
```

Expected warning retained:

```text
embed entry/cache tokens differ
```

This remains expected because the production public route uses the module runtime manifest token while legacy/member routes remain pinned to the legacy monolith token.

## Repository posture

Confirmed final local state after cleanup:

```text
On branch main
Your branch is up to date with 'origin/main'.

nothing to commit, working tree clean
```

## Non-goals

- no payload regeneration
- no route replacement beyond already-approved public/default module route promotion
- no monolith edits
- no legacy fallback deletion
- no member/research route replacement

## Final QA recommendation

PASS.

The homepage splash polish and public module runtime route are ready to remain live.

The public route now has a safer contract:

```text
Only assets with public chart payloads are selectable/visible in the public module runtime.
Selected asset, Market Tape detail, and chart title stay synchronized.
Legacy public fallback remains available.
```
