# Dislocation Context Cards Contract

This contract protects the standalone SETA Dislocation Context Cards surface.

The page is a read-only research context surface powered by the Prediction Intelligence Engine export. It is not a trading system, tuning interface, promotion engine, or rule-selection workflow.

## Product purpose

The Dislocation Context Cards page should help a reader understand validation context around dislocation rules without turning the export into a trade signal.

It should answer:

- Which rule is the current lead context?
- Which baseline/control rules are still visible for comparison?
- How much forward evidence is available?
- How much 3-day evidence is still pending?
- What guardrail language should frame the reader's interpretation?

## Source contract

Default source path:

```text
public_content/dislocation_dashboard_export.csv
```

The page may accept a custom relative source URL with:

```text
?data=path/to/dislocation_dashboard_export.csv
```

The export must include these columns:

```text
rule_id
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
risk_guard_language
public_copy_short
public_copy_detail
```

## Validation rules

The page should reject invalid exports with a visible error state when:

- the export has no rows
- required columns are missing
- there is not exactly one lead rule
- there is no baseline/control rule

## Layout contract

The page should preserve this hierarchy:

1. Hero/title explaining the surface as SETA research context.
2. Source pill showing the loaded export path.
3. Status strip with total rows, lead-rule count, baseline count, and 3D pending count.
4. Lead card as the main card.
5. Baselines and monitors as secondary mini-cards.
6. Risk guard language attached to the lead card.

The lead card should show:

- dashboard tier
- dashboard status
- dashboard label
- public detail copy when available
- maturity score
- maturity level
- forward row count
- 3D pending count
- risk guard language

Mini-cards should show:

- dashboard label
- dashboard status
- rule ID
- dashboard tier
- 3D available/pending counts
- short public copy

## Reader guardrails

The surface must remain read-only and explanatory.

It should not:

- compute new rules in the browser
- tune model parameters
- promote rules automatically
- describe trade instructions
- imply price targets
- present dashboard status as a buy/sell signal

Preferred framing:

```text
research context
validation context
baseline/control comparison
forward evidence
pending evidence
risk guard language
```

Avoid framing:

```text
trade signal
buy/sell call
prediction certainty
automated promotion
```

## QA protection

The static smoke should verify:

- the HTML surface exists
- the required export columns are still listed
- the default CSV path is still present
- the lead/baseline validation rules remain in place
- the error state remains visible and helpful
- the page copy remains read-only and non-trading
- risk guard language is rendered on the lead card
