from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
module = ROOT / "src" / "features" / "PublicDashboardIntroCopy.js"
entry = ROOT / "src" / "dashboard_main.js"
public_embed = ROOT / "interactive_dashboard_fix24_public_embed.html"


def fail(message: str) -> None:
    raise SystemExit(f"[FAIL] {message}")


def ok(message: str) -> None:
    print(f"[OK] {message}")


for path in [module, entry, public_embed]:
    if not path.exists():
        fail(f"missing {path.relative_to(ROOT)}")

module_text = module.read_text(encoding="utf-8")
entry_text = entry.read_text(encoding="utf-8")
embed_text = public_embed.read_text(encoding="utf-8")

for token in [
    "module_public_dashboard_intro_copy_001",
    "Read attention, sentiment, structure, and confirmation context in one view.",
    "SETA explains market emotion and setup quality",
    "SETA Public Dashboard | Attention, Sentiment, Structure",
    "applyPublicDashboardIntroCopy",
]:
    if token not in module_text:
        fail(f"intro copy module missing token: {token}")
ok("public dashboard intro copy module contains expected reader framing")

if "PublicDashboardIntroCopy.js?v=module_public_dashboard_intro_copy_001" not in entry_text:
    fail("dashboard module entrypoint does not load PublicDashboardIntroCopy")
ok("dashboard module entrypoint loads public intro copy module")

if "Production public module runtime surface" not in embed_text:
    fail("public embed no longer contains original fallback text for patch targeting")
ok("public embed still exposes fallback subtitle for JS copy patch")
