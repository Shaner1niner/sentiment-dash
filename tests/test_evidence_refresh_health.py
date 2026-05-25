from __future__ import annotations

import json
import shutil
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
HEALTH = ROOT / "scripts" / "check_evidence_refresh_health.py"
WRAPPER = ROOT / "scripts" / "run_seta_refresh_with_evidence_handoff.ps1"


def copy_health_inputs(tmp_path: Path) -> None:
    shutil.copy(ROOT / "index.html", tmp_path / "index.html")
    shutil.copy(
        ROOT / "interactive_dashboard_fix24_public_embed.html",
        tmp_path / "interactive_dashboard_fix24_public_embed.html",
    )

    payload_src = ROOT / "seta_bundles" / "latest" / "evidence" / "dashboard_evidence_payload.json"
    payload_dst = tmp_path / "seta_bundles" / "latest" / "evidence" / "dashboard_evidence_payload.json"
    payload_dst.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy(payload_src, payload_dst)


def test_evidence_refresh_health_script_writes_status_json(tmp_path):
    copy_health_inputs(tmp_path)

    result = subprocess.run(
        [sys.executable, str(HEALTH), "--root", str(tmp_path)],
        check=True,
        capture_output=True,
        text=True,
    )

    status_path = tmp_path / "seta_bundles" / "latest" / "evidence" / "evidence_refresh_status.json"
    status = json.loads(status_path.read_text(encoding="utf-8"))

    assert "[PASS] evidence refresh health" in result.stdout
    assert status["schema_version"] == "seta_evidence_refresh_status_v1"
    assert status["status"] == "pass"
    assert status["payload"]["valid"] is True
    assert status["payload"]["primary_archetype"] == "attention_validation"
    assert status["payload"]["primary_title"]
    assert status["mounts"]["homepage"]["present"] is True
    assert status["mounts"]["module_dashboard"]["present"] is True
    assert status["errors"] == []


def test_evidence_refresh_health_fails_when_homepage_mount_missing(tmp_path):
    copy_health_inputs(tmp_path)

    index_path = tmp_path / "index.html"
    index = index_path.read_text(encoding="utf-8")
    index = index.replace("data-seta-evidence-section", "missing-seta-section-marker")
    index = index.replace("data-seta-evidence-card", "missing-seta-card-marker")
    index_path.write_text(index, encoding="utf-8")

    result = subprocess.run(
        [sys.executable, str(HEALTH), "--root", str(tmp_path)],
        capture_output=True,
        text=True,
    )

    assert result.returncode == 1
    assert "[FAIL] evidence refresh health" in result.stdout

    status_path = tmp_path / "seta_bundles" / "latest" / "evidence" / "evidence_refresh_status.json"
    status = json.loads(status_path.read_text(encoding="utf-8"))

    assert status["status"] == "fail"
    assert status["mounts"]["homepage"]["present"] is False
    assert "homepage evidence mount missing or incomplete" in status["errors"]


def test_refresh_wrapper_runs_health_helper_and_tracks_status_artifact():
    source = WRAPPER.read_text(encoding="utf-8")

    assert "check_evidence_refresh_health.py" in source
    assert "evidence_refresh_status.json" in source
    assert "writing Evidence Handoff refresh health status" in source
    assert "WHATIF: would write Evidence Handoff refresh health status." in source
    assert "$HealthStatusRelPath" in source
    assert "$EvidenceManagedRelPaths = @($PayloadRelPath, $HealthStatusRelPath)" in source
