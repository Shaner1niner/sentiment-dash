# SETA Pipeline Ops v1

This pack adds day-to-day operational helpers for the SETA content system.

## Files

```text
run_seta_content_pipeline_daily.bat
run_seta_content_pipeline_daily_with_reply_queue.bat
README_SETA_CONTENT_SYSTEM_MAP.md
```

## Install

Copy the files into:

```text
C:\Users\shane\sentiment-dash
```

## Daily use

Double-click:

```text
run_seta_content_pipeline_daily.bat
```

Or from terminal:

```bat
cd C:\Users\shane\sentiment-dash
run_seta_content_pipeline_daily.bat
```

## Optional reply queue

```bat
run_seta_content_pipeline_daily_with_reply_queue.bat
```

This runs:

```bat
python scripts\run_seta_content_pipeline.py --include-reply-queue
```

## Commit

```bat
git add run_seta_content_pipeline_daily.bat run_seta_content_pipeline_daily_with_reply_queue.bat README_SETA_CONTENT_SYSTEM_MAP.md README_SETA_PIPELINE_OPS.md
git commit -m "Add SETA content pipeline ops helpers"
git push origin main
```
