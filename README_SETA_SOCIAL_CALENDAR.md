# SETA Social Content Calendar v1

This builds draft-only social post candidates from the SETA content stack.

Inputs:

```text
reply_agent/blog_drafts/seta_blog_draft_latest.json
reply_agent/website_snippets/seta_website_snippets_latest.json
reply_agent/blog_outlines/seta_blog_outline_latest.json
agent_reference/seta_style_guide_v2_2.json
```

Outputs:

```text
reply_agent/social_calendar/seta_social_calendar_YYYY-MM-DD.json
reply_agent/social_calendar/seta_social_calendar_YYYY-MM-DD.csv
reply_agent/social_calendar/seta_social_calendar_YYYY-MM-DD.md
reply_agent/social_calendar/seta_social_calendar_latest.json
reply_agent/social_calendar/seta_social_calendar_latest.md
```

## Purpose

Use this for manually reviewed social candidates across:

```text
X
Bluesky
Reddit
```

It does not post anything.

Each row is:

```text
draft_only: true
posting_performed: false
requires_human_review: true
status: pending
```

## Run

```bat
cd C:\Users\shane\sentiment-dash

python scripts\smoke_seta_social_calendar.py
python scripts\build_seta_social_calendar.py
notepad reply_agent\social_calendar\seta_social_calendar_latest.md
```

## Commit

```bat
git add .gitignore scripts\build_seta_social_calendar.py scripts\smoke_seta_social_calendar.py README_SETA_SOCIAL_CALENDAR.md
git commit -m "Add SETA social content calendar"
git push origin main
```

## Suggested .gitignore

Generated calendars should stay local unless intentionally published:

```text
reply_agent/social_calendar/
```
