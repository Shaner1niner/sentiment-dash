# Module Runtime Production Route Cutover Browser QA

## Purpose

Document post-cutover browser QA after promoting the module runtime to the production public dashboard route.

This QA confirms the public/default dashboard route now opens the module runtime, the legacy public dashboard fallback remains available, and the untouched Market Context and Research routes remain valid.

## Branch

`qa/module-runtime-production-route-cutover-browser-qa-v1`

## Related PR

`#151` -- Promote module runtime to production public dashboard route

## Cutover result

| Route / surface | Expected post-cutover behavior | Browser QA result |
|---|---|---:|
| Homepage | Four navigation cards remain visible | PASS |
| Public Market Dashboard card | Opens `interactive_dashboard_fix24_public_embed.html` | PASS |
| Production public dashboard route | Loads module runtime public dashboard | PASS |
| Legacy Public Dashboard card | Opens preserved legacy fallback route | PASS |
| Legacy fallback route | Loads previous public dashboard / monolith route | PASS |
| Market Context Cards | Remains available | PASS |
| Research Dashboard | Remains available | PASS |
| Module candidate page | Retained as direct QA/debug surface | PASS |
| Member/research route replacement | Not performed | PASS |
| Payload regeneration | Not performed | PASS |

## URLs reviewed

```text
https://shaner1niner.github.io/sentiment-dash/?cb=post_cutover_home_001
https://shaner1niner.github.io/sentiment-dash/interactive_dashboard_fix24_public_embed.html?cb=post_cutover_public_001
https://shaner1niner.github.io/sentiment-dash/interactive_dashboard_fix24_public_legacy_embed.html?cb=post_cutover_legacy_001
https://shaner1niner.github.io/sentiment-dash/interactive_dashboard_fix24_member_embed.html
https://shaner1niner.github.io/sentiment-dash/seta_public_context_cards.html?dashboard=interactive_dashboard_fix24_public_embed.html
```

## Homepage QA

Confirmed the homepage renders the expected four-card navigation:

```text
Public Market Dashboard
Market Context Cards
Research Dashboard
Legacy Public Dashboard
```

Confirmed card intent:

```text
Public Market Dashboard -> production public module route
Market Context Cards -> context cards route
Research Dashboard -> member/research route
Legacy Public Dashboard -> preserved legacy fallback route
```

## Production public dashboard QA

Route reviewed:

```text
interactive_dashboard_fix24_public_embed.html
```

Confirmed this route now loads the module runtime public dashboard.

Browser-visible checks passed:

- briefing panel renders
- Market Tape renders
- selected detail renders
- detail deck renders
- event / confirmation timeline renders
- chart stack renders
- price chart renders
- MACD renders
- RSI renders
- Stoch RSI renders
- typed regime marker traces remain visible on marker-rich assets
- controls remain visible and usable
- no app-blocking runtime errors observed

Representative assets reviewed:

```text
BTC
ETH
```

## Legacy public dashboard fallback QA

Route reviewed:

```text
interactive_dashboard_fix24_public_legacy_embed.html
```

Confirmed the preserved legacy public dashboard fallback still opens.

Browser-visible checks passed:

- legacy public dashboard renders
- briefing panel renders
- Market Tape renders
- chart stack renders
- event timeline renders
- legacy fallback remains separate from the new production public module route

## Research / member QA

Confirmed Research Dashboard remains available and was not replaced by the public route cutover.

Visible checks passed:

- Research Dashboard loads
- member mode remains labelled
- briefing panel renders
- Market Tape renders
- chart stack renders
- event timeline renders

## Market Context QA

Confirmed Market Context Cards remain available after the route cutover.

Visible checks passed:

- context cards page loads
- context packet metadata renders
- card grid renders
- dashboard link remains available

## Smoke validation associated with cutover

The cutover PR validated the full smoke set:

```powershell
python scripts\smoke_module_plotly_renderer_parity.py
python scripts\smoke_module_market_tape_parity.py
python scripts\smoke_module_runtime_harness.py
python scripts\smoke_module_briefing_panel_parity.py
python scripts\smoke_module_store_control_state.py
python scripts\smoke_module_asset_payload_loading.py
python scripts\smoke_display_range_window_core.py
python scripts\smoke_fix26_dashboard.py
```

Expected warning retained:

```text
embed entry/cache tokens differ
```

This is expected after the cutover because:

```text
interactive_dashboard_fix24_public_embed.html -> module runtime token
interactive_dashboard_fix24_public_legacy_embed.html -> legacy monolith token
interactive_dashboard_fix24_member_embed.html -> legacy monolith token
```

## Repository posture after cutover

Confirmed after merging `#151`:

```text
main pulled
promotion branch deleted
working tree clean
post-cutover QA branch created from clean main
```

## Rollback path

Rollback remains simple:

```text
revert #151
```

The fallback route exists, the candidate route exists, and the previous public dashboard is preserved as:

```text
interactive_dashboard_fix24_public_legacy_embed.html
```

Rollback does not require payload regeneration.

Rollback does not require restoring deleted dashboard files from history.

## Non-goals

- no payload regeneration
- no monolith deletion
- no member/research route replacement
- no Market Context route replacement
- no Research Dashboard route replacement
- no additional runtime changes
- no generated chart-store or reviewed-briefing edits

## Final QA recommendation

Post-cutover browser QA passes.

The production public dashboard route can remain on the module runtime, with the legacy public dashboard retained as fallback and member/research surfaces unchanged.
