from __future__ import annotations

import json
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[1]
REFERENCE_PATH = ROOT / "agent_reference" / "seta_enriched_column_descriptions_grouped.json"

REPLACEMENTS = {
    "7_day_ma_volume": "volume_ma_7",
    "20_day_ma_volume": "volume_ma_20",
}


def walk(value: Any) -> tuple[Any, int]:
    replacements = 0
    if isinstance(value, dict):
        out = {}
        for key, item in value.items():
            if key == "column" and isinstance(item, str) and item in REPLACEMENTS:
                out[key] = REPLACEMENTS[item]
                replacements += 1
            else:
                new_item, count = walk(item)
                out[key] = new_item
                replacements += count
        return out, replacements
    if isinstance(value, list):
        out = []
        for item in value:
            new_item, count = walk(item)
            out.append(new_item)
            replacements += count
        return out, replacements
    return value, 0


def main() -> int:
    if not REFERENCE_PATH.exists():
        raise SystemExit(f"[FAIL] missing {REFERENCE_PATH.relative_to(ROOT)}")

    payload = json.loads(REFERENCE_PATH.read_text(encoding="utf-8"))
    patched, replacement_count = walk(payload)

    if replacement_count == 0:
        print("[OK] no stale numeric-leading volume MA references found")
        return 0

    REFERENCE_PATH.write_text(json.dumps(patched, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"[OK] replaced {replacement_count} stale volume MA reference names in {REFERENCE_PATH.relative_to(ROOT)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
