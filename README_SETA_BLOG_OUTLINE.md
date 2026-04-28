# SETA Blog Outline Generator v1

This builds draft-only blog outlines from the daily SETA content system.

Inputs:

```text
reply_agent/content_packets/seta_daily_content_packet_YYYY-MM-DD.json
reply_agent/website_snippets/seta_website_snippets_latest.json
agent_reference/seta_style_guide_v2_2.json
```

Outputs:

```text
reply_agent/blog_outlines/seta_blog_outline_YYYY-MM-DD.md
reply_agent/blog_outlines/seta_blog_outline_YYYY-MM-DD.json
reply_agent/blog_outlines/seta_blog_outline_latest.md
reply_agent/blog_outlines/seta_blog_outline_latest.json
```

The output is designed to become a blog draft, newsletter skeleton, or member note outline.

## What it does

The builder selects:

```text
lead asset
supporting assets
working thesis
core angle
watch conditions
SETA read lines
suggested close
editorial guardrails
```

It does not post or call any external service.

## Run

```bat
cd C:\Users\shane\sentiment-dash

python scripts\smoke_seta_blog_outline.py
python scripts\build_seta_blog_outline.py
notepad reply_agent\blog_outlines\seta_blog_outline_latest.md
```

## Commit

```bat
git add .gitignore scripts\build_seta_blog_outline.py scripts\smoke_seta_blog_outline.py README_SETA_BLOG_OUTLINE.md
git commit -m "Add SETA blog outline generator"
git push origin main
```

## Suggested .gitignore

Generated blog outlines should stay local unless intentionally published:

```text
reply_agent/blog_outlines/
```
