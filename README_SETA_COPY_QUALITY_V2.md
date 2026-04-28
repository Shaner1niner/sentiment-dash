# SETA Copy Quality v2 — Editorial Synthesis

This is the stronger product-quality pass for website explanation snippets.

It reflects SETA Style Guide v2.2 more fully than v1 by adding editorial synthesis instead of simply cleaning labels.

## What it adds

- Copy archetype classification.
- Theme compression for TF-IDF keywords.
- Crypto/equity-specific explanatory grammar.
- Multi-length product copy:
  - headline
  - one_liner
  - short_explanation
  - expanded_explanation
  - social_blurb
- Less label-like public copy.
- Raw fields remain available for audit/debug.

## Run

```bat
cd C:\Users\shane\sentiment-dash

python patch_seta_copy_quality_v2.py
python scripts\smoke_seta_copy_quality_v2.py
python scripts\build_seta_website_snippets.py
```

## Commit

```bat
git add scripts\build_seta_website_snippets.py scripts\smoke_seta_copy_quality_v2.py README_SETA_COPY_QUALITY_V2.md
git commit -m "Add SETA website copy editorial synthesis"
git push origin main
```
