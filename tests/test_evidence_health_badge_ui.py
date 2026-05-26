from __future__ import annotations

from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
INDEX = ROOT / "index.html"
BADGE = ROOT / "src" / "evidence_health_badge.js"


def test_homepage_has_evidence_health_badge_mount_and_script():
    html = INDEX.read_text(encoding="utf-8")

    assert "data-seta-evidence-health-badge" in html
    assert "seta_bundles/latest/evidence/evidence_refresh_status.json" in html
    assert "src/evidence_health_badge.js" in html


def test_evidence_health_badge_uses_status_artifact_and_expected_copy():
    source = BADGE.read_text(encoding="utf-8")

    assert "evidence_refresh_status.json" in source
    assert "Evidence Handoff: Healthy" in source
    assert "Latest:" in source
    assert "Status:" in source


def test_evidence_health_badge_fails_closed_without_prediction_language():
    source = BADGE.read_text(encoding="utf-8")

    assert "target.hidden = true" in source
    assert 'status.status === "pass"' in source
    assert "payload.valid === true" in source
    assert "prediction" not in source.lower()
    assert "trade signal" not in source.lower()
    assert "recommendation" not in source.lower()
    assert "price forecast" not in source.lower()
