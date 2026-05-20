from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
module = ROOT / "src" / "features" / "ResearchSourceMixPanel.js"
entry = ROOT / "src" / "dashboard_main.js"


def fail(message: str) -> None:
    raise SystemExit(f"[FAIL] {message}")


def ok(message: str) -> None:
    print(f"[OK] {message}")


for path in [module, entry]:
    if not path.exists():
        fail(f"missing {path.relative_to(ROOT)}")

module_text = module.read_text(encoding="utf-8")
entry_text = entry.read_text(encoding="utf-8")

for token in [
    "module_research_source_mix_panel_001",
    "research_source_mix_contract.json",
    "research_source_mix",
    "recordForAsset",
    "activeWeights",
    "Research Source Mix",
    "Optimized source contribution for this read.",
    "html[data-seta-view-mode=\"briefing\"] .moduleResearchSourceMixPanel",
    "normalizedViewMode() !== 'research'",
    "data-research-source-mix-panel",
    "Research-only diagnostic.",
]:
    if token not in module_text:
        fail(f"Research Source Mix panel missing token: {token}")

ok("Research Source Mix panel is contract-backed and Research-mode only")

if "ResearchSourceMixPanel.js?v=module_research_source_mix_panel_001" not in entry_text:
    fail("dashboard entrypoint does not load ResearchSourceMixPanel")

ok("dashboard entrypoint loads Research Source Mix panel module")
