from __future__ import annotations

"""Read-only indicator continuity audit for Fix 26 chart payloads.

Detects unexpected null runs in key rolling indicators after their expected
warmup windows. This is designed to catch payload/data holes such as RSI or
Stoch RSI resetting mid-history after a DB backfill.

Default mode audits generated member payload JSON files. DB mode can be added
later, but this script intentionally does not write payloads or database rows.
"""

import argparse
import json
from dataclasses import dataclass, asdict
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[1]
DEFAULT_MANIFEST = ROOT / "dashboard_fix26_mode_manifest.json"
DEFAULT_PAYLOAD_DIR = ROOT / "fix26_chart_store_assets" / "member"

INDICATOR_CONFIG = {
    "rsi": {"warmup": 28, "max_mid_null_run": 0},
    "sentiment_rsi": {"warmup": 28, "max_mid_null_run": 0},
    "stochastic_rsi": {"warmup": 62, "max_mid_null_run": 0},
    "stochastic_rsi_d": {"warmup": 66, "max_mid_null_run": 0},
    "sentiment_stochastic_rsi_d": {"warmup": 66, "max_mid_null_run": 0},
}

NULL_VALUES = {None, "", "NaN", "nan", "None", "null"}


@dataclass
class NullRun:
    term: str
    indicator: str
    start_date: str
    end_date: str
    length: int
    start_index: int
    end_index: int


@dataclass
class IndicatorSummary:
    term: str
    indicator: str
    row_count: int
    null_count: int
    first_date: str | None
    last_date: str | None
    warmup: int
    unexpected_null_run_count: int
    max_unexpected_null_run: int


def load_json(path: Path) -> dict[str, Any]:
    with path.open("r", encoding="utf-8") as f:
        return json.load(f)


def manifest_assets(manifest_path: Path, mode: str) -> list[str]:
    manifest = load_json(manifest_path)
    seen: set[str] = set()
    out: list[str] = []
    for raw in manifest.get("modes", {}).get(mode, {}).get("assets", []):
        term = str(raw).strip().upper()
        if term and term not in seen:
            seen.add(term)
            out.append(term)
    return out


def load_payload_rows(payload_dir: Path, term: str) -> list[dict[str, Any]]:
    path = payload_dir / f"{term}.json"
    if not path.exists():
        return []
    data = load_json(path)
    rows = data.get("D", {}).get(term)
    if isinstance(rows, list):
        return [r for r in rows if isinstance(r, dict)]
    return []


def is_null(value: Any) -> bool:
    return value in NULL_VALUES


def find_unexpected_null_runs(rows: list[dict[str, Any]], term: str, indicator: str, warmup: int) -> list[NullRun]:
    runs: list[NullRun] = []
    current_start: int | None = None

    for idx, row in enumerate(rows):
        if idx < warmup:
            continue
        missing = is_null(row.get(indicator))
        if missing and current_start is None:
            current_start = idx
        elif not missing and current_start is not None:
            runs.append(build_run(rows, term, indicator, current_start, idx - 1))
            current_start = None

    if current_start is not None:
        runs.append(build_run(rows, term, indicator, current_start, len(rows) - 1))

    return runs


def build_run(rows: list[dict[str, Any]], term: str, indicator: str, start: int, end: int) -> NullRun:
    return NullRun(
        term=term,
        indicator=indicator,
        start_date=str(rows[start].get("date", "")),
        end_date=str(rows[end].get("date", "")),
        length=end - start + 1,
        start_index=start,
        end_index=end,
    )


def summarize_indicator(rows: list[dict[str, Any]], term: str, indicator: str, warmup: int, runs: list[NullRun]) -> IndicatorSummary:
    return IndicatorSummary(
        term=term,
        indicator=indicator,
        row_count=len(rows),
        null_count=sum(1 for row in rows if is_null(row.get(indicator))),
        first_date=str(rows[0].get("date")) if rows else None,
        last_date=str(rows[-1].get("date")) if rows else None,
        warmup=warmup,
        unexpected_null_run_count=len(runs),
        max_unexpected_null_run=max([run.length for run in runs], default=0),
    )


def build_report(args: argparse.Namespace) -> dict[str, Any]:
    payload_dir = Path(args.payload_dir)
    manifest_path = Path(args.manifest)

    terms = [t.strip().upper() for t in args.terms.split(",") if t.strip()] if args.terms else manifest_assets(manifest_path, args.mode)
    terms = list(dict.fromkeys(terms))

    summaries: list[IndicatorSummary] = []
    unexpected_runs: list[NullRun] = []
    missing_payloads: list[str] = []

    for term in terms:
        rows = load_payload_rows(payload_dir, term)
        if not rows:
            missing_payloads.append(term)
            continue
        for indicator, config in INDICATOR_CONFIG.items():
            warmup = int(config["warmup"])
            runs = find_unexpected_null_runs(rows, term, indicator, warmup)
            unexpected_runs.extend(runs)
            summaries.append(summarize_indicator(rows, term, indicator, warmup, runs))

    severity = "pass"
    if missing_payloads:
        severity = "fail"
    if unexpected_runs:
        severity = "fail"

    return {
        "mode": args.mode,
        "payload_dir": str(payload_dir),
        "manifest": str(manifest_path),
        "term_count": len(terms),
        "terms": terms,
        "indicator_count": len(INDICATOR_CONFIG),
        "indicators": list(INDICATOR_CONFIG),
        "missing_payloads": missing_payloads,
        "unexpected_null_run_count": len(unexpected_runs),
        "max_unexpected_null_run": max([run.length for run in unexpected_runs], default=0),
        "unexpected_null_runs": [asdict(run) for run in unexpected_runs[: args.limit]],
        "summary": [asdict(item) for item in summaries[: args.summary_limit]],
        "severity": severity,
    }


def print_report(report: dict[str, Any]) -> None:
    print("Indicator Continuity Audit v1")
    print("=" * 80)
    for key in [
        "mode",
        "term_count",
        "indicator_count",
        "missing_payloads",
        "unexpected_null_run_count",
        "max_unexpected_null_run",
        "severity",
    ]:
        print(f"{key}: {report.get(key)}")

    print("\nUnexpected null runs:")
    runs = report.get("unexpected_null_runs") or []
    if not runs:
        print("  none")
    for run in runs:
        print(
            "  {term:<6} {indicator:<30} {start_date} -> {end_date} "
            "length={length} index={start_index}-{end_index}".format(**run)
        )


def main() -> int:
    parser = argparse.ArgumentParser(description="Audit generated chart payloads for unexpected mid-history indicator null runs.")
    parser.add_argument("--manifest", default=str(DEFAULT_MANIFEST))
    parser.add_argument("--payload-dir", default=str(DEFAULT_PAYLOAD_DIR))
    parser.add_argument("--mode", default="member", choices=["member", "public"])
    parser.add_argument("--terms", help="Comma-separated terms to audit. Defaults to manifest mode assets.")
    parser.add_argument("--limit", type=int, default=50, help="Maximum unexpected runs to print/emit.")
    parser.add_argument("--summary-limit", type=int, default=500, help="Maximum summary rows to emit in JSON.")
    parser.add_argument("--json", action="store_true")
    parser.add_argument("--warn-only", action="store_true", help="Always exit 0 even when continuity failures are found.")
    args = parser.parse_args()

    report = build_report(args)
    if args.json:
        print(json.dumps(report, indent=2, default=str))
    else:
        print_report(report)

    if args.warn_only:
        return 0
    return 1 if report.get("severity") == "fail" else 0


if __name__ == "__main__":
    raise SystemExit(main())
