from __future__ import annotations

from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
INDEX_PATH = ROOT / "index.html"
UI_PATH = ROOT / "src" / "evidence_card_ui.js"
READER_PATH = ROOT / "src" / "evidence_handoff_reader.js"


def test_index_has_evidence_card_mount_surface():
    html = INDEX_PATH.read_text(encoding="utf-8")
    assert "data-seta-evidence-section" in html
    assert "id=\"seta-evidence-card-root\"" in html
    assert "data-seta-evidence-card" in html
    assert "data-status-url=\"seta_bundles/latest/evidence/evidence_refresh_status.json\"" in html
    assert "src/evidence_handoff_reader.js" in html
    assert "src/evidence_card_ui.js" in html


def test_evidence_card_ui_preserves_public_safety_guardrail():
    source = UI_PATH.read_text(encoding="utf-8")
    assert "Historical diagnostic only; not a trade signal, recommendation, or price forecast." in source
    assert "PRIMARY_ARCHETYPE = \"attention_validation\"" in source
    assert "resolveStatusUrl" in source
    assert "statusUrl" in source
    assert "seta_bundles/latest/evidence/dashboard_evidence_payload.json" in READER_PATH.read_text(encoding="utf-8")
    assert "Historical / archived validation sample" in READER_PATH.read_text(encoding="utf-8")


def test_evidence_card_ui_fails_closed_when_payload_missing():
    source = UI_PATH.read_text(encoding="utf-8")
    assert "catch (error)" in source
    assert "hideEvidenceSection" in source
    assert "return null" in source


def test_evidence_card_ui_uses_existing_reader_contract():
    source = UI_PATH.read_text(encoding="utf-8")
    assert "SETAEvidenceHandoff" in source
    assert "loadAndRenderEvidenceHandoff" in source
    assert "primaryArchetype: PRIMARY_ARCHETYPE" in source


def test_evidence_reader_displays_freshness_metadata_and_rejects_current_tense():
    source = READER_PATH.read_text(encoding="utf-8")

    assert "Sample window" in source
    assert "Generated" in source
    assert "As of" in source
    assert "CURRENT_TENSE_PHRASES" in source
    assert "currently shows" in source
    assert "primary card public_takeaway uses current-tense stale-risk phrase" in source
