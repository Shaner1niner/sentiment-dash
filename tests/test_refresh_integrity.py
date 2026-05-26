from __future__ import annotations

from pathlib import Path

from scripts.check_refresh_integrity import (
    check_protected_markers,
    classify_path,
    load_manifest,
)


ROOT = Path(__file__).resolve().parents[1]
MANIFEST = ROOT / "refresh_manifest.json"


def test_refresh_manifest_loads_expected_groups():
    manifest = load_manifest(MANIFEST)

    assert manifest["schema_version"] == "seta_refresh_manifest_v1"
    assert "fix26_chart_store_assets/public/*.json" in manifest["generated_public_data"]
    assert "index.html" in manifest["generated_public_html"]
    assert "index.html" in manifest["protected_mount_markers"]
    assert "interactive_dashboard_fix24_public_embed.html" in manifest["protected_mount_markers"]


def test_refresh_integrity_classifies_expected_generated_files():
    manifest = load_manifest(MANIFEST)

    assert classify_path("fix26_chart_store_assets/public/ETH.json", manifest) == "generated_public_data"
    assert classify_path("fix26_structure_score_history.json", manifest) == "generated_public_data"
    assert classify_path("public_content/site_refresh_status.json", manifest) == "generated_public_data"
    assert classify_path("index.html", manifest) == "protected_surface"
    assert classify_path("interactive_dashboard_fix24_public_embed.html", manifest) == "protected_surface"


def test_refresh_integrity_classifies_unexpected_files():
    manifest = load_manifest(MANIFEST)

    assert classify_path("src/unplanned_runtime_change.js", manifest) == "unexpected"
    assert classify_path("scripts/random_patch_file.py", manifest) == "unexpected"
    assert classify_path("scripts/ensure_evidence_mounts.py", manifest) == "unexpected"


def test_refresh_integrity_checks_protected_markers(tmp_path):
    manifest = {
        "protected_mount_markers": {
            "index.html": [
                "data-seta-evidence-section",
                "data-seta-evidence-health-badge",
            ]
        }
    }

    (tmp_path / "index.html").write_text(
        """
        <section data-seta-evidence-section></section>
        <span data-seta-evidence-health-badge hidden></span>
        """,
        encoding="utf-8",
    )

    results = check_protected_markers(tmp_path, manifest)

    assert results == [
        {
            "path": "index.html",
            "exists": True,
            "present": True,
            "missing_markers": [],
        }
    ]


def test_refresh_integrity_reports_missing_protected_markers(tmp_path):
    manifest = {
        "protected_mount_markers": {
            "index.html": [
                "data-seta-evidence-section",
                "data-seta-evidence-health-badge",
            ]
        }
    }

    (tmp_path / "index.html").write_text("<html></html>", encoding="utf-8")

    results = check_protected_markers(tmp_path, manifest)

    assert results[0]["present"] is False
    assert results[0]["missing_markers"] == [
        "data-seta-evidence-section",
        "data-seta-evidence-health-badge",
    ]
