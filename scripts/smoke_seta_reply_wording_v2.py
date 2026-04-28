#!/usr/bin/env python
from __future__ import annotations

import json
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DRAFT = ROOT / "scripts" / "draft_seta_social_reply.py"


def run_case(platform: str, comment: str) -> dict:
    cmd = [sys.executable, str(DRAFT), "--platform", platform, "--comment", comment]
    proc = subprocess.run(cmd, cwd=str(ROOT), capture_output=True, text=True)
    if proc.returncode != 0:
        print(proc.stdout)
        print(proc.stderr)
        raise SystemExit(f"[ERROR] draft command failed for {comment!r}")
    if "NaN" in proc.stdout:
        print(proc.stdout)
        raise SystemExit("[FAIL] JSON output still contains NaN")
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
    print("SETA reply wording v2 smoke test")
    print("=" * 80)
    require(DRAFT.exists(), "found draft reply script")

    btc = run_case("x", "Why is $BTC ranked so high today and what is the narrative?")
    btc_reply = btc.get("draft_reply", "")
    require(btc.get("detected_term") == "BTC", "BTC detected")
    require("cost basis" in btc_reply.lower() or "cost-basis" in btc_reply.lower(), "BTC reply keeps cost-basis narrative")
    require("basis, and cost basis" not in btc_reply.lower(), "BTC reply avoids awkward basis duplication")
    require("Bollinger 80.2" not in btc_reply, "BTC reply buckets Bollinger score")
    require(bool((btc.get("context") or {}).get("daily")), "BTC daily context still attached")
    require(bool((btc.get("context") or {}).get("narrative")), "BTC narrative context still attached")

    eth = run_case("reddit", "Is $ETH financial advice or a buy signal?")
    eth_reply = eth.get("draft_reply", "")
    require(eth.get("reply_type") == "financial_advice_boundary", "ETH financial advice boundary still works")
    require("not financial advice" in eth_reply.lower(), "ETH reply preserves advice boundary")
    require("Bollinger 76.5" not in eth_reply, "ETH reply buckets Bollinger score")

    sol = run_case("bsky", "What regime is $SOL in here?")
    require(sol.get("intent") == "market_regime_question", "SOL classified as regime question")
    require(bool((sol.get("context") or {}).get("daily")), "SOL daily context attached")
    require(sol.get("requires_human_review") is True, "SOL requires human review")

    aapl = run_case("reddit", "What changed in the $AAPL narrative?")
    require(aapl.get("detected_term") == "AAPL", "AAPL detected")
    require("NaN" not in json.dumps(aapl), "AAPL context sanitized of NaN")
    require(bool((aapl.get("context") or {}).get("narrative")), "AAPL narrative context still attached")

    print("=" * 80)
    print("PASSED")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
