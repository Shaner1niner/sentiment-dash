# SETA Reply Queue Context Columns v1

This patch upgrades `scripts/build_seta_reply_draft_queue.py` so each draft queue row includes flattened review columns from the upgraded draft reply agent.

The queue still remains draft-only and human-review-only. It does not post to any platform.

## Added review columns

- `daily_universe`
- `daily_asset_state`
- `daily_structural_state`
- `daily_decision_pressure_rank`
- `daily_decision_pressure`
- `daily_resolution_skew`
- `daily_analyst_take`
- `narrative_regime`
- `narrative_coherence_bucket`
- `narrative_top_keywords`
- `narrative_top_lifts`
- `layers_used`
- `layer_screener`
- `layer_daily`
- `layer_narrative`

These fields make the review CSV scannable without opening the nested JSON payload for every draft.

## Install

Copy these files into the repo:

```bat
cd C:\Users\shane\Downloads
copy patch_seta_reply_queue_context_columns_v1.py C:\Users\shane\sentiment-dash\
copy smoke_seta_reply_queue_context_columns_v1.py C:\Users\shane\sentiment-dash\scripts\
copy README_SETA_REPLY_QUEUE_CONTEXT_COLUMNS.md C:\Users\shane\sentiment-dash\
```

Run the patch and smoke test:

```bat
cd C:\Users\shane\sentiment-dash
python patch_seta_reply_queue_context_columns_v1.py
python scripts\smoke_seta_reply_queue_context_columns_v1.py
```

Manual queue test:

```bat
python scripts\build_seta_reply_draft_queue.py --input reply_agent\sample_inputs\sample_queue_comments.jsonl
```

Commit:

```bat
git add scripts\build_seta_reply_draft_queue.py scripts\smoke_seta_reply_queue_context_columns_v1.py README_SETA_REPLY_QUEUE_CONTEXT_COLUMNS.md
git commit -m "Add SETA reply queue context columns"
git push origin main
```

Generated queue outputs under `reply_agent/draft_queue/` should stay uncommitted.
