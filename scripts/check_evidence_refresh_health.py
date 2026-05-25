from __future__ import annotations

import argparse
import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from check_evidence_handoff_payload import find_card, load_payload, validate_payload

DEFAULT_PAYLOAD = Path("seta_bundles/latest/evidence/dashboard_evidence_payload.json")
DEFAULT_STATUS = Path("seta_bundles/latest/evidence/evidence_refresh_status.json")

REQUIRED_HOMEPAGE_MARKERS = (
    "data-seta-evidence-section",
    "data-seta-evidence-card",
    "src/evidence_handoff_reader.js",
    "src/evidence_card_ui.js",
)

REQUIRED_MODULE_MARKERS = (
    "src/evidence_handoff_reader.js",
    "src/evidence_card_ui.js",
    "src/features/ModuleEvidenceContext.js",
)


def utc_now_iso() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")


def file_mtime_iso(path: Path) -> str | None:
    if not path.exists():
        return None
    return datetime.fromtimestamp(path.stat().st_mtime, timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")


def read_text(path: Path) -> str:
    return path.read_text(encoding="utf-8-sig")


def check_markers(path: Path, markers: tuple[str, ...]) -> dict[str, Any]:
    result: dict[str, Any] = {
        "path": path.as_posix(),
        "exists": path.exists(),
        "present": False,
        "missing_markers": [],
    }

    if not path.exists():
        result["missing_markers"] = list(markers)
        return result

    text = read_text(path)
    missing = [marker for marker in markers if marker not in text]
    result["missing_markers"] = missing
    result["present"] = not missing
    return result


def build_status(root: Path, payload_rel: Path, status_rel: Path) -> tuple[dict[str, Any], list[str]]:
    payload_path = root / payload_rel
    errors: list[str] = []

    payload_valid = False
    payload: dict[str, Any] = {}
    primary_card: dict[str, Any] = {}

    if not payload_path.exists():
        errors.append(f"payload missing: {payload_rel.as_posix()}")
    else:
        try:
            payload = load_payload(payload_path)
            validation_errors = validate_payload(payload)
            if validation_errors:
                errors.extend(validation_errors)
            else:
                payload_valid = True
            primary_card = find_card(payload, payload.get("primary_archetype", "attention_validation")) or {}
        except Exception as exc:
            errors.append(f"payload validation exception: {exc}")

    homepage = check_markers(root / "index.html", REQUIRED_HOMEPAGE_MARKERS)
    module_dashboard = check_markers(
        root / "interactive_dashboard_fix24_public_embed.html",
        REQUIRED_MODULE_MARKERS,
    )

    if not homepage["present"]:
        errors.append("homepage evidence mount missing or incomplete")
    if not module_dashboard["present"]:
        errors.append("module dashboard evidence mount missing or incomplete")

    status = {
        "schema_version": "seta_evidence_refresh_status_v1",
        "generated_at_utc": utc_now_iso(),
        "status": "pass" if not errors else "fail",
        "payload": {
            "path": payload_rel.as_posix(),
            "exists": payload_path.exists(),
            "valid": payload_valid,
            "last_modified_utc": file_mtime_iso(payload_path),
            "schema_version": payload.get("schema_version"),
            "primary_archetype": payload.get("primary_archetype"),
            "primary_status": payload.get("primary_status"),
            "primary_title": primary_card.get("title"),
        },
        "mounts": {
            "homepage": homepage,
            "module_dashboard": module_dashboard,
        },
        "errors": errors,
    }

    return status, errors


def write_json(path: Path, payload: dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, indent=2, sort_keys=True) + "\n", encoding="utf-8")


def main() -> int:
    parser = argparse.ArgumentParser(description="Check SETA Evidence Handoff refresh health.")
    parser.add_argument("--root", default=".", help="sentiment-dash repository root")
    parser.add_argument("--payload", default=str(DEFAULT_PAYLOAD), help="Evidence Handoff payload path relative to root")
    parser.add_argument("--status-out", default=str(DEFAULT_STATUS), help="Status JSON path relative to root")
    parser.add_argument("--no-write", action="store_true", help="Print health only; do not write status JSON")
    args = parser.parse_args()

    root = Path(args.root).resolve()
    payload_rel = Path(args.payload)
    status_rel = Path(args.status_out)

    status, errors = build_status(root, payload_rel, status_rel)

    if not args.no_write:
        write_json(root / status_rel, status)

    print(f"[{status['status'].upper()}] evidence refresh health")
    print(f"payload={payload_rel.as_posix()}")
    print(f"status_out={status_rel.as_posix()}")
    print(f"primary_archetype={status['payload'].get('primary_archetype')}")
    print(f"primary_status={status['payload'].get('primary_status')}")
    print(f"primary_title={status['payload'].get('primary_title')}")

    if errors:
        for error in errors:
            print(f"  - {error}")
        return 1

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
