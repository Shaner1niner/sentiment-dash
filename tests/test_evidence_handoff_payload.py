from __future__ import annotations

import importlib.util
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SCRIPT_PATH = ROOT / "scripts" / "check_evidence_handoff_payload.py"
FIXTURE_PATH = ROOT / "tests" / "fixtures" / "evidence" / "dashboard_evidence_payload.json"

spec = importlib.util.spec_from_file_location("check_evidence_handoff_payload", SCRIPT_PATH)
checker = importlib.util.module_from_spec(spec)
assert spec.loader is not None
spec.loader.exec_module(checker)


def test_fixture_payload_is_valid():
    payload = checker.load_payload(FIXTURE_PATH)
    assert checker.validate_payload(payload) == []


def test_primary_card_can_be_found():
    payload = checker.load_payload(FIXTURE_PATH)
    card = checker.find_card(payload, "attention_validation")
    assert card is not None
    assert card["status"] == "constructive"


def test_missing_safety_note_fails_validation():
    payload = checker.load_payload(FIXTURE_PATH)
    payload["safety_note"] = ""
    errors = checker.validate_payload(payload)
    assert any("safety_note missing phrase" in err for err in errors)


def test_current_tense_takeaway_fails_validation():
    payload = checker.load_payload(FIXTURE_PATH)
    card = checker.find_card(payload, "attention_validation")
    assert card is not None
    card["public_takeaway"] = "Attention Validation currently shows constructive historical evidence."
    errors = checker.validate_payload(payload)
    assert any("current-tense" in err for err in errors)


def test_archival_payload_requires_generated_metadata():
    payload = checker.load_payload(FIXTURE_PATH)
    payload.pop("generated_at_utc", None)
    payload.pop("as_of", None)
    errors = checker.validate_payload(payload)
    assert any("generated_at_utc/as_of" in err for err in errors)


def test_wrong_primary_archetype_fails_validation():
    payload = checker.load_payload(FIXTURE_PATH)
    payload["primary_archetype"] = "divergence"
    errors = checker.validate_payload(payload)
    assert any("primary_archetype" in err for err in errors)
