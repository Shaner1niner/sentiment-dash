# Briefing Narrative Coherence V2

This is a narrow quality contract for improving SETA reviewed briefing copy. It does not change dashboard rendering, asset coverage, prompt-pack generation, or reviewed-payload publishing mechanics.

## Problem observed

The dashboard and reviewed-payload coverage are working, but some reviewed briefings can tell a weaker or less coherent story than the visible dashboard state:

- a briefing may say price is not outside the shared price/sentiment zone while the dashboard shows Bearish Pressure, Bullish Pressure, or a confirmed pressure event
- a Strong Bearish or Strong Bullish SETA Score can be underweighted by generic neutral wording
- What SETA Sees can sound like a stitched field summary instead of expert interpretation of the combined indicator stack
- Participation Quality can be too long because it repeats implementation caveats and disclaimer language inside the card

## Primary rule

The briefing must tell the same story as the visible dashboard.

If dashboard-facing state and prose disagree, the prose is wrong unless it explicitly explains the difference between broad regime, overlap state, and confirmation status.

## Narrative hierarchy

Every generated or reviewed briefing should rank the read in this order:

1. SETA Score and dashboard archetype - the broad read should not be ignored.
2. Shared-zone / overlap state - distinguish inside zone, outside zone, pressure, watch, and confirmed pressure.
3. Timing stack - translate MACD, MACD histogram/momentum, RSI, Stoch RSI, and sentiment MA ribbon into a combined timing read.
4. Participation and attention - explain whether engagement confirms, weakens, broadens, or only contextualizes the setup.
5. Confidence / confirmation - separate confirmed events from watch candidates and unconfirmed pressure.

## Shared-zone language

Use precise public wording:

| State | Public language |
| --- | --- |
| Inside shared zone | Price remains inside the shared price/sentiment zone. |
| Outside, unconfirmed | Price is outside the shared zone, but confirmation is incomplete. |
| Bullish pressure | Price is below the shared zone, creating bullish pressure / reversion context. |
| Bearish pressure | Price is above the shared zone, creating bearish pressure / exhaustion context. |
| Confirmed bullish pressure | Bullish pressure is confirmed by the dashboard gates. |
| Confirmed bearish pressure | Bearish pressure is confirmed by the dashboard gates. |

Do not write `not outside the shared zone` when the dashboard shows Bullish Pressure, Bearish Pressure, Latest Confirmed, or an active Event Timeline pressure card.

## What SETA Sees

This card should synthesize the whole read. It should combine:

- SETA Score / dashboard archetype
- overlap state and latest confirmed/watch event
- MACD direction and momentum behavior
- RSI and Stoch RSI posture
- sentiment MA ribbon posture
- attention / engagement direction
- breadth or authorship quality when material

Target style:

```text
Primary read: MSFT is in a bearish risk state, not a neutral one. The low SETA Score, weak ribbon, bearish MACD family, and quiet participation point to pressure rather than confirmation. RSI is not deeply washed out, so the setup reads as deterioration rather than capitulation.
```

## Why It Matters

This card should explain confidence and implication, not generic importance.

Target style:

```text
This matters because the broad regime and timing stack agree more than the confirmation layer does. The setup is bearish, but participation is quiet and the latest overlap event is unconfirmed, so SETA treats it as pressure with limited confirmation rather than a completed move.
```

## Evidence

Evidence remains factual receipts. It can include one stack-summary receipt, but it should not become interpretive advice.

Good evidence examples:

- SETA Score is 19 / Strong Bearish.
- Latest overlap state is Bearish Pressure.
- MACD family is bearish while RSI is neutral/constructive.
- Attention is low/mixed; participation is quiet.
- Latest confirmed event is Bearish Pressure on 2026-04-27.

## Participation Quality

Keep this card concise. It should not carry implementation boilerplate.

Target style:

```text
Participation is quiet but improving. Authorship breadth is broad and stable, so the read is not narrowly sourced; however, the move still lacks a participation surge.
```

Avoid repeating these inside the card unless a specific data issue requires them:

- This draft uses only structured SETA payload fields.
- Source coverage and stale upstream data can limit confidence.
- Educational market context only; not investment advice.

Those statements belong in limitations/disclaimer fields or a small global dashboard disclaimer, not in the premium narrative card.

## Safety boundaries

Keep existing SETA safety rules:

- no buy/sell/hold instructions
- no price targets
- no guarantees
- no personalized financial advice
- no claim that attention, authorship, breadth, or participation proves demand
- no unsupported prediction of what price will do next

## Initial review set

Use a tiny review set before regenerating broader payloads:

- BTC public D 3M
- NVDA public D 3M
- LINK member D 6M
- MSFT member D 6M

Acceptance for this review set:

- no shared-zone contradiction
- Strong Bearish/Strong Bullish scores shape the primary read
- What SETA Sees synthesizes the indicator stack
- Why It Matters explains confidence/confirmation
- Evidence stays factual
- Participation Quality is concise
- all existing quality gates pass
