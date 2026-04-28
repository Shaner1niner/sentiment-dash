# SETA Reply Wording v2

This pass keeps the three-layer reply architecture intact while polishing the generated draft text.

## What changed

- Buckets numeric-only indicator labels into human phrases.
  - `Bollinger 80.2` becomes `Bollinger strong structure`.
  - `Trend 62.5` becomes `Trend constructive trend support`.
- Sanitizes `NaN` / non-finite numeric values before JSON output.
- Improves daily-context phrasing.
- Improves TF-IDF keyword selection.
  - Avoids awkward duplicates like `basis` plus `cost basis`.
  - Keeps narrative terms short and readable.
- Preserves draft-only and human-review invariants.

## Run

```bat
cd C:\Users\shane\sentiment-dash
python patch_seta_reply_wording_v2.py
python scripts\smoke_seta_reply_wording_v2.py
```

## Manual test examples

```bat
python scripts\draft_seta_social_reply.py --platform x --comment "Why is $BTC ranked so high today and what is the narrative?"
python scripts\draft_seta_social_reply.py --platform reddit --comment "Is $ETH financial advice or a buy signal?"
python scripts\draft_seta_social_reply.py --platform bsky --comment "What regime is $SOL in here?"
python scripts\draft_seta_social_reply.py --platform reddit --comment "What changed in the $AAPL narrative?"
```
