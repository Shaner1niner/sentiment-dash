# SETA Agent Reference Pack

This bundle packages SETA glossary/docs for future AI agents that parse screener data and craft social media replies on Bluesky, X, Reddit, or similar platforms.

## Recommended use
- Use `agent_reference/seta_agent_reference.json` as the primary machine-readable reference.
- Use `agent_reference/seta_reply_guidance.md` as the behavior/tone/policy layer.
- Use `agent_reference/seta_reply_examples.jsonl` as few-shot reply examples.
- Use the files in `docs/` as human-readable source/audit references.

## Suggested repo layout
```text
sentiment-dash/
  docs/
    SETA_Screener_Output_Glossary.xlsx
    SETA_Screener_All_Column_Descriptions.csv
    SETA_Score_Glossary.csv
    SETA_Archetype_Glossary.csv
    SETA_Indicator_Family_Glossary.csv
  agent_reference/
    seta_agent_reference.json
    seta_metric_dictionary.json
    seta_archetype_dictionary.json
    seta_indicator_family_dictionary.json
    seta_reply_guidance.md
    seta_reply_examples.jsonl
    seta_reference_manifest.json
```

## Agent rule of thumb
Explain SETA signals as context. Do not present signals as financial advice, guaranteed outcomes, or deterministic predictions.
