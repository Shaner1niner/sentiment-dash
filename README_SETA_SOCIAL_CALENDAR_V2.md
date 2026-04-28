# SETA Social Calendar v2 — Platform Voice Polish

This patch improves the existing social calendar builder.

It keeps the v1 draft-only workflow and adds platform-specific polish:

## Improvements

- X: shorter, sharper, more concise.
- Bluesky: more conversational and explanatory.
- Reddit: paragraph-structured and easier to read.
- Markdown review: draft posts now render in code fences.
- Compact SETA read lines for social.
- Smoke test checks platform character limits and safety language.

## Run

```bat
cd C:\Users\shane\sentiment-dash

python patch_seta_social_calendar_v2.py
python scripts\smoke_seta_social_calendar_v2.py
python scripts\build_seta_social_calendar.py
notepad reply_agent\social_calendar\seta_social_calendar_latest.md
```

## Commit

```bat
git add scripts\build_seta_social_calendar.py scripts\smoke_seta_social_calendar_v2.py README_SETA_SOCIAL_CALENDAR_V2.md
git commit -m "Polish SETA social calendar platform voice"
git push origin main
```
