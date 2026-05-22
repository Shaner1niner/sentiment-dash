from __future__ import annotations

"""Static smoke test for the Dislocation Context Cards surface.

This smoke intentionally does not require a browser or live CSV export. It
protects the read-only product contract and the page's required export schema.
"""

from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CONTRACT = ROOT / "docs" / "dislocation_context_cards_contract.md"
PAGE = ROOT / "seta_dislocation_context_cards.html"
QA_RUNNER = ROOT / "scripts" / "run_public_dashboard_qa.py"


def fail(message: str) -> None:
    raise SystemExit(f"[FAIL] {message}")


def ok(message: str) -> None:
    print(f"[OK] {message}")


def require(path: Path) -> str:
    if not path.exists():
        fail(f"missing {path.relative_to(ROOT)}")
    return path.read_text(encoding="utf-8")


def main() -> int:
    contract_text = require(CONTRACT)
    page_text = require(PAGE)
    qa_text = require(QA_RUNNER)

    for token in [
        "Dislocation Context Cards Contract",
        "read-only research context surface",
        "Prediction Intelligence Engine export",
        "not a trading system",
        "tuning interface",
        "promotion engine",
        "not exactly one lead rule",
        "no baseline/control rule",
        "risk guard language",
    ]:
        if token not in contract_text:
            fail(f"contract missing token: {token}")
    ok("contract documents read-only purpose and validation boundaries")

    required_columns = [
        "rule_id",
        "dashboard_tier",
        "dashboard_label",
        "dashboard_status",
        "is_lead_rule",
        "is_baseline_rule",
        "forward_row_count",
        "forward_3d_available_count",
        "forward_3d_pending_count",
        "maturity_score",
        "maturity_level",
        "risk_guard_language",
        "public_copy_short",
        "public_copy_detail",
    ]
    for column in required_columns:
        if column not in contract_text:
            fail(f"contract missing required column: {column}")
        if f'"{column}"' not in page_text:
            fail(f"page requiredColumns missing: {column}")
    ok("contract and page preserve required export schema")

    for token in [
        "SETA Dislocation Context Cards",
        "SETA research context",
        "Dislocation Context Cards",
        "Read-only dashboard stub powered by the Prediction Intelligence Engine export",
        "does not compute, tune, or promote trading rules",
        "public_content/dislocation_dashboard_export.csv",
        "?data=path/to/dislocation_dashboard_export.csv",
    ]:
        if token not in page_text:
            fail(f"page missing copy/source token: {token}")
    ok("page preserves reader-facing non-trading framing and source path")

    for token in [
        "Expected exactly one lead rule",
        "Expected at least one baseline rule",
        "Export is missing required columns",
        "Export loaded but contains no rows",
        "Dislocation export could not be loaded",
    ]:
        if token not in page_text:
            fail(f"page missing validation/error token: {token}")
    ok("page preserves export validation and visible error state")

    for token in [
        "renderLead(row)",
        "renderMini(row)",
        "risk_guard_language",
        "forward_3d_available_count",
        "forward_3d_pending_count",
        "maturity_score",
        "maturity_level",
        "Baselines & monitors",
        "status-strip",
    ]:
        if token not in page_text:
            fail(f"page missing layout/render token: {token}")
    ok("page preserves lead-card, monitor-card, and evidence layout")

    for blocked in [
        "buy signal",
        "sell signal",
        "price target",
        "trade instruction",
        "execute trade",
        "auto promote",
    ]:
        if blocked in page_text.lower():
            fail(f"page should not include trading/promotion framing: {blocked}")
    ok("page avoids trading and automatic-promotion framing")

    if "smoke_dislocation_context_cards_contract.py" not in qa_text:
        fail("public dashboard QA runner does not include context cards contract smoke")
    ok("public dashboard QA bundle includes context cards contract smoke")

    print("[OK] dislocation context cards contract smoke passed")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
