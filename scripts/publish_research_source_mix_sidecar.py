from __future__ import annotations

import argparse
import json
import shutil
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[1]
DEFAULT_SOURCE = Path.home() / "snt_exports" / "research_source_mix_contract.json"
DEFAULT_TARGETS = [
    ROOT / "research_source_mix_contract.json",
    ROOT / "fix26_chart_store_assets" / "public" / "research_source_mix_contract.json",
]


def fail(message: str) -> None:
    raise SystemExit(f"[FAIL] {message}")


def ok(message: str) -> None:
    print(f"[OK] {message}")


def load_contract(path: Path) -> dict[str, Any]:
    try:
        payload = json.loads(path.read_text(encoding="utf-8"))
    except json.JSONDecodeError as exc:
        fail(f"invalid JSON in {path}: {exc}")
    if not isinstance(payload, dict):
        fail(f"research source mix sidecar must be a JSON object: {path}")
    return payload


def record_count(payload: dict[str, Any]) -> int:
    for key in ["records", "research_source_mix", "rows", "assets"]:
        value = payload.get(key)
        if isinstance(value, list):
            return len(value)
        if isinstance(value, dict):
            return len(value)
    value = payload.get("record_count")
    if isinstance(value, int):
        return value
    return 0


def publish_sidecar(source: Path, targets: list[Path], *, allow_missing: bool = True) -> int:
    if not source.exists():
        message = f"source sidecar not found: {source}"
        if allow_missing:
            print(f"[SKIP] {message}")
            return 0
        fail(message)

    payload = load_contract(source)
    count = record_count(payload)
    if count <= 0:
        print(f"[WARN] sidecar has no source-mix records: {source}")

    published = 0
    for target in targets:
        target.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(source, target)
        ok(f"published {source} -> {target}")
        published += 1

    print(f"[OK] research_source_mix_sidecar published_targets={published} record_count={count}")
    return published


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Publish SETA Research Source Mix sidecar into dashboard paths.")
    parser.add_argument("--source", default=str(DEFAULT_SOURCE), help="Path to SETA_engine research_source_mix_contract.json export")
    parser.add_argument(
        "--target",
        action="append",
        default=None,
        help="Dashboard target path. May be supplied multiple times. Defaults to repo root and fix26 public path.",
    )
    parser.add_argument("--require-source", action="store_true", help="Fail instead of skipping when the source sidecar is absent")
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    source = Path(args.source).expanduser().resolve()
    targets = [Path(t).expanduser() for t in args.target] if args.target else DEFAULT_TARGETS
    normalized_targets = [target if target.is_absolute() else (ROOT / target) for target in targets]
    publish_sidecar(source, normalized_targets, allow_missing=not args.require_source)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
