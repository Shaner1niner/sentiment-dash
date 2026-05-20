from __future__ import annotations

import json
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[1]
REFERENCE_PATH = ROOT / "agent_reference" / "seta_enriched_column_descriptions_grouped.json"
STALE_NAMES = {"7_day_ma_volume", "20_day_ma_volume", "col_7_day_ma_volume", "col_20_day_ma_volume"}
PREFERRED_NAMES = {"volume_ma_7", "volume_ma_20"}


def iter_columns(value: Any):
    if isinstance(value, dict):
        if isinstance(value.get("column"), str):
            yield value["column"]
        for item in value.values():
            yield from iter_columns(item)
    elif isinstance(value, list):
        for item in value:
            yield from iter_columns(item)


def fail(message: str) -> None:
    raise SystemExit(f"[FAIL] {message}")


def ok(message: str) -> None:
    print(f"[OK] {message}")


def main() -> int:
    if not REFERENCE_PATH.exists():
        fail(f"missing {REFERENCE_PATH.relative_to(ROOT)}")

    payload = json.loads(REFERENCE_PATH.read_text(encoding="utf-8"))
    columns = set(iter_columns(payload))
    stale = sorted(columns & STALE_NAMES)
    if stale:
        fail(f"stale numeric-leading/sanitized volume MA reference names remain: {stale}")

    missing = sorted(PREFERRED_NAMES - columns)
    if missing:
        fail(f"preferred volume MA reference names missing: {missing}")

    ok("agent reference uses DB-safe volume MA names")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
