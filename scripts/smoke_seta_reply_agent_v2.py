from __future__ import annotations

import json
import subprocess
import sys
from pathlib import Path

ROOT = Path(r"C:\Users\shane\sentiment-dash")
SCRIPT = ROOT / "scripts" / "draft_seta_social_reply.py"


def run(comment: str):
    out = subprocess.check_output([sys.executable, str(SCRIPT), "--platform", "x", "--comment", comment], text=True)
    return json.loads(out)


def main():
    print("=" * 60)
    print("SETA reply agent v2 smoke test")
    print("=" * 60)
    btc = run("Why is $BTC ranked so high today?")
    assert btc["detected_term"] == "BTC"
    assert btc["should_reply"] is True
    fams = btc.get("context", {}).get("families", {})
    known = [k for k, v in fams.items() if str(v).lower() != "unknown"]
    print("[OK] BTC detected")
    print(f"[INFO] known family fields: {known}")
    if not known and btc.get("context", {}).get("summary_score") is None:
        raise SystemExit("[ERROR] BTC context still all unknown; inspect fix26_screener_store.json schema.")
    adv = run("Is $ETH financial advice or a buy signal?")
    assert adv["detected_term"] == "ETH"
    assert adv["reply_type"] == "financial_advice_boundary"
    assert adv["requires_human_review"] is True
    print("[OK] ETH financial advice boundary works")
    print("=" * 60)
    print("PASSED")

if __name__ == "__main__":
    main()
