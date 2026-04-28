# SETA Social Reply Draft Queue v1

This adds batch processing for draft-only SETA social replies.

It does **not** post to X, Bluesky, Reddit, or any API. It reads comments from JSONL, calls `scripts/draft_seta_social_reply.py`, and writes reviewable JSONL and CSV queues.

## Input format

Each input line is one JSON object. Supported fields:

```json
{"platform":"x","comment_id":"x_001","author":"sample_user","comment":"Why is $BTC ranked so high today?"}
```

Accepted comment text keys: `comment`, `comment_text`, `text`, `body`, `content`.

## Run

```bat
cd C:\Users\shane\sentiment-dash
python scripts\build_seta_reply_draft_queue.py --input reply_agent\sample_inputs\sample_queue_comments.jsonl
```

Outputs are written to:

```text
reply_agent/draft_queue/seta_reply_drafts_YYYYMMDD_HHMMSS.jsonl
reply_agent/draft_queue/seta_reply_drafts_YYYYMMDD_HHMMSS.csv
```

Every row includes:

- `status`: `pending` or `no_reply_recommended`
- `requires_human_review`: always `true`
- `approved`: always `false`
- `posted`: always `false`
- `draft_reply`: the proposed reply text, when appropriate

## Smoke test

```bat
python scripts\smoke_seta_reply_queue.py
```

## Commit

```bat
git add scripts\build_seta_reply_draft_queue.py scripts\smoke_seta_reply_queue.py reply_agent\sample_inputs\sample_queue_comments.jsonl README_SETA_REPLY_QUEUE.md
git commit -m "Add SETA reply draft queue"
git push origin main
```
