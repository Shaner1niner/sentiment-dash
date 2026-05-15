# Homepage Splash Polish Browser QA

## Purpose

Document browser QA after the SETA homepage splash polish and follow-up background layering fix.

This QA confirms the homepage now renders the polished SETA ribbon splash design while preserving all production navigation routes.

## Branch

`qa/homepage-splash-polish-browser-qa-v1`

## Related PRs

- `#153` -- Polish homepage splash design
- `#155` -- Fix homepage splash background layering

## Browser QA result

| Surface | Expected behavior | Result |
|---|---|---:|
| Homepage | Renders polished splash design | PASS |
| SETA ribbon background | Visible behind live page content | PASS |
| Hero text | Renders as live, sharp HTML text | PASS |
| Four homepage cards | Remain visible and clickable | PASS |
| Supporting info panels | Remain visible and readable | PASS |
| Public Market Dashboard card | Opens module runtime public route | PASS |
| Market Context Cards card | Opens context cards route | PASS |
| Research Dashboard card | Opens research/member route | PASS |
| Legacy Public Dashboard card | Opens preserved fallback route | PASS |
| Dashboard runtime files | Unchanged | PASS |
| Payload regeneration | Not performed for splash QA | PASS |

## URLs reviewed

```text
https://shaner1niner.github.io/sentiment-dash/?cb=splash_final_155
https://shaner1niner.github.io/sentiment-dash/interactive_dashboard_fix24_public_embed.html
https://shaner1niner.github.io/sentiment-dash/interactive_dashboard_fix24_public_legacy_embed.html
https://shaner1niner.github.io/sentiment-dash/seta_public_context_cards.html?dashboard=interactive_dashboard_fix24_public_embed.html
https://shaner1niner.github.io/sentiment-dash/interactive_dashboard_fix24_member_embed.html
```

## Visual QA notes

Confirmed:

- the SETA ribbon background is visible
- the homepage uses live HTML text over the decorative background asset
- the hero headline remains readable and sharp
- the card grid remains readable against the background
- the background supports the product identity without replacing functional navigation
- the live GitHub Pages status pill remains visible
- page layout remains centered and visually balanced on desktop

## Route QA

Confirmed existing homepage route intent remains intact:

```text
Public Market Dashboard -> interactive_dashboard_fix24_public_embed.html
Market Context Cards -> seta_public_context_cards.html?dashboard=interactive_dashboard_fix24_public_embed.html
Research Dashboard -> interactive_dashboard_fix24_member_embed.html
Legacy Public Dashboard -> interactive_dashboard_fix24_public_legacy_embed.html
```

## Smoke validation

Associated smoke validation:

```powershell
python scripts\smoke_fix26_dashboard.py
```

Expected warning retained:

```text
embed entry/cache tokens differ
```

This remains expected because the production public route now uses the module runtime manifest token, while legacy/member routes remain pinned to the legacy monolith token.

## Repository posture

Confirmed after the splash polish and background-layer fix:

```text
main pulled
fix branch deleted
working tree clean
```

## Non-goals

- no route changes
- no dashboard runtime changes
- no payload regeneration for this QA report
- no monolith edits
- no member/research route replacement
- no legacy fallback deletion

## Final QA recommendation

Homepage splash polish browser QA passes.

The polished splash homepage can remain live as the SETA front door. It supports the production module runtime milestone while preserving route clarity, fallback access, and live HTML accessibility.
