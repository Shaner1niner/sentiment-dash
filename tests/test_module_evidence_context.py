from __future__ import annotations

from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DASHBOARD = ROOT / "interactive_dashboard_fix24_public_embed.html"
FEATURE = ROOT / "src" / "features" / "ModuleEvidenceContext.js"


def test_module_dashboard_loads_evidence_context_scripts():
    html = DASHBOARD.read_text(encoding="utf-8")

    assert "src/evidence_handoff_reader.js" in html
    assert "src/evidence_card_ui.js" in html
    assert "src/features/ModuleEvidenceContext.js" in html


def test_module_evidence_context_uses_existing_payload_and_mount_contract():
    source = FEATURE.read_text(encoding="utf-8")

    assert "module-evidence-context" in source
    assert "data-seta-evidence-section" in source
    assert "data-seta-evidence-card" in source
    assert "seta_bundles/latest/evidence/dashboard_evidence_payload.json" in source
    assert "window.SETAEvidenceCardUI.mountEvidenceCard" in source


def test_module_evidence_context_preserves_public_safety_framing():
    source = FEATURE.read_text(encoding="utf-8")

    assert "diagnostic context only" in source
    assert "not a prediction or trade instruction" in source
    assert "attention_validation" in source
