# SETA Content Pipeline Runner v1

This creates one daily command for the draft-only SETA content pipeline.

## Pipeline order

```text
daily content packet
website snippets
blog outline
blog draft
social content calendar
```

Optional:

```text
reply draft queue
```

## Outputs

```text
reply_agent/pipeline_runs/seta_content_pipeline_run_YYYY-MM-DD_HHMMSS.json
reply_agent/pipeline_runs/seta_content_pipeline_run_YYYY-MM-DD_HHMMSS.md
reply_agent/pipeline_runs/seta_content_pipeline_run_latest.json
reply_agent/pipeline_runs/seta_content_pipeline_run_latest.md
```

## Safety

The runner validates:

```text
draft_only: true
posting_performed: false
row-level requires_human_review where rows exist
row-level posting_performed=false where rows exist
```

It does not post anything.

## Run

```bat
cd C:\Users\shane\sentiment-dash

python scripts\smoke_seta_content_pipeline.py
python scripts\run_seta_content_pipeline.py
notepad reply_agent\pipeline_runs\seta_content_pipeline_run_latest.md
```

Optional reply queue:

```bat
python scripts\run_seta_content_pipeline.py --include-reply-queue
```

## Commit

```bat
git add .gitignore scripts\run_seta_content_pipeline.py scripts\smoke_seta_content_pipeline.py README_SETA_CONTENT_PIPELINE.md
git commit -m "Add SETA content pipeline runner"
git push origin main
```

## Suggested .gitignore

```text
reply_agent/pipeline_runs/
```
