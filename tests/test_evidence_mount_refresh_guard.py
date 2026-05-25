from __future__ import annotations

import shutil
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
HELPER = ROOT / "scripts" / "ensure_evidence_mounts.py"
WRAPPER = ROOT / "scripts" / "run_seta_refresh_with_evidence_handoff.ps1"


def test_mount_repair_helper_exists_and_knows_required_surfaces():
    source = HELPER.read_text(encoding="utf-8")

    assert "index.html" in source
    assert "interactive_dashboard_fix24_public_embed.html" in source
    assert "data-seta-evidence-section" in source
    assert "data-seta-evidence-card" in source
    assert "src/evidence_handoff_reader.js" in source
    assert "src/evidence_card_ui.js" in source
    assert "src/features/ModuleEvidenceContext.js" in source


def test_mount_repair_helper_repairs_stripped_temp_files(tmp_path):
    shutil.copy(ROOT / "index.html", tmp_path / "index.html")
    shutil.copy(ROOT / "interactive_dashboard_fix24_public_embed.html", tmp_path / "interactive_dashboard_fix24_public_embed.html")

    index_path = tmp_path / "index.html"
    dashboard_path = tmp_path / "interactive_dashboard_fix24_public_embed.html"

    index = index_path.read_text(encoding="utf-8")
    index = index.replace(' data-seta-evidence-section hidden', '')
    index = index.replace('<script src="src/evidence_handoff_reader.js"></script>', '')
    index = index.replace('<script src="src/evidence_card_ui.js"></script>', '')
    index_path.write_text(index, encoding="utf-8")

    dashboard = dashboard_path.read_text(encoding="utf-8")
    dashboard = dashboard.replace('<script src="src/evidence_handoff_reader.js"></script>', '')
    dashboard = dashboard.replace('<script src="src/evidence_card_ui.js"></script>', '')
    dashboard = dashboard.replace('<script src="src/features/ModuleEvidenceContext.js"></script>', '')
    dashboard_path.write_text(dashboard, encoding="utf-8")

    result = subprocess.run(
        [sys.executable, str(HELPER), "--root", str(tmp_path)],
        check=True,
        capture_output=True,
        text=True,
    )

    repaired_index = index_path.read_text(encoding="utf-8")
    repaired_dashboard = dashboard_path.read_text(encoding="utf-8")

    assert "[OK]" in result.stdout
    assert "data-seta-evidence-section" in repaired_index
    assert "src/evidence_handoff_reader.js" in repaired_index
    assert "src/evidence_card_ui.js" in repaired_index
    assert "src/evidence_handoff_reader.js" in repaired_dashboard
    assert "src/evidence_card_ui.js" in repaired_dashboard
    assert "src/features/ModuleEvidenceContext.js" in repaired_dashboard


def test_refresh_wrapper_runs_mount_repair_after_dashboard_refresh():
    source = WRAPPER.read_text(encoding="utf-8")

    assert "ensure_evidence_mounts.py" in source
    assert "repairing Evidence Card mounts after dashboard refresh" in source
    assert "EvidenceManagedRelPaths" in source
    assert "index.html" in source
    assert "interactive_dashboard_fix24_public_embed.html" in source
    assert "Evidence Card mount repair failed" in source
