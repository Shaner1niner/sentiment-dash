from __future__ import annotations

import argparse
import fnmatch
import json
import subprocess
from pathlib import Path
from typing import Any


DEFAULT_MANIFEST = Path("refresh_manifest.json")


def load_manifest(path: Path) -> dict[str, Any]:
    return json.loads(path.read_text(encoding="utf-8-sig"))


def normalize_path(path: str) -> str:
    return path.replace("\\", "/")


def matches_any(path: str, patterns: list[str]) -> bool:
    normalized = normalize_path(path)
    return any(fnmatch.fnmatch(normalized, pattern) for pattern in patterns)


def classify_path(path: str, manifest: dict[str, Any]) -> str:
    generated_public_data = manifest.get("generated_public_data", [])
    generated_public_html = manifest.get("generated_public_html", [])
    protected_mounts = manifest.get("protected_mount_markers", {})

    normalized = normalize_path(path)

    if normalized in protected_mounts:
      return "protected_surface"

    if matches_any(normalized, generated_public_data):
        return "generated_public_data"

    if matches_any(normalized, generated_public_html):
        return "generated_public_html"

    return "unexpected"


def parse_git_status_line(line: str) -> tuple[str, str]:
    status = line[:2]
    path = line[3:].strip()

    if " -> " in path:
        path = path.split(" -> ", 1)[1].strip()

    return status, normalize_path(path)


def get_changed_tracked_files(root: Path) -> list[dict[str, str]]:
    result = subprocess.run(
        ["git", "status", "--short", "--untracked-files=no"],
        cwd=root,
        check=True,
        capture_output=True,
        text=True,
    )

    changed = []
    for raw_line in result.stdout.splitlines():
        if not raw_line.strip():
            continue
        status, path = parse_git_status_line(raw_line)
        changed.append({"status": status.strip(), "path": path})
    return changed


def check_protected_markers(root: Path, manifest: dict[str, Any]) -> list[dict[str, Any]]:
    results = []
    protected = manifest.get("protected_mount_markers", {})

    for rel_path, markers in protected.items():
        path = root / rel_path
        exists = path.exists()
        text = path.read_text(encoding="utf-8-sig") if exists else ""
        missing = [marker for marker in markers if marker not in text]
        results.append(
            {
                "path": rel_path,
                "exists": exists,
                "present": exists and not missing,
                "missing_markers": missing,
            }
        )

    return results


def build_report(root: Path, manifest_path: Path) -> dict[str, Any]:
    manifest = load_manifest(manifest_path)
    changed = get_changed_tracked_files(root)

    classified = []
    for item in changed:
        group = classify_path(item["path"], manifest)
        classified.append({**item, "group": group})

    protected = check_protected_markers(root, manifest)
    unexpected = [item for item in classified if item["group"] == "unexpected"]
    missing_protected = [item for item in protected if not item["present"]]

    return {
        "schema_version": "seta_refresh_integrity_report_v1",
        "manifest": manifest_path.as_posix(),
        "changed_files": classified,
        "unexpected_tracked_files": unexpected,
        "protected_mounts": protected,
        "missing_protected_mounts": missing_protected,
        "status": "pass" if not unexpected and not missing_protected else "fail",
    }


def main() -> int:
    parser = argparse.ArgumentParser(description="Classify public/member refresh changes.")
    parser.add_argument("--root", default=".", help="Repository root")
    parser.add_argument("--manifest", default=str(DEFAULT_MANIFEST), help="Refresh manifest path")
    parser.add_argument("--report-only", action="store_true", help="Always exit 0 while printing report")
    parser.add_argument("--json", action="store_true", help="Print JSON report")
    args = parser.parse_args()

    root = Path(args.root).resolve()
    manifest_path = root / args.manifest
    report = build_report(root, manifest_path)

    if args.json:
        print(json.dumps(report, indent=2, sort_keys=True))
    else:
        print(f"[{report['status'].upper()}] refresh integrity")
        print(f"changed_files={len(report['changed_files'])}")
        print(f"unexpected_tracked_files={len(report['unexpected_tracked_files'])}")
        print(f"missing_protected_mounts={len(report['missing_protected_mounts'])}")

        for item in report["unexpected_tracked_files"]:
            print(f"  unexpected: {item['status']} {item['path']}")

        for item in report["missing_protected_mounts"]:
            print(f"  missing protected markers: {item['path']} -> {item['missing_markers']}")

    if report["status"] != "pass" and not args.report_only:
        return 1

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
