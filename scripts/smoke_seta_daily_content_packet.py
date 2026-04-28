#!/usr/bin/env python
import json, subprocess, sys
from pathlib import Path
REPO_ROOT=Path(__file__).resolve().parents[1]
SCRIPT=REPO_ROOT/"scripts"/"build_seta_daily_content_packet.py"
DAILY=REPO_ROOT/"reply_agent"/"daily_context"/"seta_daily_context_latest.json"
STYLE=REPO_ROOT/"agent_reference"/"seta_style_guide_v2_2.json"
OUT_DIR=REPO_ROOT/"reply_agent"/"content_packets"/"_smoke"
def fail(x): print("[ERROR]",x); raise SystemExit(1)
def ok(x): print("[OK]",x)
print("="*72); print("SETA daily content packet smoke test"); print("="*72)
for p,label in [(SCRIPT,"content packet builder"),(DAILY,"daily context latest"),(STYLE,"style guide JSON")]:
    if not p.exists(): fail(f"missing {label}: {p}")
    ok(f"found {label}")
proc=subprocess.run([sys.executable,str(SCRIPT),"--out-dir",str(OUT_DIR),"--max-terms","6"],cwd=str(REPO_ROOT),text=True,capture_output=True)
print(proc.stdout)
if proc.returncode!=0:
    print(proc.stderr); fail("builder failed")
packets=sorted(OUT_DIR.glob("seta_daily_content_packet_*.json"),key=lambda p:p.stat().st_mtime,reverse=True)
if not packets: fail("no packet JSON created")
packet_path=packets[0]; packet=json.loads(packet_path.read_text(encoding="utf-8"))
if packet.get("draft_only") is not True: fail("draft_only invariant failed")
if packet.get("posting_performed") is not False: fail("posting_performed should be false")
if not packet.get("rows"): fail("packet has no rows")
row=packet["rows"][0]
for k in ["term","content_angle","social_hook","website_note"]:
    if not row.get(k): fail(f"first row missing {k}")
if not packet_path.with_suffix(".md").exists(): fail("markdown packet missing")
if not packet_path.with_suffix(".csv").exists(): fail("csv packet missing")
ok(f"packet rows: {len(packet['rows'])}"); ok("draft-only and no-posting invariants hold"); ok("JSON/MD/CSV outputs exist")
print("="*72); print("PASSED")
