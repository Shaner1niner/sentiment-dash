#!/usr/bin/env python
"""Build the SETA AI briefing scale rollout matrix.

This helper is intentionally local/offline. It reads the dashboard mode manifest
and split chart-store indexes, then writes a reviewable matrix of available and
missing asset/context briefing cases. It does not call an AI provider and does
not modify reviewed briefing payloads.
"""

from __future__ import annotations

import argparse
import json
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[1]
DEFAULT_MANIFEST = ROOT / "dashboard_fix26_mode_manifest.json"
DEFAULT_OUTPUT_DIR = ROOT / "briefing_outputs" / "scale_matrix"


@dataclass(frozen=True)
class ContextSpec:
    mode: str
    frequency: str
    display_range: str
    min_rows: int
    required: bool

    @property
    def row_key(self) -> str:
        return "daily_rows" if self.frequency.upper() == "D" else "weekly_rows"

    @property
    def label(self) -> str:
        required = "required" if self.required else "optional"
        return f"{self.mode} {self.frequency.upper()} {self.display_range.upper()} ({required})"


DEFAULT_CONTEXTS = [
    ContextSpec("public", "D", "3M", 60, True),
    ContextSpec("public", "W", "1Y", 20, True),
    ContextSpec("member", "D", "6M", 120, True),
    ContextSpec("member", "W", "1Y", 20, True),
]


def utc_stamp() -> str:
    return datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")


def load_json(path: Path) -> dict[str, Any]:
    if not path.exists():
        raise FileNotFoundError(path)
    data = json.loads(path.read_text(encoding="utf-8"))
    if not isinstance(data, dict):
        raise ValueError(f"{path} root is not an object")
    return data


def write_json(path: Path, payload: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, indent=2, sort_keys=True) + "\n", encoding="utf-8")


def path_label(path: Path) -> str:
    try:
        return str(path.relative_to(ROOT))
    except ValueError:
        return str(path)


def parse_context(value: str) -> ContextSpec:
    parts = [part.strip() for part in value.split(",")]
    if len(parts) < 4:
        raise argparse.ArgumentTypeError("context must be mode,frequency,display_range,min_rows[,required]")
    mode, frequency, display_range, min_rows_raw = parts[:4]
    required = True
    if len(parts) >= 5 and parts[4]:
        required = parts[4].lower() not in {"0", "false", "no", "optional"}
    try:
        min_rows = int(min_rows_raw)
    except ValueError as exc:
        raise argparse.ArgumentTypeError("min_rows must be an integer") from exc
    frequency = frequency.upper()
    if frequency not in {"D", "W"}:
        raise argparse.ArgumentTypeError("frequency must be D or W")
    return ContextSpec(mode.lower(), frequency, display_range.upper(), min_rows, required)


def mode_config(manifest: dict[str, Any], mode: str) -> dict[str, Any]:
    modes = manifest.get("modes")
    if not isinstance(modes, dict) or mode not in modes or not isinstance(modes[mode], dict):
        raise ValueError(f"manifest missing mode {mode}")
    return modes[mode]


def resolve_index_path(manifest_path: Path, cfg: dict[str, Any]) -> Path:
    raw = str(cfg.get("assetIndexUrl") or "").strip()
    if not raw:
        raise ValueError("mode config missing assetIndexUrl")
    path = Path(raw)
    return path if path.is_absolute() else manifest_path.parent / path


def configured_assets(cfg: dict[str, Any]) -> list[str]:
    assets = cfg.get("assets") or []
    return [str(asset).upper() for asset in assets if str(asset).strip()]


def index_assets(index: dict[str, Any]) -> dict[str, dict[str, Any]]:
    assets = index.get("assets")
    if not isinstance(assets, dict):
        return {}
    return {str(asset).upper(): info if isinstance(info, dict) else {} for asset, info in assets.items()}


def case_id(mode: str, asset: str, frequency: str, display_range: str) -> str:
    return "_".join([mode.lower(), asset.lower(), frequency.lower(), display_range.lower()])


def build_matrix(manifest_path: Path, contexts: list[ContextSpec]) -> dict[str, Any]:
    manifest = load_json(manifest_path)
    modes_used = sorted({ctx.mode for ctx in contexts})
    indexes: dict[str, dict[str, Any]] = {}
    index_paths: dict[str, str] = {}
    configured_by_mode: dict[str, list[str]] = {}
    available_assets_by_mode: dict[str, list[str]] = {}
    missing_assets_by_mode: dict[str, list[str]] = {}

    for mode in modes_used:
        cfg = mode_config(manifest, mode)
        index_path = resolve_index_path(manifest_path, cfg)
        index = load_json(index_path)
        assets = index_assets(index)
        configured = configured_assets(cfg)
        configured_by_mode[mode] = configured
        available_assets_by_mode[mode] = sorted(asset for asset in configured if asset in assets)
        missing_assets_by_mode[mode] = sorted(asset for asset in configured if asset not in assets)
        indexes[mode] = index
        index_paths[mode] = path_label(index_path)

    available_cases: list[dict[str, Any]] = []
    skipped_cases: list[dict[str, Any]] = []

    for ctx in contexts:
        cfg = mode_config(manifest, ctx.mode)
        assets = index_assets(indexes[ctx.mode])
        for asset in configured_assets(cfg):
            info = assets.get(asset)
            if not info:
                skipped_cases.append(
                    {
                        "case_id": case_id(ctx.mode, asset, ctx.frequency, ctx.display_range),
                        "mode": ctx.mode,
                        "asset": asset,
                        "frequency": ctx.frequency,
                        "display_range": ctx.display_range,
                        "required": ctx.required,
                        "status": "missing_asset_payload",
                        "reason": f"{asset} is configured in {ctx.mode} mode but absent from {index_paths[ctx.mode]}",
                    }
                )
                continue
            row_count = int(info.get(ctx.row_key) or 0)
            row_url = str(info.get("url") or "")
            row = {
                "case_id": case_id(ctx.mode, asset, ctx.frequency, ctx.display_range),
                "mode": ctx.mode,
                "asset": asset,
                "frequency": ctx.frequency,
                "display_range": ctx.display_range,
                "required": ctx.required,
                "min_rows": ctx.min_rows,
                "row_count": row_count,
                "asset_payload_url": row_url,
                "input_command": (
                    "python scripts/build_ai_briefing_input.py "
                    f"--mode {ctx.mode} --asset {asset} --frequency {ctx.frequency} --display-range {ctx.display_range} "
                    f"--output briefing_inputs/{asset.lower()}_{ctx.frequency.lower()}_{ctx.display_range.lower()}_{ctx.mode}.json"
                ),
                "draft_command": (
                    "python scripts/generate_ai_briefing_draft.py "
                    f"--mode {ctx.mode} --asset {asset} --frequency {ctx.frequency} --display-range {ctx.display_range}"
                ),
            }
            if row_count >= ctx.min_rows:
                available_cases.append({**row, "status": "available"})
            else:
                skipped_cases.append(
                    {
                        **row,
                        "status": "insufficient_rows",
                        "reason": f"{ctx.frequency} context has {row_count} rows; minimum is {ctx.min_rows}",
                    }
                )

    return {
        "schema_version": "ai_briefing_scale_matrix_v1",
        "generated_at_utc": datetime.now(timezone.utc).replace(microsecond=0).isoformat(),
        "manifest_path": path_label(manifest_path),
        "manifest_version": manifest.get("version"),
        "manifest_reviewed_briefings_url": manifest.get("reviewedBriefingsUrl"),
        "contexts": [ctx.__dict__ | {"label": ctx.label, "row_key": ctx.row_key} for ctx in contexts],
        "index_paths": index_paths,
        "configured_assets_by_mode": configured_by_mode,
        "available_assets_by_mode": available_assets_by_mode,
        "missing_assets_by_mode": missing_assets_by_mode,
        "available_case_count": len(available_cases),
        "skipped_case_count": len(skipped_cases),
        "available_cases": available_cases,
        "skipped_cases": skipped_cases,
    }


def write_markdown(path: Path, matrix: dict[str, Any]) -> None:
    lines = [
        "# SETA AI Briefing Scale Matrix",
        "",
        f"Generated: {matrix['generated_at_utc']}",
        f"Manifest: `{matrix['manifest_path']}`",
        f"Reviewed briefing payload: `{matrix.get('manifest_reviewed_briefings_url') or 'n/a'}`",
        "",
        "## Summary",
        "",
        f"- Available cases: {matrix['available_case_count']}",
        f"- Skipped cases: {matrix['skipped_case_count']}",
        "",
        "## Mode coverage",
        "",
    ]
    for mode, configured in matrix["configured_assets_by_mode"].items():
        available = matrix["available_assets_by_mode"].get(mode, [])
        missing = matrix["missing_assets_by_mode"].get(mode, [])
        lines.extend(
            [
                f"### {mode}",
                "",
                f"- Configured assets: {len(configured)}",
                f"- Available assets: {len(available)}",
                f"- Missing configured assets: {', '.join(missing) if missing else 'none'}",
                "",
            ]
        )

    lines.extend(["## Available cases", ""])
    for row in matrix["available_cases"]:
        lines.append(
            f"- `{row['case_id']}` - rows {row['row_count']} - `{row['asset_payload_url']}`"
        )
    if not matrix["available_cases"]:
        lines.append("- none")
    lines.append("")

    lines.extend(["## Skipped cases", ""])
    for row in matrix["skipped_cases"]:
        reason = row.get("reason") or row.get("status")
        lines.append(f"- `{row['case_id']}` - {reason}")
    if not matrix["skipped_cases"]:
        lines.append("- none")
    lines.append("")

    lines.extend(
        [
            "## Next commands",
            "",
            "Build local inputs for available cases before creating prompt packs or calling a provider.",
            "",
            "Example:",
            "",
            "```powershell",
        ]
    )
    for row in matrix["available_cases"][:8]:
        lines.append(row["input_command"])
    lines.extend(["```", ""])
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text("\n".join(lines).rstrip() + "\n", encoding="utf-8")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--manifest", default=str(DEFAULT_MANIFEST), help="Path to dashboard_fix26_mode_manifest.json")
    parser.add_argument("--context", action="append", type=parse_context, help="mode,frequency,display_range,min_rows[,required]. May be repeated.")
    parser.add_argument("--output-dir", default=None, help="Output directory. Defaults to briefing_outputs/scale_matrix/<UTC stamp>.")
    parser.add_argument("--json", default="scale_matrix.json", help="JSON output filename.")
    parser.add_argument("--markdown", default="scale_matrix.md", help="Markdown output filename.")
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    manifest_path = Path(args.manifest).resolve()
    contexts = args.context or DEFAULT_CONTEXTS
    output_dir = Path(args.output_dir).resolve() if args.output_dir else DEFAULT_OUTPUT_DIR / utc_stamp()
    matrix = build_matrix(manifest_path, contexts)
    json_path = output_dir / args.json
    markdown_path = output_dir / args.markdown
    write_json(json_path, matrix)
    write_markdown(markdown_path, matrix)
    print(f"[OK] wrote {json_path}")
    print(f"[OK] wrote {markdown_path}")
    print(f"[OK] available cases: {matrix['available_case_count']}")
    print(f"[OK] skipped cases: {matrix['skipped_case_count']}")
    for mode, missing in matrix["missing_assets_by_mode"].items():
        if missing:
            print(f"[WARN] {mode} missing configured assets: {', '.join(missing)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
