# Dashboard V2 Market Tape Universe - 2026-05-03

The Market Tape ranks rows from the screener store, then filters the visible cards to the current dashboard mode.

## Ranking Scope

- The `#` rank shown on each card is the global screener priority rank.
- The current screener store has 27 ranked assets.
- The card strip shows up to five candidates from the selected Market Tape section.
- Section tabs such as Top Priority, Fresh Confirmed, and Quiet / Monitor each have their own candidate list.

## Mode Filtering

- Member mode filters the screener rows to the member dashboard asset universe.
- Public mode filters the screener rows to the public dashboard asset universe.
- SPY is still expected to be absent until the upstream pipeline restores coverage.
- When a configured asset lacks screener coverage, it is treated as awaiting upstream data rather than a dashboard failure.

## UI Wording

The Market Tape header now includes a scope line:

```text
Showing 5 of 12 Top Priority candidates · rank # is global across 27 screener assets · 27 member assets covered
```

The exact counts change by dashboard mode and active section. This keeps the ranking trustworthy without adding another panel or changing the ranking math.
