# UX Briefing Mode V1

Briefing Mode is the first simplified reading layer for Dashboard v2.

Its purpose is to help a new or returning user understand the selected asset without first decoding every control, pane, and marker family.

## Default Briefing Sections

Briefing Mode should answer four questions:

- What SETA sees
- Why it matters
- Evidence
- Trust check

The trust check must include authorship/source breadth when available.
## Semantic Contract

Briefing Mode should separate the SETA read into plain-language layers before showing internal labels.

Use these public meanings consistently:

- **Primary read**: the main SETA interpretation for the selected asset, frequency, and display range.
- **Overlap**: the shared zone where price bands and sentiment bands agree.
- **Outside Shared Zone**: a condition where price is outside that shared price/sentiment zone. This is the preferred public label for the internal overlap-event concept.
- **Structure**: the broader price/sentiment regime shape, such as Bullish Expansion, Bearish Expansion, Compression / Transition, or Flat / Transition.
- **Timing context**: whether traditional timing indicators confirm, weaken, or conflict with the current structure.
- **Attention**: participation context, not validation.
- **Source breadth**: a trust check on whether participation appears distributed or concentrated.

Avoid stacking mixed labels without naming their layer. For example, do not present "Inactive with Bullish Expansion and bearish confirmation" as one undifferentiated read. Prefer a layered sentence such as: "Price is not currently outside the shared price/sentiment zone. Structure leans Bullish Expansion, while timing indicators remain bearish."

Source-specific caveats are primarily internal-facing unless they materially affect the public breadth finding. Public copy should present the qualified finding rather than measurement internals.

## Breadth As A Trust Layer

Breadth helps the user understand whether attention appears distributed or concentrated.

Use compact labels:

- Broad
- Moderate
- Narrow
- Source Limited

Suggested language:

- "Participation is showing across a broader source base."
- "Participation has some breadth, but still needs structure confirmation."
- "Attention may be concentrated in a smaller source set."
- "Source breadth is unavailable or sample-limited."

Avoid claiming that breadth proves organic demand. It is a confidence check on the attention read.

## Source-Specific Caveats

X breadth should be treated as sample-limited when API coverage is incomplete.

News breadth should usually be described as source or outlet breadth, not true crowd authorship. Syndication, wire copy, and repeated coverage can make news participation look broader than it is.

## View Behavior

Briefing Mode is available through the dashboard `VIEW` control.

The initial implementation keeps the existing chart and controls available while adding a concise briefing panel above the research surface. A later UX phase may collapse advanced controls behind a stronger research toggle.

## Acceptance Criteria

- The panel appears in public and member dashboards.
- The panel includes a trust check based on source breadth.
- The chart remains available below the briefing.
- Public-safe wording avoids advice, predictions, and trade instructions.
- Missing breadth data degrades to Source Limited rather than hiding uncertainty.


## V2 Card Jobs

The next briefing-panel product contract is documented in [Briefing Card Jobs V2](BRIEFING_CARD_JOBS_V2.md). V2 separates interpretation, implication, factual receipts, and participation quality so the four cards do not repeat one another.

