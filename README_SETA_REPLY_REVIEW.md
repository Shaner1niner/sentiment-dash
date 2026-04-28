# SETA Reply Review / Approval Workflow v1

This workflow adds a human review layer between draft generation and any future platform posting.

It does **not** post to X, Bluesky, Reddit, or any other platform.

## Files

```text
scripts/review_seta_reply_queue.py
scripts/smoke_seta_reply_review_queue.py
reply_agent/review_queue/
```

## Status values

Supported review statuses:

```text
pending
approved
rejected
edited
posted_later
```

The expected safety flow is:

```text
generate draft queue -> review/edit/approve -> only approved rows become eligible for later posting
```

## Preview a queue

```bat
python scripts\review_seta_reply_queue.py --input reply_agent\draft_queue\seta_reply_drafts_YYYYMMDD_HHMMSS.jsonl --list
```

## Approve / reject rows

Rows are one-based. You can use comma lists and ranges.

```bat
python scripts\review_seta_reply_queue.py ^
  --input reply_agent\draft_queue\seta_reply_drafts_YYYYMMDD_HHMMSS.jsonl ^
  --approve 1,3 ^
  --reject 4 ^
  --reviewed-by shane ^
  --note "manual review"
```

This writes:

```text
reply_agent/review_queue/seta_reply_reviewed_YYYYMMDD_HHMMSS.jsonl
reply_agent/review_queue/seta_reply_reviewed_YYYYMMDD_HHMMSS.csv
```

## Edit a reply

```bat
python scripts\review_seta_reply_queue.py ^
  --input reply_agent\draft_queue\seta_reply_drafts_YYYYMMDD_HHMMSS.jsonl ^
  --edit-index 2 ^
  --edit-reply "Edited reply text goes here." ^
  --reviewed-by shane
```

Edited rows keep `original_draft_reply` for audit.

## Smoke test

```bat
python scripts\smoke_seta_reply_review_queue.py
```

## Safety invariants

The review workflow keeps:

```json
"draft_only": true,
"requires_human_review": true
```

This prevents review approval from being confused with posting permission. Approval means “eligible for a later posting workflow,” not “posted.”
