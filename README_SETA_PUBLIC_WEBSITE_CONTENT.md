# SETA Public Website Content v1

This adds a public-safe website content publishing step.

## Why

The pipeline already generates website explanation snippets under:

```text
reply_agent/website_snippets/
```

Those are runtime/internal artifacts. This publisher creates a clean public copy at:

```text
public_content/seta_website_snippets_latest.json
public_content/seta_website_snippets_latest.md
```

The website/dashboard can consume this stable public path.

## Safety

The public publisher:

```text
removes internal paths
keeps only public-facing snippet fields
preserves posting_performed=false
marks payload public_safe=true
keeps SETA risk language
```

## Install

```bat
copy scripts\publish_seta_public_website_content.py C:\Users\shane\sentiment-dash\scripts\
copy scripts\smoke_seta_public_website_content.py C:\Users\shane\sentiment-dash\scripts\
copy patch_seta_content_pipeline_public_website_step.py C:\Users\shane\sentiment-dash\
copy README_SETA_PUBLIC_WEBSITE_CONTENT.md C:\Users\shane\sentiment-dash\
```

## Run standalone

```bat
cd C:\Users\shane\sentiment-dash
python scripts\publish_seta_public_website_content.py
```

## Patch the pipeline

```bat
python patch_seta_content_pipeline_public_website_step.py
```

After patching, the daily content pipeline includes:

```text
daily content packet
website snippets
blog outline
blog draft
social calendar
public website content
```

## Smoke test

```bat
python scripts\smoke_seta_public_website_content.py
```

## Commit

```bat
git add scripts\publish_seta_public_website_content.py scripts\smoke_seta_public_website_content.py scripts\run_seta_content_pipeline.py README_SETA_PUBLIC_WEBSITE_CONTENT.md public_content\seta_website_snippets_latest.json public_content\seta_website_snippets_latest.md

git commit -m "Add public SETA website content publishing"

git push origin main
```
