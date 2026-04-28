# SETA Manual Posting Packet v1

This layer turns approved SETA reply exports into copy/paste-ready manual posting packets.

It is still **not** an auto-poster. It does not call X, Bluesky, Reddit, or any API.

## Pipeline position

```text
draft queue
→ review queue
→ approved-only export
→ manual posting packet
→ human copy/paste
```

## Files

```text
scripts/build_seta_manual_posting_packet.py
scripts/smoke_seta_manual_posting_packet.py
README_SETA_MANUAL_POSTING_PACKET.md
```

## Output

The packet builder creates:

```text
reply_agent/manual_posting_packets/
  seta_manual_posting_packet_YYYYMMDD_HHMMSS.jsonl
  seta_manual_posting_packet_YYYYMMDD_HHMMSS.csv
  x_manual_packet_YYYYMMDD_HHMMSS.csv
  bsky_manual_packet_YYYYMMDD_HHMMSS.csv
  reddit_manual_packet_YYYYMMDD_HHMMSS.csv
```

Platform-specific CSV files are only created when there are rows for that platform.

## Safety fields

Every row includes:

```json
{
  "manual_posting_status": "not_posted",
  "posting_performed": false,
  "ready_for_posting": false,
  "requires_human_review": true,
  "posting_guardrail": "Manual posting packet only; no API posting performed."
}
```

## Smoke test

```bat
cd C:\Users\shane\sentiment-dash
python scripts\smoke_seta_manual_posting_packet.py
```

## Manual use

```bat
python scripts\build_seta_manual_posting_packet.py ^
  --input reply_agent\approved_replies\seta_approved_replies_YYYYMMDD_HHMMSS.jsonl
```

## Git

Commit source files only:

```bat
git add .gitignore scripts\build_seta_manual_posting_packet.py scripts\smoke_seta_manual_posting_packet.py README_SETA_MANUAL_POSTING_PACKET.md
git commit -m "Add SETA manual posting packet"
git push origin main
```

Generated files under `reply_agent/manual_posting_packets/` should stay local.
