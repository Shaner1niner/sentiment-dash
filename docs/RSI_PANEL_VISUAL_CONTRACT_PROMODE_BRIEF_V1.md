# RSI Panel Visual Contract + ProMode Brief V1

## Purpose

Create a focused design brief and ProMode-ready query for the SETA module RSI panel before the next implementation pass.

This is a design-contract side quest only. It should not change renderer code, payloads, formulas, routes, or generated content.

## Current implementation baseline

The module RSI panel now has:

- primary `RSI` trace
- secondary `Sentiment RSI` trace when `sentiment_rsi` exists in the payload
- price-RSI-driven breach fill above 70 and below 30
- subdued RSI background zones
- deterministic Stoch RSI colors
- visual hierarchy rebalanced so price RSI sits above sentiment RSI

PR context:

- PR #179 added RSI zone-fill treatment.
- PR #180 added layered RSI gradient-style fills and Sentiment RSI rendering.
- PR #181 rebalanced the RSI visual hierarchy.

## Design problem

The panel is functional and much improved, but the target is a premium, restrained, product-grade technical instrument.

The next step is not another ad hoc patch. The next step is to lock the visual language:

- what should command attention
- what should be contextual
- what should be atmospheric
- what should be nearly invisible until the data earns emphasis

## Desired product feel

The RSI panel should feel like:

- a dark glass instrument
- quiet pressure zones
- one confident primary line
- one ghosted sentiment reference line
- soft fill only when stretched
- threshold rails with architectural precision
- complex information that looks effortless
- color used as language, not decoration
- no loud neon unless the data earns it

## Core visual hierarchy

The panel should read in this order:

1. **Primary Price RSI** — the hero structure line.
2. **RSI breach fill** — only visible when RSI stretches above 70 or below 30.
3. **Sentiment RSI** — ghost/reference context, never the protagonist.
4. **30 / 70 rails** — architectural threshold guides.
5. **Background zones** — atmospheric pressure fields.
6. **Grid and tick labels** — barely-there orientation support.

## Layer contract

### 1. Environment layer

The RSI panel should have quiet upper/lower structure zones.

Upper zone:

- range: 70–100
- tone: warm charcoal/amber wash
- opacity: approximately 2–4%
- feel: subtle pressure field, not a block

Lower zone:

- range: 0–30
- tone: cool blue/violet wash
- opacity: approximately 2–4%
- feel: subtle pressure field, not a block

Optional simulated depth:

- top/bottom very-low-opacity panel shading to make the panel feel less flat
- should be almost subconscious

### 2. Threshold rail layer

The threshold rails should feel like architectural guides.

70 rail:

- warm amber
- 1px
- 18–24% opacity
- solid or very short dash

30 rail:

- cool blue/violet
- 1px
- 18–24% opacity
- solid or very short dash

50 rail:

- neutral gray/blue-gray
- 8–10% opacity
- thinner/less dominant than 30/70

Regular grid:

- should recede behind threshold rails
- should not compete with RSI line or breach fills

### 3. Primary Price RSI line

Price RSI is the hero.

Suggested treatment:

- soft electric violet / lavender
- opacity: 90–95%
- width: 1.35–1.6px
- linear shape; do not over-smooth
- render above Sentiment RSI

Micro-glow:

- duplicate RSI trace behind the main line
- same x/y
- width: 4–5px
- opacity: 10–14%
- same hue
- hover disabled
- showlegend false

Goal: make the line feel present and premium without becoming flashy.

### 4. Sentiment RSI ghost line

Sentiment RSI should be visibly present but subordinate.

Suggested treatment:

- muted antique gold
- opacity: 30–42%
- width: 0.9–1.0px
- dot or shortdash
- render behind Price RSI

Interpretive role:

- context/reference line
- shows whether sentiment structure is moving with or against Price RSI
- should not repaint the RSI fill in V1

### 5. RSI breach fill / gradient layer

Fill should appear only when Price RSI breaches the thresholds.

Upper breach:

- trigger: RSI > 70
- fill between 70 and RSI line
- warm amber family
- gradient by depth:
  - 70–80: very soft
  - 80–90: medium
  - 90–100: strongest

Lower breach:

- trigger: RSI < 30
- fill between RSI line and 30
- cool blue/violet family
- gradient by depth:
  - 20–30: very soft
  - 10–20: medium
  - 0–10: strongest

Important:

- fill should belong to the RSI line, not the whole panel
- avoid full-height vertical blocks
- avoid sentiment-driven fill-color switching for now

### 6. Dynamic state caption

Current static label can evolve from:

`RSI structure zone`

Toward compact state captions:

- `RSI neutral`
- `RSI upper stretch`
- `RSI lower reset`
- `RSI + sentiment aligned`
- `RSI / sentiment diverging`

Suggested treatment:

- top-right inside RSI panel
- font size: 9px
- optional uppercase / slight letter spacing
- muted cyan/blue-gray
- 65–75% opacity
- text only, not a heavy pill

Do not over-label the panel.

### 7. Stoch RSI timing panel

Stoch RSI should remain visually secondary.

Role:

- timing panel, not structure panel
- should not compete with RSI

Suggested treatment:

- deterministic muted colors
- lower saturation than RSI
- line width around 0.95–1.0px
- keep 20 / 80 guide context simple

Do not add glow to Stoch RSI before the RSI panel is locked.

## What not to do

Avoid:

- loud neon
- full-height regime blocks in the RSI panel
- sentiment-colored RSI fills that create inconsistent color language
- heavy pill labels inside the panel
- over-saturated Stoch RSI colors
- too many legends or annotations
- turning the RSI panel into a nightclub indicator
- using Structure Score as an RSI threshold driver

## Recommended implementation phases

### Phase 1 — Rails + micro-glow

Branch suggestion:

`polish/module-rsi-rails-glow-v1`

Scope:

- `src/PlotlyRenderer.js` only
- add duplicate low-opacity RSI glow trace behind RSI
- refine 30/70/50 rails
- make regular grid recede
- keep payloads/formulas/routes unchanged

### Phase 2 — Gradient depth tuning

Branch suggestion:

`polish/module-rsi-gradient-depth-v1`

Scope:

- tune 70–80 / 80–90 / 90–100 opacity
- tune 20–30 / 10–20 / 0–10 opacity
- make breach fill feel attached to the RSI line

### Phase 3 — Dynamic state caption

Branch suggestion:

`polish/module-rsi-state-caption-v1`

Scope:

- replace or supplement static `RSI structure zone`
- add tiny state-aware caption
- keep caption restrained

### Phase 4 — Sentiment accent, only if needed

Branch suggestion:

`polish/module-rsi-sentiment-accent-v1`

Scope:

- subtle accent when Price RSI and Sentiment RSI align/diverge
- do not repaint the fill
- possibly brighten sentiment ghost line or add tiny edge accent

## ProMode workflow

Use the **ProMode query** below, then paste **Appendix A — Source RSI specs for ProMode** immediately after it.

The appendix preserves the strongest designer-language specs from chat verbatim enough that ProMode can reason from the original taste direction instead of only the summarized contract.

## ProMode query

Use the following as the next ProMode prompt.

```text
You are designing a premium, minimal, dark-mode technical analysis panel for a behavioral market intelligence dashboard called SETA.

The panel is an RSI structure panel with:
- primary Price RSI
- secondary Sentiment RSI
- 30 / 70 threshold structure
- optional fill when RSI breaches above 70 or below 30
- Stoch RSI in a separate lower timing panel

The product aesthetic should be:
- clean
- minimal
- sophisticated
- analytical
- dark glass instrument
- complex information that looks effortless
- color used as language, not decoration
- no flashy neon unless the data earns it

Current implementation baseline:
- RSI renders as the primary line.
- Sentiment RSI renders as a secondary dotted/ghost line when `sentiment_rsi` exists.
- Breach fills are driven by Price RSI only.
- Upper/lower RSI zones exist but need more refinement.
- Stoch RSI is visually secondary.
- The panel is functional, but it still needs a more premium visual contract.

Desired final feel:
The RSI panel should feel like a dark glass instrument: quiet pressure zones, one confident violet line, one ghosted sentiment reference, soft fill only when stretched, threshold rails with architectural precision, no loud decoration, no clutter.

Important source material:
After this prompt, I am pasting detailed RSI designer specs. Treat those specs as the primary taste direction. Preserve the minimalist, premium, precision-gauge aesthetic, but refine it into an implementable visual contract.

Please define an implementable visual design contract for this RSI panel, including:

1. Visual hierarchy.
2. Price RSI line color, opacity, width, and optional micro-glow treatment.
3. Sentiment RSI ghost-line color, opacity, width, dash style, and layering.
4. 30 / 70 / 50 threshold rail treatment.
5. Background pressure-zone treatment for 70–100 and 0–30.
6. Breach fill / gradient treatment for RSI > 70 and RSI < 30.
7. Whether sentiment should affect fill color, line accent, caption state, or none of these.
8. Stoch RSI timing-panel treatment.
9. Dynamic caption treatment for states such as RSI neutral, RSI upper stretch, RSI lower reset, RSI + sentiment aligned, and RSI / sentiment diverging.
10. What not to do.
11. A phased Plotly implementation plan that minimizes risk and keeps each PR renderer-only.

Keep the design restrained, elegant, and product-grade. Favor subtle hierarchy, depth, and clarity over flashy effects.
```

## Appendix A — Source RSI specs for ProMode

Paste this section into ProMode immediately after the query above.

```text
My designer-level direction

I would make the RSI panel feel like a precision gauge, not a small chart.

The panel should have three visual layers:
1. Environment: quiet 30/70 structure zones
2. Signal: primary RSI line
3. Context: sentiment RSI as a ghost/reference line

Right now, the zones are too block-like and the two lines compete slightly. I would make the background more atmospheric and the RSI line more intentional.

1. Make the 30/70 zones feel like pressure fields, not rectangles

Current upper/lower bands are correct, but visually they read as flat blocks.

I would keep them, but soften them heavily:

Upper zone 70–100:
- warm charcoal-amber wash
- 2–3% opacity

Lower zone 0–30:
- cool blue-black wash
- 2–3% opacity

Then add a very subtle inner fade near the threshold:

70–80: almost invisible amber
80–90: slightly warmer
90–100: faint but noticeable pressure

20–30: almost invisible blue
10–20: slightly cooler
0–10: faint but noticeable pressure

The key is that the zone should not scream overbought/oversold. It should whisper: this area has gravity.

2. Make the 30 and 70 rails cleaner and more luxurious

The threshold lines should be treated like architectural guide rails.

70 rail:
- 1px line
- warm amber
- 18–24% opacity
- solid or very short dash

30 rail:
- 1px line
- cool blue-violet
- 18–24% opacity
- solid or very short dash

50 rail:
- extremely faint neutral gray
- 8–10% opacity

Right now the panel feels grid-driven. I would make the threshold rails more important than the regular grid, and make the regular grid almost disappear.

3. Make price RSI the hero line

The main RSI line should have more confidence.

Price RSI:
- color: soft electric violet / lavender
- opacity: 90–95%
- width: 1.35–1.6px
- shape: linear, not overly smoothed

Then give it a micro-glow, not a neon glow:

Duplicate RSI trace behind it:
- same x/y
- width: 4–5px
- opacity: 10–14%
- same hue
- hover disabled
- showlegend false

This gives the line presence without making it flashy. That one move will make it feel premium.

4. Make Sentiment RSI a ghost line, not a second protagonist

The sentiment RSI should be obviously there, but subordinate.

Current dotted line is directionally right. I would make it even more like a reference layer:

Sentiment RSI:
- color: muted antique gold
- opacity: 32–42%
- width: 0.9–1.0px
- dash: dot or shortdash

It should not compete with the RSI line. It should feel like a second hand on an instrument panel. The line should appear behind price RSI. That is important.

5. Use fill only when RSI breaches — never as general decoration

The best visual moment should be when RSI crosses above 70 or below 30.

For RSI > 70:
- fill between 70 and RSI line
- warm amber
- gradient by depth:
  - 70–80 very soft
  - 80–90 medium
  - 90–100 strongest

For RSI < 30:
- fill between RSI line and 30
- cool blue/violet
- gradient by depth:
  - 20–30 very soft
  - 10–20 medium
  - 0–10 strongest

This creates the same elegant effect from the reference image: the fill belongs to the line, not the whole panel.

Important: do not color the fill based on sentiment yet. That made the panel feel clever but less classy. Sentiment should influence a separate subtle accent later.

6. Add a tiny state read label, but only when useful

The top-right label currently says:
RSI structure zone

That is okay, but it is too static. Replace it with a dynamic state label:
- RSI neutral
- RSI upper stretch
- RSI lower reset
- RSI + sentiment aligned
- RSI / sentiment diverging

Style:
- font size: 9px
- uppercase optional
- letter spacing: 0.04em
- color: muted cyan/gray
- opacity: 70%
- position: top-right inside RSI panel

Do not make it a pill. A pill would be too heavy. Make it a quiet caption.

7. Reduce axis noise

The left axis currently works, but it can become more elegant.

Show only:
- 70
- 50
- 30

Possibly hide 0 and 100.

Tick labels:
- font size: 9px
- color: muted blue-gray
- opacity: 70%

No extra axis title if space gets tight. The panel label already says RSI.

8. Make the panel background slightly dimensional

This is the understated move that makes it feel expensive.

Use a very subtle vertical depth gradient:
- panel top: rgba(255,255,255,0.012)
- panel middle: transparent
- panel bottom: rgba(0,0,0,0.08)

In Plotly, this is hard as a true gradient, but it can be simulated with very low-opacity horizontal rectangles.

The goal is not to notice it. The goal is for the panel to stop feeling flat.

Final target aesthetic:
- dark glass instrument
- quiet pressure zones
- one confident violet line
- one ghosted sentiment reference
- soft fill only when stretched
- threshold rails with architectural precision
- no loud colors unless the data earns it

Recommended implementation order:
1. soften zones and rails
2. add RSI micro-glow
3. demote sentiment RSI further
4. refine breach fill opacity
5. add dynamic state label

The biggest immediate upgrade would be RSI micro-glow + better threshold rails. That will make the current panel feel significantly more premium without making it flashy.
```

## Acceptance criteria for this side quest

- ProMode prompt exists in repo docs.
- Prompt includes the strongest specs already developed in chat.
- Source RSI specs are preserved as a copy/paste appendix for ProMode.
- No runtime files are changed.
- No payload files are changed.
- No formulas are changed.
- No routes are changed.
