from __future__ import annotations

import argparse
import csv
import json
import math
import re
from pathlib import Path
from statistics import mean, pstdev

SCORE_NAME_PATTERNS = [
    "score",
    "strength",
    "confidence",
    "priority",
    "conviction",
    "dispersion",
    "breadth",
    "regime",
    "level",
    "rank",
    "percentile",
    "zscore",
    "rsi",
    "macd",
    "stoch",
    "volatility",
    "momentum",
]

EXCLUDE_NAME_PATTERNS = [
    "date",
    "time",
    "url",
    "text",
    "title",
    "summary",
    "label",
    "family",
    "source",
    "asset",
    "term",
    "ticker",
    "symbol",
    "id",
]

PUBLIC_FIELD_FLAGS = [
    "formula",
    "raw",
    "internal",
    "debug",
    "intermediate",
    "component",
]


def parse_number(value):
    if value is None:
        return None
    text = str(value).strip()
    if not text or text.lower() in {"nan", "none", "null", "inf", "-inf"}:
        return None
    text = text.replace(",", "")
    try:
        value = float(text)
    except ValueError:
        return None
    if math.isnan(value) or math.isinf(value):
        return None
    return value


def percentile(values, q):
    if not values:
        return None
    xs = sorted(values)
    if len(xs) == 1:
        return xs[0]
    pos = (len(xs) - 1) * q
    lo = math.floor(pos)
    hi = math.ceil(pos)
    if lo == hi:
        return xs[lo]
    return xs[lo] * (hi - pos) + xs[hi] * (pos - lo)


def round_threshold(value):
    if value is None:
        return None
    value = float(value)
    magnitude = abs(value)
    if magnitude >= 1000:
        return round(value / 100.0) * 100
    if magnitude >= 100:
        return round(value / 10.0) * 10
    if magnitude >= 20:
        return round(value / 5.0) * 5
    if magnitude >= 5:
        return round(value / 2.5) * 2.5
    return round(value, 1)


def column_is_candidate(name):
    lower = name.lower()
    if any(token in lower for token in EXCLUDE_NAME_PATTERNS):
        return False
    return any(token in lower for token in SCORE_NAME_PATTERNS)


def classify_field(name, values):
    lower = name.lower()
    if not values:
        return "empty"

    min_v = min(values)
    max_v = max(values)

    if min_v < 0 < max_v:
        if "signed" in lower or "conviction" in lower or "direction" in lower:
            return "signed_score"
        return "signed_numeric"

    if min_v >= 0 and max_v <= 1.05:
        return "unit_score_0_1"

    if min_v >= 0 and max_v <= 105:
        if "rsi" in lower or "percent" in lower or "pct" in lower:
            return "bounded_0_100_indicator"
        return "bounded_0_100_score"

    if "rank" in lower:
        return "rank"

    return "numeric_other"


def label_bins_for_field(field_kind, stats):
    p10 = stats["p10"]
    p25 = stats["p25"]
    p50 = stats["p50"]
    p75 = stats["p75"]
    p90 = stats["p90"]
    p95 = stats["p95"]

    if field_kind == "signed_score":
        center = max(abs(p25 or 0), abs(p75 or 0), 8)
        mid = max(abs(p10 or 0), abs(p90 or 0), 20)
        high = max(abs(stats["p05"] or 0), abs(stats["p95"] or 0), 35)

        weak = round_threshold(center)
        medium = round_threshold(mid)
        strong = round_threshold(high)

        return [
            {"label": "Strong risk-off", "range": f"<= -{strong:g}"},
            {"label": "Risk-off", "range": f"-{strong:g} to -{medium:g}"},
            {"label": "Leaning risk-off", "range": f"-{medium:g} to -{weak:g}"},
            {"label": "Mixed / weak", "range": f"-{weak:g} to +{weak:g}"},
            {"label": "Leaning constructive", "range": f"+{weak:g} to +{medium:g}"},
            {"label": "Constructive", "range": f"+{medium:g} to +{strong:g}"},
            {"label": "Strong constructive", "range": f">= +{strong:g}"},
        ]

    if field_kind in {"bounded_0_100_score", "bounded_0_100_indicator"}:
        cuts = [
            round_threshold(p10),
            round_threshold(p25),
            round_threshold(p75),
            round_threshold(p90),
            round_threshold(p95),
        ]
        # Ensure monotonic-ish readable cuts.
        cleaned = []
        for cut in cuts:
            if cut is None:
                continue
            if not cleaned or cut > cleaned[-1]:
                cleaned.append(cut)
        while len(cleaned) < 5:
            base = cleaned[-1] if cleaned else 10
            cleaned.append(base + 10)

        a, b, c, d, e = cleaned[:5]
        return [
            {"label": "Quiet / Low", "range": f"< {a:g}"},
            {"label": "Baseline", "range": f"{a:g} to {b:g}"},
            {"label": "Active / Medium", "range": f"{b:g} to {c:g}"},
            {"label": "Elevated", "range": f"{c:g} to {d:g}"},
            {"label": "High", "range": f"{d:g} to {e:g}"},
            {"label": "Extreme", "range": f">= {e:g}"},
        ]

    return []


def exposure_recommendation(name, field_kind):
    lower = name.lower()
    if any(token in lower for token in PUBLIC_FIELD_FLAGS):
        return "internal_only"
    if field_kind in {"signed_score", "bounded_0_100_score", "bounded_0_100_indicator"}:
        return "public_label_ok_raw_score_member_only"
    if field_kind == "rank":
        return "public_rank_ok_if_rounded"
    return "internal_review"


def main():
    parser = argparse.ArgumentParser(description="Audit SETA score/label ranges from chart-history CSV.")
    parser.add_argument(
        "--csv",
        default=r"C:\Users\shane\snt_exports\final_combined_data_enriched_chart_history.csv",
        help="Path to final_combined_data_enriched_chart_history.csv",
    )
    parser.add_argument(
        "--glossary",
        default="All_Column_Descriptions_enriched_business_glossary_grouped_v4_ATTENTION_INTEGRATED_608cols.csv",
        help="Optional glossary CSV path.",
    )
    parser.add_argument("--outdir", default="analysis/score_label_range_audit")
    parser.add_argument("--top", type=int, default=160)
    args = parser.parse_args()

    csv_path = Path(args.csv)
    if not csv_path.exists():
        fallback = Path("final_combined_data_enriched_chart_history.csv")
        if fallback.exists():
            csv_path = fallback
        else:
            raise FileNotFoundError(f"Could not find chart-history CSV: {args.csv}")

    outdir = Path(args.outdir)
    outdir.mkdir(parents=True, exist_ok=True)

    with csv_path.open("r", encoding="utf-8-sig", newline="") as f:
        reader = csv.DictReader(f)
        rows = list(reader)
        fieldnames = reader.fieldnames or []

    glossary = {}
    glossary_path = Path(args.glossary)
    if glossary_path.exists():
        with glossary_path.open("r", encoding="utf-8-sig", newline="") as f:
            reader = csv.DictReader(f)
            for row in reader:
                key = (
                    row.get("column_name")
                    or row.get("Column")
                    or row.get("field")
                    or row.get("name")
                    or ""
                ).strip()
                if key:
                    glossary[key] = row

    audit_rows = []
    recommendations = {}

    for name in fieldnames:
        if not column_is_candidate(name):
            continue

        values = [parse_number(row.get(name)) for row in rows]
        values = [value for value in values if value is not None]
        non_null = len(values)

        if non_null < max(20, len(rows) * 0.02):
            continue

        stats = {
            "field": name,
            "kind": classify_field(name, values),
            "rows": len(rows),
            "non_null": non_null,
            "null_pct": round(100 * (1 - non_null / max(1, len(rows))), 2),
            "min": min(values),
            "p01": percentile(values, 0.01),
            "p05": percentile(values, 0.05),
            "p10": percentile(values, 0.10),
            "p25": percentile(values, 0.25),
            "p50": percentile(values, 0.50),
            "p75": percentile(values, 0.75),
            "p90": percentile(values, 0.90),
            "p95": percentile(values, 0.95),
            "p99": percentile(values, 0.99),
            "max": max(values),
            "mean": mean(values),
            "std": pstdev(values) if len(values) > 1 else 0,
            "neg_pct": round(100 * sum(1 for value in values if value < 0) / non_null, 2),
            "zero_pct": round(100 * sum(1 for value in values if value == 0) / non_null, 2),
            "pos_pct": round(100 * sum(1 for value in values if value > 0) / non_null, 2),
        }

        stats["suggested_public_exposure"] = exposure_recommendation(name, stats["kind"])
        stats["glossary_group"] = glossary.get(name, {}).get("group", "")
        stats["glossary_description"] = (
            glossary.get(name, {}).get("description")
            or glossary.get(name, {}).get("business_description")
            or ""
        )

        for key, value in list(stats.items()):
            if isinstance(value, float):
                stats[key] = round(value, 4)

        audit_rows.append(stats)

        bins = label_bins_for_field(stats["kind"], stats)
        if bins:
            recommendations[name] = {
                "kind": stats["kind"],
                "suggested_public_exposure": stats["suggested_public_exposure"],
                "bins": bins,
            }

    audit_rows.sort(key=lambda row: (row["kind"], row["field"]))

    audit_csv = outdir / "score_label_range_audit.csv"
    with audit_csv.open("w", encoding="utf-8", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=list(audit_rows[0].keys()) if audit_rows else [])
        writer.writeheader()
        writer.writerows(audit_rows)

    rec_json = outdir / "score_label_recommendations.json"
    rec_json.write_text(json.dumps(recommendations, indent=2), encoding="utf-8")

    md = []
    md.append("# SETA Score Label Range Audit")
    md.append("")
    md.append("Internal calibration audit for score-like fields in the enriched chart-history dataset.")
    md.append("")
    md.append("## Dataset")
    md.append("")
    md.append(f"- Source CSV: `{csv_path}`")
    md.append(f"- Rows: `{len(rows):,}`")
    md.append(f"- Columns: `{len(fieldnames):,}`")
    md.append(f"- Audited score-like fields: `{len(audit_rows):,}`")
    md.append("")
    md.append("## Public exposure rule of thumb")
    md.append("")
    md.append("- Public dashboard should prefer labels over raw model/debug scores.")
    md.append("- Member/internal mode may show rounded raw scores where useful.")
    md.append("- Formula, raw, intermediate, component, and debug-like fields should remain internal.")
    md.append("")
    md.append("## Top calibration candidates")
    md.append("")
    for row in audit_rows[: args.top]:
        md.append(
            f"### `{row['field']}`"
        )
        md.append("")
        md.append(f"- Kind: `{row['kind']}`")
        md.append(f"- Suggested exposure: `{row['suggested_public_exposure']}`")
        md.append(
            "- Range: "
            f"min `{row['min']}`, p10 `{row['p10']}`, p50 `{row['p50']}`, "
            f"p90 `{row['p90']}`, p95 `{row['p95']}`, max `{row['max']}`"
        )
        if row["field"] in recommendations:
            md.append("- Suggested labels:")
            for item in recommendations[row["field"]]["bins"]:
                md.append(f"  - `{item['label']}`: {item['range']}")
        md.append("")

    report_md = outdir / "score_label_range_audit.md"
    report_md.write_text("\n".join(md), encoding="utf-8")

    print(f"[OK] wrote {audit_csv}")
    print(f"[OK] wrote {rec_json}")
    print(f"[OK] wrote {report_md}")
    print(f"[OK] audited {len(audit_rows)} score-like fields from {len(rows)} rows")


if __name__ == "__main__":
    main()
