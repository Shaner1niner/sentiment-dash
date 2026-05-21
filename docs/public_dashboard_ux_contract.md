# SETA Public Dashboard UX Contract

This document locks the current public dashboard reader experience. It is intentionally product-facing: formulas and generated data can evolve, but these visibility and language rules should not regress without an explicit product decision.

## Product frame

The public dashboard explains market emotion, setup quality, and participation context. It does not provide price targets or trade instructions.

The default user path is:

1. Public intro
2. Controls
3. Market Radar
4. Asset Briefing
5. Active Setup Snapshot
6. How to Read This Chart
7. Chart

## Control semantics

- View
  - Briefing: clean reader mode
  - Research: expanded diagnostic mode
- Sentiment layer
  - Price Only: hide sentiment overlays/traces
  - Price + Sentiment: show the sentiment layer across the chart stack
- Structure strip
  - On: show the structure strip and hover trace
  - Off: hide the structure strip and hover trace
- Attention layer, Range bands, Trend lens, Chart scale, Chart type, Display range, Frequency, and Asset are reader-facing labels and should remain user-native.

## Market Radar contract

Market Radar cards are ranked by attention but scored by structure.

Each card should make this hierarchy clear:

- attention rank explains why the asset surfaced
- ticker identifies the asset
- Structure score is the visible quality read
- tags summarize the setup family/context
- the card readout gives one compact sentence

Avoid repetitive per-card explanation copy. The single guide line should do the teaching:

> Ranked by attention. Scored by structure.

## Briefing mode contract

Briefing is the default clean reader mode. It should preserve enough signal to be useful without exposing the full diagnostic machinery.

Briefing should show:

- Market Radar
- Asset Briefing
- Active Setup Snapshot
- How to Read This Chart
- chart

Briefing should hide:

- full Asset Signal Readout grid
- Evidence Trail
- Signal Internals
- long diagnostic detail decks

Briefing evidence density:

- show a concise evidence preview
- cap visible Asset Briefing Evidence receipts at 3
- summarize remaining receipts with a compact line that points to Research mode / source briefing

## Active Setup Snapshot contract

The Active Setup Snapshot is the selected-asset center of gravity in Briefing mode.

It should show three compact elements:

- Structure Score as the hero
- compact Signal State as the interpretation
- Structure Trend as the live/hourly movement read

Structure Score should remain the canonical term. Add interpretation with supporting copy such as:

- `Overall setup quality: Mixed`

Do not rename Structure Score to Overall Score. The dashboard should teach the SETA term while making it understandable.

## Research mode contract

Research is the expanded diagnostic mode. It can expose detail that would make Briefing too dense.

Research should show:

- full Asset Signal Readout
- Evidence Trail
- Signal Internals
- deeper evidence receipt preview
- the same chart controls and chart layer behavior as Briefing

Research evidence density:

- allow a deeper evidence preview than Briefing
- current cap: 6 visible receipts

## Structure Trend contract

The Structure Trend sparkline should remain visible in Briefing mode when hourly structure history exists.

The readout should be explicit:

- score and direction belong in the header area
- the classification label should be named as the structure stack, not left as an orphan adjective

Preferred language pattern:

- `47.8 · Softening`
- `Structure stack: Mixed (-5.3)`

`Mixed` refers to the overall structure stack classification, not just a single indicator family.

## Safety and product language

The dashboard should continue to avoid price targets, trade instructions, and certainty language. Preferred framing:

- attention is not validation
- structure describes setup quality
- confirmation is earned, not assumed
- participation quality matters
- SETA explains market emotion and setup quality