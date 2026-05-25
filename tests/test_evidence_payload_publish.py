from __future__ import annotations

from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SCRIPT = ROOT / "scripts" / "publish_seta_evidence_handoff_to_bundle.ps1"
DOC = ROOT / "docs" / "evidence" / "evidence_payload_publish_v1.md"


def test_publish_script_exists_and_targets_expected_payload():
    text = SCRIPT.read_text(encoding="utf-8")
    assert "dashboard_evidence_payload.json" in text
    assert "outputs\\evidence\\handoff" in text
    assert "seta_bundles\\latest\\evidence" in text
    assert "check_evidence_handoff_payload.py" in text


def test_publish_script_has_safe_modes():
    text = SCRIPT.read_text(encoding="utf-8")
    assert "ValidateOnly" in text
    assert "DryRun" in text
    assert "Stage" in text
    assert "git -C $DashRoot add -f" in text


def test_publish_docs_preserve_safety_guardrail():
    text = DOC.read_text(encoding="utf-8")
    assert "Historical diagnostic only" in text
    assert "not a trade signal" in text
    assert "recommendation" in text
    assert "price forecast" in text


def test_publish_docs_warn_against_git_add_dot():
    text = DOC.read_text(encoding="utf-8")
    assert "Do not use `git add .`" in text
    assert "seta_bundles/latest/evidence/dashboard_evidence_payload.json" in text
