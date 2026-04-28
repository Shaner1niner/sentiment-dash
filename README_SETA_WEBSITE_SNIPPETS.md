# SETA Website Explanation Snippets v1

This layer converts the daily content packet into website/dashboard-facing explanation snippets.

It is designed to improve product clarity:

```text
What is SETA seeing here?
Why is this asset flagged?
What is signal versus narrative?
What should the reader watch?
```

## Inputs

```text
reply_agent/content_packets/seta_daily_content_packet_YYYY-MM-DD.json
```

By default the builder uses the latest matching packet in:

```text
reply_agent/content_packets/
```

## Outputs

```text
reply_agent/website_snippets/seta_website_snippets_YYYY-MM-DD.json
reply_agent/website_snippets/seta_website_snippets_latest.json
reply_agent/website_snippets/seta_website_snippets_YYYY-MM-DD.csv
reply_agent/website_snippets/seta_website_snippets_YYYY-MM-DD.md
```

Optional public copy:

```text
public/seta_explain_YYYY-MM-DD.json
public/seta_explain_latest.json
```

Only use `--copy-public` when you want to stage the data for the dashboard frontend.

## Fields

Each snippet includes:

```text
term
universe
headline
short_explanation
regime_note
narrative_note
social_blurb
risk_note
content_angle
asset_state
decision_pressure_rank
structural_state
resolution_skew
narrative_regime
narrative_coherence_bucket
narrative_top_keywords
updated_at
```

## Smoke test

```bat
cd C:\Users\shane\sentiment-dash
python scripts\smoke_seta_website_snippets.py
```

## Build local snippets

```bat
python scripts\build_seta_website_snippets.py
```

## Build and copy to public

```bat
python scripts\build_seta_website_snippets.py --copy-public
```

## Git

Commit source files only:

```bat
git add .gitignore scripts\build_seta_website_snippets.py scripts\smoke_seta_website_snippets.py README_SETA_WEBSITE_SNIPPETS.md
git commit -m "Add SETA website explanation snippets"
git push origin main
```

Generated files under `reply_agent/website_snippets/` should stay local unless you intentionally choose to publish public JSON.
