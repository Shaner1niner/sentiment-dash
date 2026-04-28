# SETA Narrative TF-IDF Context v1

This layer converts the daily TF-IDF narrative exports into a compact JSON object for the SETA reply-agent workflow.

It reads:

```text
seta_narrative_summary_*.json
seta_narrative_top_keywords_*.json
seta_narrative_top_lifts_*.json
```

It writes:

```text
reply_agent/narrative_context/seta_narrative_context_latest.json
reply_agent/narrative_context/seta_narrative_context_YYYY-MM-DD.json
```

The output explains the live discussion layer for each asset:

- narrative regime
- narrative coherence score
- top TF-IDF keywords
- highest-lift keywords versus the prior window
- a short `reply_note` suitable for draft replies

This is not a trading signal by itself. It should support replies about what the current asset narrative is about, especially when users ask why attention is up, what changed, or why a setup feels noisy.

## Smoke test

```bat
cd C:\Users\shane\sentiment-dash
python scripts\smoke_seta_narrative_context.py
```

## Build production context

```bat
python scripts\build_seta_narrative_context.py
```

Optional explicit source directory:

```bat
python scripts\build_seta_narrative_context.py --source-dir "G:\My Drive\SETA_AutoSync"
```

## Git

Commit only source files:

```bat
git add scripts\build_seta_narrative_context.py scripts\smoke_seta_narrative_context.py README_SETA_NARRATIVE_CONTEXT.md
git commit -m "Add SETA narrative TF-IDF context builder"
git push origin main
```

Generated runtime files should stay local:

```text
reply_agent/narrative_context/
```
