# SETA Daily Context v1

Adds a compact daily market-regime context layer for the SETA social reply agent.

## Purpose

The draft reply agent already has signal-stack context from `fix26_screener_store.json`. This layer adds daily SETA narrative context from:

- `G:\My Drive\SETA_AutoSync\outputs\summaries\SETA_crypto_analysis_*_summary.json`
- `G:\My Drive\SETA_AutoSync\outputs\summaries\SETA_equities_analysis_*_summary.json`
- `G:\My Drive\SETA_AutoSync\outputs\crypto\SETA_crypto_analysis_*.md`
- `G:\My Drive\SETA_AutoSync\outputs\equities\SETA_equities_analysis_*.docx`

It produces:

- `reply_agent\daily_context\seta_daily_context_latest.json`
- `reply_agent\daily_context\seta_daily_context_YYYY-MM-DD.json`

## Install

```bat
cd C:\Users\shane\Downloads
python seta_daily_context_v1_pack\install_seta_daily_context_v1.py
```

## Smoke test

```bat
cd C:\Users\shane\sentiment-dash
python scripts\smoke_seta_daily_context.py
```

## Build production daily context

```bat
python scripts\build_seta_daily_context.py
```

## Optional patch to draft reply script

```bat
python patch_seta_daily_context_into_reply_v1.py
```

Generated daily context files are runtime outputs. Commit them only if you want a sample snapshot in Git.
