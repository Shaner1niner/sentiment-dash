# SETA Dislocation Dashboard Export Consumer Note

Status: integration scaffold  
Upstream repo: `SETA_Prediction_Intelligence_Engine`  
Upstream branch/lane: `codex/dislocation-strategy-report`  
Upstream export: `artifacts/dislocation_strategy/dislocation_dashboard_export.csv`

## Purpose

This note documents how `sentiment-dash` should consume the SETA dislocation dashboard export without importing the full research/backtest machinery.

The prediction engine owns rule discovery, locked forward validation, maturity scoring, friction checks, and governance. The dashboard should consume stable output fields and present them as **research context**, not as buy/sell instructions.

## Upstream files to consume

Primary export:

```text
artifacts/dislocation_strategy/dislocation_dashboard_export.csv
```

Field contract:

```text
artifacts/dislocation_strategy/dislocation_dashboard_export_contract.csv
```

Summary:

```text
artifacts/dislocation_strategy/dislocation_dashboard_export_summary.json
```

## Current confirmed export state

The current export contains 5 registry rows:

- 1 lead rule.
- 2 baseline/control rules.
- 4 rules with forward outcomes pending.
- 1 locked lead rule with no forward events yet.

Current lead rule:

```text
DLOC_EQ_ULTRA_001
```

Dashboard label:

```text
Ultra-Compressed Dislocation
```

Current status:

```text
locked_no_forward_events_yet
```

This is expected. The lead rule is locked and protected, but no post-lock equity ultra-compressed validation event has fired yet.

## Recommended dashboard fields

Minimum display fields:

```text
rule_id
asset_class_scope
dashboard_tier
dashboard_label
dashboard_status
is_lead_rule
is_baseline_rule
forward_row_count
forward_3d_available_count
forward_3d_pending_count
maturity_score
maturity_level
public_copy_short
public_copy_detail
risk_guard_language
```

Optional diagnostic fields:

```text
strategy
rule_role
registry_status
validation_start_date
target_horizon
benchmark_rule_id
forward_3d_return_avg
forward_3d_return_hit_rate
forward_3d_return_net_avg
forward_3d_return_net_hit_rate
forward_3d_excess_vs_asset_class_avg
historical_3d_return_avg
historical_3d_hit_rate
historical_3d_excess_vs_asset_class_avg
historical_3d_net_avg_at_friction
historical_3d_net_hit_rate_at_friction
```

## Suggested display logic

### Lead rule card

Filter:

```text
is_lead_rule = True
```

Suggested title:

```text
Ultra-Compressed Dislocation
```

Suggested subtitle:

```text
Locked research rule under forward validation
```

Use:

```text
public_copy_short
public_copy_detail
risk_guard_language
```

### Baseline cards

Filter:

```text
is_baseline_rule = True
```

Suggested title:

```text
Price-Compression Baseline
```

Purpose:

Show the benchmark/control context. The dashboard should make clear that baseline rules are controls, not SETA-enhanced claims.

### Forward validation status

Use `dashboard_status`:

```text
locked_no_forward_events_yet
forward_outcomes_pending
forward_outcomes_available
locked_monitoring
retired
```

Suggested mappings:

| dashboard_status | Display meaning |
|---|---|
| `locked_no_forward_events_yet` | Rule is locked, but has not fired after validation start. |
| `forward_outcomes_pending` | Events are captured, but forward return windows have not matured. |
| `forward_outcomes_available` | Matured outcomes exist and can be reviewed. |
| `locked_monitoring` | Rule is locked for monitoring/context. |
| `retired` | Rule is no longer active. |

## Guardrail language

Use language like:

- research context
- locked validation rule
- forward outcomes pending
- baseline/control
- under-validation context
- price stress
- sentiment resilience

Avoid language like:

- buy
- sell
- trade signal
- guaranteed reversal
- price target
- bottom is in

## Recommended first UI module

A compact card group:

1. Lead rule card: `is_lead_rule = True`.
2. Benchmark card: `rule_id = DLOC_EQ_PRICE_001`.
3. Cross-asset monitor card: `rule_id = DLOC_ALL_ULTRA_WATCH_001`.
4. Status footer showing `forward_3d_available_count` and `forward_3d_pending_count`.

## Integration stance

The dashboard should not compute or tune dislocation rules. It should display the upstream export as a stable context layer.

If thresholds change upstream, they must appear as a new `rule_id` in the prediction-engine registry.
