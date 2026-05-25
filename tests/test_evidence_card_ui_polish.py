from __future__ import annotations

from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
READER_PATH = ROOT / "src" / "evidence_handoff_reader.js"
UI_PATH = ROOT / "src" / "evidence_card_ui.js"


def test_evidence_reader_groups_each_metric_label_with_its_value():
    source = READER_PATH.read_text(encoding="utf-8")

    assert "function appendMetricFact" in source
    assert 'item.className = "seta-evidence-fact"' in source
    assert 'appendTextElement(documentRef, item, "dt", "", label)' in source
    assert 'appendTextElement(documentRef, item, "dd", "", String(value))' in source
    assert "rows.forEach(([label, value]) => appendMetricFact(documentRef, facts, label, value));" in source


def test_evidence_card_css_styles_grouped_metric_items():
    source = UI_PATH.read_text(encoding="utf-8")

    assert ".seta-evidence-fact" in source
    assert "align-content: start" in source
    assert "grid-template-columns: repeat(3, minmax(0, 1fr))" in source
    assert ".seta-evidence-facts dd" in source
    assert "margin: 0" in source


def test_evidence_card_polish_preserves_existing_contracts():
    reader_source = READER_PATH.read_text(encoding="utf-8")
    ui_source = UI_PATH.read_text(encoding="utf-8")

    assert "seta_bundles/latest/evidence/dashboard_evidence_payload.json" in reader_source
    assert "Historical diagnostic only; not a trade signal, recommendation, or price forecast." in reader_source
    assert "Historical diagnostic only; not a trade signal, recommendation, or price forecast." in ui_source
    assert 'PRIMARY_ARCHETYPE = "attention_validation"' in ui_source
    assert "loadAndRenderEvidenceHandoff" in ui_source
