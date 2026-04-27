# SETA Social Reply Agent - Draft Mode v1

This package adds a draft-only social reply layer for SETA/Market Tape data. It is designed for safe review workflows before any platform-specific posting is introduced.

## What it does

`draft_seta_social_reply.py` reads:

- an incoming comment from X, Bluesky, Reddit, or a generic source
- `fix26_screener_store.json`
- `agent_reference/seta_agent_reference.json`
- `agent_reference/seta_reply_guidance.md`
- `agent_reference/seta_reply_examples.jsonl`

It returns a structured JSON object:

```json
{
  "should_reply": true,
  "detected_term": "BTC",
  "reply_type": "educational_signal_context",
  "risk_level": "low",
  "draft_reply": "...",
  "reasoning_summary": "...",
  "requires_human_review": true
}
```

## Important guardrail

This is draft-only. It does not post to X, Bluesky, Reddit, or any API. Every output requires human review by default.

## Install

From Downloads after unzipping:

```bat
cd C:\Users\shane\Downloads
python seta_reply_agent_draft_mode_pack\install_seta_reply_agent_draft_mode.py
```

## Smoke test

```bat
cd C:\Users\shane\sentiment-dash
python scripts\smoke_seta_reply_agent.py
```

## Example usage

```bat
python scripts\draft_seta_social_reply.py --platform x --comment "Why is $BTC ranked high today?"
```

With explicit term:

```bat
python scripts\draft_seta_social_reply.py --platform reddit --term ETH --comment "Is this financial advice or should I buy here?"
```

## Commit

```bat
git add scripts\draft_seta_social_reply.py scripts\smoke_seta_reply_agent.py reply_agent README_SETA_REPLY_AGENT.md
git commit -m "Add SETA social reply draft mode"
git push origin main
```
