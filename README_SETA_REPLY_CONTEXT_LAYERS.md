# SETA Reply Context Layers v1

This patch upgrades `scripts/draft_seta_social_reply.py` so draft replies can use three context layers:

1. Screener context from `fix26_screener_store.json`.
2. Daily context from `reply_agent/daily_context/seta_daily_context_latest.json`.
3. Narrative TF-IDF context from `reply_agent/narrative_context/seta_narrative_context_latest.json`.

The patch keeps draft mode intact. It never posts to X, Bluesky, Reddit, or any API. Every generated reply still returns `requires_human_review: true`.

## Design

The screener remains the default anchor. Daily context adds regime/decision-pressure framing. Narrative TF-IDF context is used selectively for narrative, attention, keyword, and what-changed questions.

## Install

From Downloads:

```bat
copy patch_seta_reply_context_layers_v1.py C:\Users\shane\sentiment-dash\
copy smoke_seta_reply_context_layers_v1.py C:\Users\shane\sentiment-dash\scripts\
copy README_SETA_REPLY_CONTEXT_LAYERS.md C:\Users\shane\sentiment-dash\

cd C:\Users\shane\sentiment-dash
python patch_seta_reply_context_layers_v1.py
python scripts\smoke_seta_reply_context_layers_v1.py
```

## Manual tests

```bat
python scripts\draft_seta_social_reply.py --platform x --comment "Why is $BTC ranked so high today and what is the narrative?"
python scripts\draft_seta_social_reply.py --platform reddit --comment "Is $ETH financial advice or a buy signal?"
python scripts\draft_seta_social_reply.py --platform bsky --comment "What regime is $SOL in here?"
```

## Commit

```bat
git add scripts\draft_seta_social_reply.py scripts\smoke_seta_reply_context_layers_v1.py README_SETA_REPLY_CONTEXT_LAYERS.md .gitignore
git commit -m "Add SETA reply context layers"
git push origin main
```
