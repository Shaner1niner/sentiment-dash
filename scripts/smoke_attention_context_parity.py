from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
renderer = ROOT / "src" / "PlotlyRenderer.js"


def fail(message: str) -> None:
    raise SystemExit(f"[FAIL] {message}")


def ok(message: str) -> None:
    print(f"[OK] {message}")


if not renderer.exists():
    fail(f"missing {renderer.relative_to(ROOT)}")

text = renderer.read_text(encoding="utf-8")

required_tokens = [
    "function buildAttentionMarkerTraces",
    "function attentionMarkerRows",
    "function attentionContextHoverFragment",
    "function keywordSummaryFromRow",
    "MODULE_TFIDF_TEXT_FIELDS",
    "MODULE_TFIDF_TOKEN_FIELDS",
    "Narrative keywords",
    "Attention Highlights",
    "attention === 'overlay' || attention === 'overlay_marks'",
    "modes.attention !== 'off'",
    "customdata: attentionContext",
]

for token in required_tokens:
    if token not in text:
        fail(f"PlotlyRenderer missing attention context token: {token}")

ok("attention context helpers and marker traces are present")

old_forced_overlay_patterns = [
    "scaleMode === 'all_visible' || attention === 'overlay'",
    "attention === 'overlay' || scaleMode === 'all_visible'",
    "scaleMode === 'all_visible' || attention === 'overlay_marks'",
    "attention === 'overlay_marks' || scaleMode === 'all_visible'",
]

for pattern in old_forced_overlay_patterns:
    if pattern in text:
        fail(f"all_visible still forces attention overlay: {pattern}")

ok("all_visible does not force the attention overlay")

if "attention_level_score'" in text and "name: 'Attention Level'" in text:
    fail("continuous Attention Level line appears to remain available")

ok("continuous attention line is not protected as the active overlay behavior")
