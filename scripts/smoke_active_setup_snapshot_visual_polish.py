from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
module = ROOT / "src" / "features" / "ActiveSetupSnapshotVisualPolish.js"
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
    "module_active_setup_snapshot_visual_polish_001",
    "toneForScore",
    "isWeak",
    "isMixed",
    "isStrong",
    "data-structure-score-tone",
    "moduleMarketTapeStructureMeter",
    "moduleMarketTapeTrendBody svg",
    "width: 100%",
    "MutationObserver",
]:
    if token not in module_text:
        fail(f"visual polish module missing token: {token}")

ok("Active Setup Snapshot visual polish module protects score tones and wider trend sparkline")

if "ActiveSetupSnapshotVisualPolish.js?v=module_active_setup_snapshot_visual_polish_001" not in entry_text:
    fail("dashboard entrypoint does not load ActiveSetupSnapshotVisualPolish")

ok("dashboard entrypoint loads Active Setup Snapshot visual polish")
