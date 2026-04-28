# SETA Blog Draft v2 — Narrative Variety

This patch improves the existing blog draft generator.

It keeps the v1 draft-only workflow and adds more editorial variation.

## Improvements

- Less repeated language across supporting assets.
- Archetype-specific supporting paragraphs.
- Cleaner lead section with fewer duplicate one-liner/public-note repeats.
- More varied transition language.
- Better SETA-style synthesis section.
- Smoke test checks for repeated phrases.

## Run

```bat
cd C:\Users\shane\sentiment-dash

python patch_seta_blog_draft_v2.py
python scripts\smoke_seta_blog_draft_v2.py
python scripts\build_seta_blog_draft.py
notepad reply_agent\blog_drafts\seta_blog_draft_latest.md
```

## Commit

```bat
git add scripts\build_seta_blog_draft.py scripts\smoke_seta_blog_draft_v2.py README_SETA_BLOG_DRAFT_V2.md
git commit -m "Polish SETA blog draft narrative variety"
git push origin main
```
