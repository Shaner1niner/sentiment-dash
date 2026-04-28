# SETA Content System Map v1

This document maps the current SETA content and reply pipeline.

The system is intentionally **draft-only**. It does not post to X, Bluesky, Reddit, or the website automatically.

## Core safety posture

Every production-facing content artifact should preserve:

```text
draft_only: true
posting_performed: false
requires_human_review: true where rows are actionable
```

SETA’s voice rule remains:

```text
SETA explains behavior beneath price.
It does not predict.
It does not issue trade signals.
It does not give financial advice.
```

## Daily content chain

```text
SETA data / screener outputs
        ↓
daily context
        ↓
narrative context
        ↓
style guide
        ↓
daily content packet
        ↓
website snippets
        ↓
blog outline
        ↓
blog draft
        ↓
social content calendar
```

## Primary daily command

```bat
cd C:\Users\shane\sentiment-dash
python scripts\run_seta_content_pipeline.py
```

One-click Windows runner:

```bat
run_seta_content_pipeline_daily.bat
```

Optional version with reply queue:

```bat
run_seta_content_pipeline_daily_with_reply_queue.bat
```

## Pipeline runner

Script:

```text
scripts/run_seta_content_pipeline.py
```

Smoke test:

```text
scripts/smoke_seta_content_pipeline.py
```

Output:

```text
reply_agent/pipeline_runs/seta_content_pipeline_run_latest.json
reply_agent/pipeline_runs/seta_content_pipeline_run_latest.md
```

Purpose:

```text
Runs the full draft-only content chain.
Stops on failure unless --continue-on-error is supplied.
Validates top-level safety flags.
Validates row-level action safety where rows are actionable.
Writes a run report for audit/review.
```

## Major artifacts

### 1. Daily content packet

Script:

```text
scripts/build_seta_daily_content_packet.py
```

Output:

```text
reply_agent/content_packets/seta_daily_content_packet_latest.json
reply_agent/content_packets/seta_daily_content_packet_YYYY-MM-DD.json
reply_agent/content_packets/seta_daily_content_packet_YYYY-MM-DD.md
reply_agent/content_packets/seta_daily_content_packet_YYYY-MM-DD.csv
```

Purpose:

```text
Combines daily context, narrative context, and style guide into an agent-readable packet.
```

### 2. Website snippets

Script:

```text
scripts/build_seta_website_snippets.py
```

Output:

```text
reply_agent/website_snippets/seta_website_snippets_latest.json
reply_agent/website_snippets/seta_website_snippets_latest.md
reply_agent/website_snippets/seta_website_snippets_YYYY-MM-DD.json
reply_agent/website_snippets/seta_website_snippets_YYYY-MM-DD.csv
reply_agent/website_snippets/seta_website_snippets_YYYY-MM-DD.md
```

Purpose:

```text
Creates website/dashboard explanation copy by asset.
```

Editorial layer added:

```text
copy_archetype
narrative_theme
headline
one_liner
public_note
short_explanation
expanded_explanation
watch_condition
seta_read_line
social_blurb
```

### 3. Blog outline

Script:

```text
scripts/build_seta_blog_outline.py
```

Output:

```text
reply_agent/blog_outlines/seta_blog_outline_latest.json
reply_agent/blog_outlines/seta_blog_outline_latest.md
```

Purpose:

```text
Selects lead asset, supporting assets, working thesis, core angle, and article structure.
```

### 4. Blog draft

Script:

```text
scripts/build_seta_blog_draft.py
```

Output:

```text
reply_agent/blog_drafts/seta_blog_draft_latest.json
reply_agent/blog_drafts/seta_blog_draft_latest.md
```

Purpose:

```text
Turns the outline into a human-reviewable draft article/member note.
```

Latest polish:

```text
Narrative variety
Less repetitive support sections
Synthesis section
Archetype-specific supporting paragraphs
```

### 5. Social content calendar

Script:

```text
scripts/build_seta_social_calendar.py
```

Output:

```text
reply_agent/social_calendar/seta_social_calendar_latest.json
reply_agent/social_calendar/seta_social_calendar_latest.csv
reply_agent/social_calendar/seta_social_calendar_latest.md
```

Purpose:

```text
Creates draft candidates for X, Bluesky, and Reddit.
```

Latest polish:

```text
X: shorter, sharper
Bluesky: more conversational
Reddit: paragraph-structured
Markdown review uses fenced draft blocks
```

### 6. Reply queue and review workflow

Scripts:

```text
scripts/build_seta_reply_draft_queue.py
scripts/review_seta_reply_queue.py
```

Smoke tests:

```text
scripts/smoke_seta_reply_queue.py
scripts/smoke_seta_reply_review_queue.py
```

Purpose:

```text
Turns comment inputs into draft replies and reviewable approval/rejection packets.
```

Safety:

```text
All reply rows require human review.
No auto-posting.
```

## Style and voice files

Primary style guide:

```text
agent_reference/SETA_STYLE_GUIDE_v2_2.md
agent_reference/seta_style_guide_v2_2.json
```

Core rules:

```text
Crypto ≠ stocks.
Sentiment is context, not trigger.
Attention does not equal validation.
Prefer "reads as", "suggests", "we are watching whether".
Avoid prediction language.
Use yes-and framing where useful.
```

## Local runtime outputs

These are generated outputs and should normally stay out of git:

```text
reply_agent/content_packets/
reply_agent/website_snippets/
reply_agent/blog_outlines/
reply_agent/blog_drafts/
reply_agent/social_calendar/
reply_agent/pipeline_runs/
reply_agent/draft_queue/
reply_agent/review_queue/
```

Some source/reference inputs may be intentionally committed later, but runtime outputs should remain local unless explicitly publishing them.

## Recommended daily workflow

```bat
cd C:\Users\shane\sentiment-dash

python scripts\run_seta_content_pipeline.py

notepad reply_agent\pipeline_runs\seta_content_pipeline_run_latest.md
notepad reply_agent\blog_drafts\seta_blog_draft_latest.md
notepad reply_agent\social_calendar\seta_social_calendar_latest.md
```

Or simply run:

```bat
run_seta_content_pipeline_daily.bat
```

## Recommended next product decisions

1. Decide whether website snippets should be published to the public dashboard as JSON.
2. Decide whether social calendar outputs should feed a manual posting app or remain file-based.
3. Add richer topic/theme normalization for TF-IDF narrative clusters.
4. Add a “weekly digest” generator using the same artifacts.
5. Add a human review UI later if file review becomes too slow.

## Current state

The system is now operational as a complete draft-only editorial pipeline.

```text
data → context → product copy → blog draft → social candidates → run audit
```
