#!/usr/bin/env python
"""Smoke-test a SETA dashboard bundle manifest.

This validates the future equal/mcap bundle package contract without requiring
real production bundle files to be committed yet. By default it checks the tiny
fixture under fixtures/seta_bundles/latest.

When production bundle delivery is added, run with:

    python scripts/smoke_seta_bundle_manifest.py --manifest seta_bundles/latest/manifest.json
"""

from __future__ import annotations

import argparse
import csv
import json
import sys
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[1]
DEFAULT_MANIFEST = ROOT / "fixtures" / "seta_bundles" / "latest" / "manifest.json"
EXPECTED_SCHEMA_VERSION = "seta_dashboard_bundle_v1"
EXPECTED_UNIVERSES = {"all", "crypto", "stocks"}
EXPECTED_WEIGHTINGS = {"equal", "mcap"}
EXPECTED_ROLES = {"ecosystem", "sector", "asset", "multi_level"}

ERRORS: list[str] = []
WARNINGS: list[str] = []


def ok(message: str) -> None:
    print(f"[OK] {message}")


def warn(message: str) -> None:
    WARNINGS.append(message)
    print(f"[WARN] {message}")


def fail(message: str) -> None:
    ERRORS.append(message)
    print(f"[ERROR] {message}")


def read_json(path: Path) -> Any:
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except Exception as exc:  # pragma: no cover - defensive smoke-test branch
        fail(f"{path} is not valid JSON: {exc}")
        return None


def require_csv(path: Path) -> None:
    if not path.exists():
        fail(f"manifest-listed file missing: {path}")
        return
    if path.suffix.lower() != ".csv":
        fail(f"manifest-listed file is not CSV: {path}")
        return
    try:
        with path.open("r", encoding="utf-8-sig", newline="") as fh:
            reader = csv.reader(fh)
            header = next(reader, None)
            row = next(reader, None)
    except Exception as exc:  # pragma: no cover - defensive smoke-test branch
        fail(f"manifest-listed CSV cannot be read: {path}: {exc}")
        return
    if not header:
        fail(f"manifest-listed CSV has no header: {path}")
        return
    if not row:
        warn(f"manifest-listed CSV has header but no data rows: {path}")
    ok(f"CSV readable: {path.relative_to(ROOT)}")


def as_string_set(value: Any) -> set[str]:
    if not isinstance(value, list):
        return set()
    return {str(item).strip() for item in value if str(item).strip()}


def check_manifest(manifest_path: Path) -> None:
    if not manifest_path.exists():
        fail(f"manifest missing: {manifest_path}")
        return
    ok(f"found manifest: {manifest_path.relative_to(ROOT)}")

    payload = read_json(manifest_path)
    if not isinstance(payload, dict):
        fail("manifest root is not an object")
        return

    schema_version = payload.get("schema_version")
    if schema_version == EXPECTED_SCHEMA_VERSION:
        ok(f"schema_version={schema_version}")
    else:
        fail(f"schema_version expected {EXPECTED_SCHEMA_VERSION}, got {schema_version!r}")

    generated_at = payload.get("generated_at")
    latest_date = payload.get("latest_date")
    if generated_at:
        ok(f"generated_at={generated_at}")
    else:
        fail("manifest missing generated_at")
    if latest_date:
        ok(f"latest_date={latest_date}")
    else:
        fail("manifest missing latest_date")

    universes = as_string_set(payload.get("universes"))
    weightings = as_string_set(payload.get("weightings"))
    missing_universes = sorted(EXPECTED_UNIVERSES - universes)
    missing_weightings = sorted(EXPECTED_WEIGHTINGS - weightings)
    if missing_universes:
        fail(f"manifest missing universes: {', '.join(missing_universes)}")
    else:
        ok(f"universes include {', '.join(sorted(EXPECTED_UNIVERSES))}")
    if missing_weightings:
        fail(f"manifest missing weightings: {', '.join(missing_weightings)}")
    else:
        ok(f"weightings include {', '.join(sorted(EXPECTED_WEIGHTINGS))}")

    files = payload.get("files")
    if not isinstance(files, dict):
        fail("manifest missing files object")
        return

    base_dir = manifest_path.parent
    for universe in sorted(EXPECTED_UNIVERSES):
        universe_files = files.get(universe)
        if not isinstance(universe_files, dict):
            fail(f"files.{universe} missing or not an object")
            continue
        for weighting in sorted(EXPECTED_WEIGHTINGS):
            weighting_files = universe_files.get(weighting)
            if not isinstance(weighting_files, dict):
                fail(f"files.{universe}.{weighting} missing or not an object")
                continue
            roles = set(str(k) for k in weighting_files.keys())
            missing_roles = sorted(EXPECTED_ROLES - roles)
            if missing_roles:
                fail(f"files.{universe}.{weighting} missing roles: {', '.join(missing_roles)}")
                continue
            ok(f"files.{universe}.{weighting} declares expected roles")
            for role in sorted(EXPECTED_ROLES):
                rel = weighting_files.get(role)
                if not isinstance(rel, str) or not rel.strip():
                    fail(f"files.{universe}.{weighting}.{role} is blank")
                    continue
                if Path(rel).is_absolute() or ".." in Path(rel).parts:
                    fail(f"files.{universe}.{weighting}.{role} must be a safe relative path: {rel}")
                    continue
                require_csv(base_dir / rel)

            equal_files = universe_files.get("equal") if isinstance(universe_files.get("equal"), dict) else {}
            mcap_files = universe_files.get("mcap") if isinstance(universe_files.get("mcap"), dict) else {}
            if isinstance(equal_files, dict) and isinstance(mcap_files, dict):
                for role in sorted(EXPECTED_ROLES):
                    if equal_files.get(role) and equal_files.get(role) == mcap_files.get(role):
                        fail(f"files.{universe}.{role} uses same path for equal and mcap: {equal_files.get(role)}")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Smoke-test a SETA dashboard bundle manifest.")
    parser.add_argument(
        "--manifest",
        type=Path,
        default=DEFAULT_MANIFEST,
        help="Path to bundle manifest JSON. Defaults to the checked-in fixture.",
    )
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    manifest_path = args.manifest
    if not manifest_path.is_absolute():
        manifest_path = ROOT / manifest_path

    print("=" * 60)
    print("SETA bundle manifest smoke test")
    print(f"Repo: {ROOT}")
    print(f"Manifest: {manifest_path}")
    print("=" * 60)

    check_manifest(manifest_path)

    print("=" * 60)
    if ERRORS:
        print("FAILED")
        for error in ERRORS:
            print(f" - {error}")
        return 1
    print("PASSED")
    if WARNINGS:
        print("Warnings:")
        for warning in WARNINGS:
            print(f" - {warning}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
