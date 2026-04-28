# SETA Copy Quality v3 — Presentation + Variety

This patch improves how the website snippets read in Markdown/product review.

It builds on Copy Quality v2, which added editorial synthesis, and focuses on presentation:

- Less repetitive body copy.
- Compact `SETA read` lines.
- Archetype-specific `Watch condition` lines.
- Reader-facing `public_note`.
- Markdown that reads like a product note instead of a debug dump.
- Raw JSON fields remain available for the website/frontend.

## Run

```bat
cd C:\Users\shane\sentiment-dash

python patch_seta_copy_quality_v3.py
python scripts\smoke_seta_copy_quality_v3.py
python scripts\build_seta_website_snippets.py
```

Then inspect:

```bat
notepad reply_agent\website_snippets\seta_website_snippets_2026-04-27.md
```

## Commit

```bat
git add scripts\build_seta_website_snippets.py scripts\smoke_seta_copy_quality_v3.py README_SETA_COPY_QUALITY_V3.md
git commit -m "Polish SETA website snippet presentation"
git push origin main
```
