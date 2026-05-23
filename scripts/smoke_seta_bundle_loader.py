#!/usr/bin/env python
"""Smoke-test the dashboard SETA bundle loader read path.

This is intentionally loader-only. It validates that the JavaScript module has a
stable manifest read path and that the checked-in/staged manifest contract can be
resolved without changing dashboard UI or chart-store behavior.
"""

from __future__ import annotations

import json
import re
import sys
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[1]
LOADER_PATH = ROOT / "src" / "seta_bundle_loader.js"
DEFAULT_MANIFEST = ROOT / "fixtures" / "seta_bundles" / "latest" / "manifest.json"
STAGED_MANIFEST = ROOT / "seta_bundles" / "latest" / "manifest.json"
EXPECTED_SCHEMA_VERSION = "seta_dashboard_bundle_v1"
EXPECTED_GLOBAL = "SETA_BUNDLE_LOADER"
EXPECTED_MANIFEST_URL = "seta_bundles/latest/manifest.json"
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


def read_text(path: Path) -> str:
    try:
        return path.read_text(encoding="utf-8")
    except UnicodeDecodeError:
        return path.read_text(encoding="utf-8-sig")


def load_json(path: Path) -> Any:
    try:
        return json.loads(read_text(path))
    except Exception as exc:  # pragma: no cover - smoke defensive branch
        fail(f"{path} is not valid JSON: {exc}")
        return None


def require_token(text: str, token: str, label: str | None = None) -> None:
    if token in text:
        ok(f"loader contains {label or token}")
    else:
        fail(f"loader missing {label or token}")


def require_regex(text: str, pattern: str, label: str) -> None:
    if re.search(pattern, text, re.MULTILINE):
        ok(f"loader contains {label}")
    else:
        fail(f"loader missing {label}")


def check_loader_source() -> None:
    if not LOADER_PATH.exists():
        fail(f"missing loader module: {LOADER_PATH.relative_to(ROOT)}")
        return
    ok(f"found loader module: {LOADER_PATH.relative_to(ROOT)}")
    text = read_text(LOADER_PATH)

    required_tokens = [
        "SETA_BUNDLE_SCHEMA_VERSION",
        "SETA_BUNDLE_MANIFEST_URL",
        "SETA_BUNDLE_REQUIRED_UNIVERSES",
        "SETA_BUNDLE_REQUIRED_WEIGHTINGS",
        "SETA_BUNDLE_REQUIRED_ROLES",
        "function validateSetaBundleManifest",
        "function bundleFileFor",
        "async function loadSetaBundleManifest",
        "async function loadSetaBundleCsv",
        "function resolveManifestRelativePath",
        EXPECTED_GLOBAL,
        "module.exports",
        EXPECTED_MANIFEST_URL,
        EXPECTED_SCHEMA_VERSION,
    ]
    for token in required_tokens:
        require_token(text, token)

    require_regex(text, r"Unsupported SETA bundle universe", "explicit unsupported universe error")
    require_regex(text, r"Unsupported SETA bundle weighting", "explicit unsupported weighting error")
    require_regex(text, r"Unsupported SETA bundle role", "explicit unsupported role error")
    require_regex(text, r"Unsafe SETA bundle file path", "unsafe relative-path guard")


def as_set(value: Any) -> set[str]:
    if not isinstance(value, list):
        return set()
    return {str(item).strip() for item in value if str(item).strip()}


def check_manifest_read_path(manifest_path: Path, label: str) -> None:
    if not manifest_path.exists():
        if label == "staged":
            warn(f"staged real bundle manifest not present yet: {manifest_path.relative_to(ROOT)}")
        else:
            fail(f"missing {label} manifest: {manifest_path.relative_to(ROOT)}")
        return
    ok(f"found {label} manifest: {manifest_path.relative_to(ROOT)}")
    payload = load_json(manifest_path)
    if not isinstance(payload, dict):
        fail(f"{label} manifest root is not an object")
        return

    if payload.get("schema_version") == EXPECTED_SCHEMA_VERSION:
        ok(f"{label} manifest schema_version={EXPECTED_SCHEMA_VERSION}")
    else:
        fail(f"{label} manifest schema_version mismatch: {payload.get('schema_version')!r}")

    missing_universes = sorted(EXPECTED_UNIVERSES - as_set(payload.get("universes")))
    missing_weightings = sorted(EXPECTED_WEIGHTINGS - as_set(payload.get("weightings")))
    if missing_universes:
        fail(f"{label} manifest missing universes: {', '.join(missing_universes)}")
    else:
        ok(f"{label} manifest includes required universes")
    if missing_weightings:
        fail(f"{label} manifest missing weightings: {', '.join(missing_weightings)}")
    else:
        ok(f"{label} manifest includes required weightings")

    files = payload.get("files")
    if not isinstance(files, dict):
        fail(f"{label} manifest missing files object")
        return

    base_dir = manifest_path.parent
    for universe in sorted(EXPECTED_UNIVERSES):
        universe_files = files.get(universe)
        if not isinstance(universe_files, dict):
            fail(f"{label} manifest missing files.{universe}")
            continue
        for weighting in sorted(EXPECTED_WEIGHTINGS):
            weighting_files = universe_files.get(weighting)
            if not isinstance(weighting_files, dict):
                fail(f"{label} manifest missing files.{universe}.{weighting}")
                continue
            missing_roles = sorted(EXPECTED_ROLES - set(weighting_files))
            if missing_roles:
                fail(f"{label} manifest files.{universe}.{weighting} missing roles: {', '.join(missing_roles)}")
                continue
            ok(f"{label} manifest files.{universe}.{weighting} declares required roles")
            for role in sorted(EXPECTED_ROLES):
                rel = weighting_files.get(role)
                if not isinstance(rel, str) or not rel.strip():
                    fail(f"{label} manifest files.{universe}.{weighting}.{role} is blank")
                    continue
                if Path(rel).is_absolute() or ".." in Path(rel).parts:
                    fail(f"{label} manifest unsafe file path: {rel}")
                    continue
                target = base_dir / rel
                if target.exists():
                    ok(f"{label} loader target exists: {target.relative_to(ROOT)}")
                else:
                    fail(f"{label} loader target missing: {target.relative_to(ROOT)}")


def main() -> int:
    print("=" * 60)
    print("SETA bundle loader smoke test")
    print(f"Repo: {ROOT}")
    print("=" * 60)

    check_loader_source()
    check_manifest_read_path(DEFAULT_MANIFEST, "fixture")
    check_manifest_read_path(STAGED_MANIFEST, "staged")

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
