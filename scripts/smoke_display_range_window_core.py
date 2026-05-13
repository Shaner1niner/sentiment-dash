#!/usr/bin/env python
from __future__ import annotations

import re
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CORE = ROOT / "src" / "core" / "displayRangeWindow.js"


def fail(message: str) -> int:
    print(f"[ERROR] {message}")
    return 1


def main() -> int:
    if not CORE.exists():
        return fail("missing src/core/displayRangeWindow.js")

    text = CORE.read_text(encoding="utf-8")
    required_tokens = [
        "DISPLAY_RANGE_WINDOW_DAYS",
        '"3M": 92',
        '"6M": 184',
        "selectedWindowBounds",
        "visibleWindowMask",
        "selectedWindowRows",
        "bandWithVisibleWindowCoverage",
        "SETA_DISPLAY_RANGE_WINDOW_CORE_VERSION",
    ]
    missing = [token for token in required_tokens if token not in text]
    if missing:
        return fail(f"missing display-range core token(s): {missing}")

    forbidden = ["document.", "window.", "Plotly.", "fetch("]
    bad = [token for token in forbidden if token in text]
    if bad:
        return fail(f"display-range core should stay pure; found runtime token(s): {bad}")

    source = text
    source = re.sub(r"export\s+const\s+", "const ", source)
    source = re.sub(r"export\s+function\s+", "function ", source)

    node_script = source + '''
const rows = [
  {date: "2025-11-10", close: 1},
  {date: "2026-02-10", close: 2},
  {date: "2026-05-12", close: 3}
];

if (displayRangeWindowDays("3M") !== 92) throw new Error("3M days mismatch");
if (displayRangeWindowDays("6M") !== 184) throw new Error("6M days mismatch");

const b3 = selectedWindowBounds(rows, "3M");
if (b3.range !== "3M") throw new Error("3M range normalization failed");
if (b3.end.toISOString().slice(0, 10) !== "2026-05-12") throw new Error("3M end mismatch");

const m3 = visibleWindowMask(rows, "3M");
if (JSON.stringify(m3) !== JSON.stringify([false, true, true])) throw new Error("3M mask mismatch: " + JSON.stringify(m3));

const m6 = visibleWindowMask(rows, "6M");
if (JSON.stringify(m6) !== JSON.stringify([true, true, true])) throw new Error("6M mask mismatch: " + JSON.stringify(m6));

const selected = selectedWindowRows(rows, "3M");
if (selected.length !== 2 || selected[0].date !== "2026-02-10") throw new Error("selected rows mismatch");

const covered = bandWithVisibleWindowCoverage([10, 20, 30], m3);
if (JSON.stringify(covered) !== JSON.stringify([null, 20, 30])) throw new Error("band coverage mismatch");

console.log("[OK] node display-range core checks passed");
'''

    tmp = ROOT / "_tmp_display_range_window_core_check.cjs"
    tmp.write_text(node_script, encoding="utf-8")
    try:
        result = subprocess.run(["node", str(tmp.name)], cwd=ROOT, text=True, capture_output=True)
    except FileNotFoundError:
        print("[WARN] node not available; completed static display-range core checks only")
        print("[OK] display-range core smoke passed")
        return 0
    finally:
        try:
            tmp.unlink()
        except FileNotFoundError:
            pass

    if result.returncode != 0:
        print(result.stdout)
        print(result.stderr)
        return fail("node display-range core checks failed")

    print(result.stdout.strip())
    print("[OK] display-range core smoke passed")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
