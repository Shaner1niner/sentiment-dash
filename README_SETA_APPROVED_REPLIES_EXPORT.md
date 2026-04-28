# SETA Approved Replies Export v1

This layer exports only `status=approved` rows from a reviewed SETA reply queue.

It is a safe handoff step between:

```text
draft queue -> review queue -> approved-only export -> future platform connector
```

## Files

```text
scripts/export_seta_approved_replies.py
scripts/smoke_seta_approved_replies_export.py
README_SETA_APPROVED_REPLIES_EXPORT.md
```

## Safety behavior

This script does **not** post to X, Bluesky, Reddit, or any API.

By default, every exported row includes:

```json
{
  "status": "approved",
  "ready_for_posting": false,
  "posting_performed": false,
  "requires_human_review": true,
  "posting_guardrail": "Approved for manual posting export only; no API posting performed."
}
```

`ready_for_posting` can only be set to true with an explicit CLI flag, and even then this script still does not post.

## Smoke test

```bat
cd C:\Users\shane\sentiment-dash
python scripts\smoke_seta_approved_replies_export.py
```

## Manual use

First build drafts:

```bat
python scripts\build_seta_reply_draft_queue.py --input reply_agent\sample_inputs\sample_queue_comments.jsonl
```

Then review one of the generated draft queues:

```bat
python scripts\review_seta_reply_queue.py ^
  --input reply_agent\draft_queue\seta_reply_drafts_YYYYMMDD_HHMMSS.jsonl ^
  --approve 1,3 ^
  --reject 2 ^
  --reviewed-by shane ^
  --note "manual review"
```

Then export only approved replies:

```bat
python scripts\export_seta_approved_replies.py ^
  --input reply_agent\review_queue\seta_reply_reviewed_YYYYMMDD_HHMMSS.jsonl
```

Output:

```text
reply_agent\approved_replies\seta_approved_replies_YYYYMMDD_HHMMSS.jsonl
reply_agent\approved_replies\seta_approved_replies_YYYYMMDD_HHMMSS.csv
```

## Git

Commit the source files only:

```bat
git add scripts\export_seta_approved_replies.py scripts\smoke_seta_approved_replies_export.py README_SETA_APPROVED_REPLIES_EXPORT.md .gitignore
git commit -m "Add SETA approved replies export"
git push origin main
```

Generated files under `reply_agent\approved_replies\` should stay local.
