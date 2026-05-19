from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
module = ROOT / "src" / "features" / "BriefingPanel.js"


def fail(message: str) -> None:
    raise SystemExit(f"[FAIL] {message}")


def ok(message: str) -> None:
    print(f"[OK] {message}")


if not module.exists():
    fail(f"missing {module.relative_to(ROOT)}")

text = module.read_text(encoding="utf-8")

for token in [
    "BRIEFING_VISIBLE_EVIDENCE_ITEMS = 3",
    "RESEARCH_VISIBLE_EVIDENCE_ITEMS = 6",
    "currentViewMode",
    "evidenceLimitForState",
    "normalizeEvidenceItems",
    "moduleBriefingMoreEvidence",
    "more reviewed receipt",
    "Research mode / source briefing",
    "data-view-mode",
]:
    if token not in text:
        fail(f"BriefingPanel density guard missing token: {token}")

ok("Briefing evidence density is capped and View-mode aware")
