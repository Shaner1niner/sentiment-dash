# SETA Daily Content Packet v1

This layer converts SETA's existing context stack into daily product/content material.

It is designed for product quality, not subscriber metrics.

## Inputs

```text
reply_agent/daily_context/seta_daily_context_latest.json
reply_agent/narrative_context/seta_narrative_context_latest.json
agent_reference/seta_style_guide_v2_2.json
```

## Outputs

```text
reply_agent/content_packets/seta_daily_content_packet_YYYY-MM-DD.json
reply_agent/content_packets/seta_daily_content_packet_YYYY-MM-DD.md
reply_agent/content_packets/seta_daily_content_packet_YYYY-MM-DD.csv
```

## Run

```bat
cd C:\Users\shane\sentiment-dash
python scripts\smoke_seta_daily_content_packet.py
python scripts\build_seta_daily_content_packet.py
```

## Commit source files only

```bat
git add .gitignore agent_reference\SETA_STYLE_GUIDE_v2_2.md agent_reference\seta_style_guide_v2_2.json scripts\build_seta_daily_content_packet.py scripts\smoke_seta_daily_content_packet.py README_SETA_DAILY_CONTENT_PACKET.md
git commit -m "Add SETA daily content packet"
git push origin main
```
