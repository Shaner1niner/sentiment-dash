from __future__ import annotations

import argparse
import json
import os
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from check_evidence_handoff_payload import (
    ARCHIVAL_DISCLOSURE,
    CURRENT_TENSE_PHRASES,
    find_card,
    load_payload,
    validate_payload,
)

DEFAULT_PAYLOAD = Path("seta_bundles/latest/evidence/dashboard_evidence_payload.json")
DEFAULT_STATUS = Path("seta_bundles/latest/evidence/evidence_refresh_status.json")
DEFAULT_MAX_AGE_DAYS = float(os.environ.get("SETA_EVIDENCE_MAX_AGE_DAYS", "7"))

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


def parse_utc(value: Any) -> datetime | None:
    if not value:
        return None
    text = str(value).strip()
    if not text:
        return None
    try:
        if text.endswith("Z"):
            text = text[:-1] + "+00:00"
        parsed = datetime.fromisoformat(text)
    except ValueError:
        return None
    if parsed.tzinfo is None:
        parsed = parsed.replace(tzinfo=timezone.utc)
    return parsed.astimezone(timezone.utc)


def age_days(value: Any) -> float | None:
    parsed = parse_utc(value)
    if parsed is None:
        return None
    return (datetime.now(timezone.utc) - parsed).total_seconds() / 86400


def payload_generated_at(payload: dict[str, Any], payload_path: Path) -> str | None:
    return payload.get("generated_at_utc") or payload.get("generated_at") or file_mtime_iso(payload_path)


def payload_as_of(payload: dict[str, Any]) -> str | None:
    return payload.get("as_of_utc") or payload.get("as_of")


def payload_freshness_timestamp(payload: dict[str, Any], payload_path: Path) -> str | None:
    return payload_as_of(payload) or payload_generated_at(payload, payload_path)


def has_archival_disclosure(payload: dict[str, Any], primary_card: dict[str, Any]) -> bool:
    text = " ".join(
        str(item or "")
        for item in [
            payload.get("evidence_mode"),
            payload.get("archive_notice"),
            payload.get("safety_note"),
            primary_card.get("public_takeaway"),
            " ".join(str(c) for c in primary_card.get("caveats", []) if c),
        ]
    )
    return ARCHIVAL_DISCLOSURE in text or "archived validation sample" in text.lower()


def current_tense_matches(payload: dict[str, Any]) -> list[str]:
    text = json.dumps(payload, sort_keys=True)
    lowered = text.lower()
    return [phrase for phrase in CURRENT_TENSE_PHRASES if phrase.lower() in lowered]


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


def build_status(root: Path, payload_rel: Path, status_rel: Path, max_age_days: float = DEFAULT_MAX_AGE_DAYS) -> tuple[dict[str, Any], list[str]]:
    payload_path = root / payload_rel
    errors: list[str] = []
    warnings: list[str] = []

    payload_valid = False
    payload: dict[str, Any] = {}
    primary_card: dict[str, Any] = {}
    generated_at: str | None = None
    as_of: str | None = None
    freshness_timestamp: str | None = None
    evidence_age_days: float | None = None
    sample_window: str | None = None
    archival = False

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
            metrics = primary_card.get("metrics", {}) if isinstance(primary_card, dict) else {}
            if isinstance(metrics, dict):
                sample_window = metrics.get("date_range")
            generated_at = payload_generated_at(payload, payload_path)
            as_of = payload_as_of(payload)
            freshness_timestamp = payload_freshness_timestamp(payload, payload_path)
            evidence_age_days = age_days(freshness_timestamp)
            archival = has_archival_disclosure(payload, primary_card)
            current_phrases = current_tense_matches(payload)
            if current_phrases:
                errors.append(
                    "payload uses current-tense copy that can present stale evidence as live: "
                    + ", ".join(current_phrases)
                )
            if not freshness_timestamp:
                errors.append("payload missing generated_at_utc/as_of metadata")
            elif evidence_age_days is None:
                errors.append(f"payload generated/as_of timestamp is not parseable: {freshness_timestamp}")
            elif evidence_age_days > max_age_days and archival:
                warnings.append(
                    f"archival evidence payload is {evidence_age_days:.1f} days old; disclosure present"
                )
            elif evidence_age_days > max_age_days:
                errors.append(
                    f"evidence payload is stale: age_days={evidence_age_days:.1f} allowed={max_age_days:g}"
                )
            if not sample_window:
                errors.append("payload missing evidence sample window date_range")
            if archival and not payload.get("archive_notice"):
                errors.append("archival evidence payload missing archive_notice")
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
            "generated_at_utc": generated_at,
            "as_of": as_of,
            "freshness_timestamp_utc": freshness_timestamp,
            "generated_or_as_of_utc": freshness_timestamp,
            "age_days": round(evidence_age_days, 3) if evidence_age_days is not None else None,
            "sample_window": sample_window,
            "archival": archival,
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
        "warnings": warnings,
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
    parser.add_argument("--max-age-days", type=float, default=DEFAULT_MAX_AGE_DAYS, help="Fresh evidence threshold before archival disclosure is required")
    parser.add_argument("--no-write", action="store_true", help="Print health only; do not write status JSON")
    args = parser.parse_args()

    root = Path(args.root).resolve()
    payload_rel = Path(args.payload)
    status_rel = Path(args.status_out)

    status, errors = build_status(root, payload_rel, status_rel, max_age_days=args.max_age_days)

    if not args.no_write:
        write_json(root / status_rel, status)

    print(f"[{status['status'].upper()}] evidence refresh health")
    print(f"payload={payload_rel.as_posix()}")
    print(f"status_out={status_rel.as_posix()}")
    print(f"primary_archetype={status['payload'].get('primary_archetype')}")
    print(f"primary_status={status['payload'].get('primary_status')}")
    print(f"primary_title={status['payload'].get('primary_title')}")
    print(f"sample_window={status['payload'].get('sample_window')}")
    print(f"generated_at_utc={status['payload'].get('generated_at_utc')}")
    print(f"as_of={status['payload'].get('as_of')}")
    print(f"freshness_timestamp_utc={status['payload'].get('freshness_timestamp_utc')}")
    print(f"archival={status['payload'].get('archival')}")

    for warning in status.get("warnings", []):
        print(f"  [WARN] {warning}")
    if errors:
        for error in errors:
            print(f"  - {error}")
        return 1

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
