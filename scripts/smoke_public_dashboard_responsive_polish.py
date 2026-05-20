from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
module = ROOT / "src" / "features" / "PublicDashboardResponsivePolish.js"
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
    "module_public_dashboard_responsive_polish_001",
    "overflow-x: hidden",
    "grid-template-columns: repeat(auto-fit, minmax(142px, 1fr))",
    "@media (hover: none), (pointer: coarse)",
    "modebar-container",
    "gtitle",
    "@media (max-width: 900px)",
    "@media (max-width: 720px)",
    "@media (max-width: 460px)",
    "moduleMarketTapeGrid",
    "moduleBriefingGrid",
    "moduleChartGuideGrid",
    "moduleMarketTapeBriefingCompact",
    "#chart",
    "data-public-responsive-polish",
]:
    if token not in module_text:
        fail(f"responsive polish module missing token: {token}")

ok("responsive polish module protects narrow-screen layout and mobile chart chrome")

if "PublicDashboardResponsivePolish.js?v=module_public_dashboard_responsive_polish_001" not in entry_text:
    fail("dashboard entrypoint does not load PublicDashboardResponsivePolish")

ok("dashboard entrypoint loads responsive polish module")
