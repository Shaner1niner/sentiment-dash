#!/usr/bin/env python
from __future__ import annotations

import json
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DRAFT = ROOT / "scripts" / "draft_seta_social_reply.py"
DAILY = ROOT / "reply_agent" / "daily_context" / "seta_daily_context_latest.json"
NARR = ROOT / "reply_agent" / "narrative_context" / "seta_narrative_context_latest.json"


def run_case(platform: str, comment: str) -> dict:
    cmd = [sys.executable, str(DRAFT), "--platform", platform, "--comment", comment]
    proc = subprocess.run(cmd, cwd=str(ROOT), capture_output=True, text=True)
    if proc.returncode != 0:
        print(proc.stdout)
        print(proc.stderr)
        raise SystemExit(f"[ERROR] draft command failed for {comment!r}")
    try:
        return json.loads(proc.stdout)
    except Exception as exc:
        print(proc.stdout)
        raise SystemExit(f"[ERROR] could not parse JSON output: {exc}")


def require(cond: bool, msg: str) -> None:
    if not cond:
        raise SystemExit(f"[FAIL] {msg}")
    print(f"[OK] {msg}")


def main() -> int:
    print("=" * 80)
    print("SETA reply context layers v1 smoke test")
    print("=" * 80)
    require(DRAFT.exists(), "found draft reply script")
    require(DAILY.exists(), "found latest daily context")
    require(NARR.exists(), "found latest narrative context")

    btc = run_case("x", "Why is $BTC ranked so high today and what is the narrative?")
    require(btc.get("detected_term") == "BTC", "BTC detected")
    require(btc.get("requires_human_review") is True, "BTC requires human review")
    require(bool((btc.get("context") or {}).get("daily")), "BTC daily context attached")
    require(bool((btc.get("context") or {}).get("narrative")), "BTC narrative context attached")
    require("narrative" in (btc.get("draft_reply") or "").lower() or "daily" in (btc.get("draft_reply") or "").lower(), "BTC reply uses context wording")

    eth = run_case("reddit", "Is $ETH financial advice or a buy signal?")
    require(eth.get("detected_term") == "ETH", "ETH detected")
    require(eth.get("reply_type") == "financial_advice_boundary", "ETH financial advice boundary still works")
    require(eth.get("risk_level") == "high", "ETH high risk boundary")
    require(bool((eth.get("context") or {}).get("daily")), "ETH daily context attached")
    require(bool((eth.get("context") or {}).get("narrative")), "ETH narrative context attached")

    sol = run_case("bsky", "What regime is $SOL in here?")
    require(sol.get("detected_term") == "SOL", "SOL detected")
    require(bool((sol.get("context") or {}).get("daily")), "SOL daily context attached")
    require(sol.get("requires_human_review") is True, "SOL requires human review")

    aapl = run_case("reddit", "What changed in the $AAPL narrative?")
    require(aapl.get("detected_term") == "AAPL", "AAPL detected")
    require(bool((aapl.get("context") or {}).get("daily")), "AAPL daily context attached")
    require(bool((aapl.get("context") or {}).get("narrative")), "AAPL narrative context attached")

    print("=" * 80)
    print("PASSED")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
