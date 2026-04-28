# SETA Blog Draft Generator v1

This builds a draft-only blog/newsletter article from the SETA blog outline.

Inputs:

```text
reply_agent/blog_outlines/seta_blog_outline_latest.json
reply_agent/website_snippets/seta_website_snippets_latest.json
agent_reference/seta_style_guide_v2_2.json
```

Outputs:

```text
reply_agent/blog_drafts/seta_blog_draft_YYYY-MM-DD.md
reply_agent/blog_drafts/seta_blog_draft_YYYY-MM-DD.json
reply_agent/blog_drafts/seta_blog_draft_latest.md
reply_agent/blog_drafts/seta_blog_draft_latest.json
```

## Purpose

The blog draft is intended as a human-reviewed starting draft for:

- Website blog posts.
- Member notes.
- Newsletter drafts.
- Long-form social threads.

It is not posted automatically.

## Run

```bat
cd C:\Users\shane\sentiment-dash

python scripts\smoke_seta_blog_draft.py
python scripts\build_seta_blog_draft.py
notepad reply_agent\blog_drafts\seta_blog_draft_latest.md
```

## Commit

```bat
git add .gitignore scripts\build_seta_blog_draft.py scripts\smoke_seta_blog_draft.py README_SETA_BLOG_DRAFT.md
git commit -m "Add SETA blog draft generator"
git push origin main
```

## Suggested .gitignore

Generated drafts should stay local unless intentionally published:

```text
reply_agent/blog_drafts/
```
