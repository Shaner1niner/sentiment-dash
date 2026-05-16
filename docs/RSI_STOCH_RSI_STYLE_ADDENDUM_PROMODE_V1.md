# RSI + Stoch RSI Paired Style Addendum for ProMode V1

## Purpose

Supplement the RSI panel ProMode brief with a paired treatment for RSI and Stoch RSI.

Use this addendum after the main ProMode query and Appendix A from `docs/RSI_PANEL_VISUAL_CONTRACT_PROMODE_BRIEF_V1.md`.

## Core idea

RSI and Stoch RSI should feel related, but not equal.

- **RSI** is the structure panel.
- **Stoch RSI** is the timing panel.
- RSI should carry the premium visual treatment.
- Stoch RSI should echo the same design language in a quieter, leaner way.

Think of the two panels as a two-part instrument:

1. RSI = structure gauge / pressure chamber.
2. Stoch RSI = timing needle / trigger chamber.

They should share a design vocabulary, but Stoch RSI should remain visually secondary.

## Visual hierarchy

The hierarchy should read:

1. Price RSI primary line.
2. RSI threshold rails and breach fill.
3. Sentiment RSI ghost/reference line.
4. Stoch RSI timing line.
5. Stoch RSI signal/reference line.
6. Stoch RSI 20/80 rails.
7. Stoch RSI background zone treatment.

Stoch RSI should never visually overpower the RSI panel.

## Shared design language

Both RSI and Stoch RSI can share:

- dark glass panel feel
- thin architectural threshold rails
- muted pressure-zone backgrounds
- restrained line widths
- low-opacity contextual reference lines
- minimal tick labels
- no loud neon
- no heavy pill labels

## Differentiation

### RSI panel

Role:

- Structure / pressure.
- Shows whether price RSI is stretched, neutral, or resetting.
- Primary interpretive panel.

Treatment:

- stronger hero line
- optional micro-glow
- more refined 30/70 rails
- contour breach fill when RSI exceeds 70 or falls below 30
- dynamic state caption may be appropriate

### Stoch RSI panel

Role:

- Timing / acceleration.
- Shows whether the structure is approaching a timing extreme or reset.
- Secondary interpretive panel.

Treatment:

- no glow by default
- no heavy gradient fill by default
- thinner lines than RSI
- more muted colors than RSI
- 20/80 rails should be visible but quieter than RSI 30/70 rails
- background zones can exist but should be extremely subtle
- no dynamic caption in V1 unless ProMode strongly recommends it

## Suggested Stoch RSI visual treatment

Stoch RSI line:

- color family: muted green/cyan or cool teal
- opacity: 45–60%
- width: 0.95–1.05px
- solid line

Stoch RSI signal line:

- color family: muted rose/coral or warm gray-red
- opacity: 35–50%
- width: 0.85–0.95px
- dot or shortdash

20 rail:

- cool blue/cyan-violet
- 1px
- 12–18% opacity
- very short dash or solid

80 rail:

- muted amber/gold
- 1px
- 12–18% opacity
- very short dash or solid

50 rail:

- neutral gray-blue
- 6–8% opacity

Background zones:

- 80–100: barely visible warm timing pressure wash, 1–2% opacity
- 0–20: barely visible cool timing reset wash, 1–2% opacity

## What not to do for Stoch RSI

Avoid:

- adding glow to Stoch RSI in the first paired pass
- using the same visual intensity as RSI
- adding large filled areas that compete with RSI breach fills
- adding a second dynamic caption
- over-coloring timing crosses
- making Stoch RSI look like the main signal

## ProMode instruction to add

When using ProMode, add this instruction after Appendix A:

```text
Also refine the Stoch RSI treatment as a paired but subordinate companion to RSI.

RSI and Stoch RSI should feel like they belong to the same premium dark-glass instrument family, but RSI should remain the structure/pressure panel and Stoch RSI should remain the timing/acceleration panel.

Please include a differentiated Stoch RSI visual contract covering:
- Stoch RSI line color, opacity, and width
- Stoch RSI signal/reference line color, opacity, width, and dash style
- 20 / 80 / 50 threshold rail treatment
- whether Stoch RSI should use background pressure zones
- whether Stoch RSI should receive glow, gradient, captions, or none of these
- how to keep Stoch RSI visually secondary to RSI
- phased Plotly implementation notes that keep RSI and Stoch RSI styling related but not visually equal

Do not let Stoch RSI overpower the RSI structure panel. Treat it as timing context, not the primary structure read.
```

## Recommended implementation impact

This can fit into the same overall ProMode design contract, but implementation should remain phased.

Recommended approach:

1. Phase 1: RSI rails + micro-glow, with only minor Stoch RSI rail/color cleanup if trivial.
2. Phase 2: RSI gradient depth tuning.
3. Phase 3: Stoch RSI paired styling pass, if the first two phases are visually stable.
4. Phase 4: Dynamic captions / sentiment accents.

Strong recommendation: do not combine RSI micro-glow, RSI gradient tuning, Stoch RSI redesign, dynamic captions, and sentiment accents in one PR.
