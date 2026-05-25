from __future__ import annotations

from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
HOMEPAGE = ROOT / "index.html"

MOJIBAKE_PATTERNS = [
    "â€”",
    "â€“",
    "â€˜",
    "â€™",
    "â€œ",
    "â€�",
    "Â ",
]


def test_homepage_copy_has_no_common_mojibake_artifacts():
    html = HOMEPAGE.read_text(encoding="utf-8")

    for pattern in MOJIBAKE_PATTERNS:
        assert pattern not in html


def test_homepage_declares_utf8_encoding():
    html = HOMEPAGE.read_text(encoding="utf-8").lower()
    assert '<meta charset="utf-8"' in html
