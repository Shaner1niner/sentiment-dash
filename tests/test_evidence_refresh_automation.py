from __future__ import annotations

from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SCRIPT = ROOT / "scripts" / "run_seta_refresh_with_evidence_handoff.ps1"
DOC = ROOT / "docs" / "evidence" / "evidence_refresh_automation_v1.md"


def test_refresh_automation_script_exists_and_calls_publish_helper():
    source = SCRIPT.read_text(encoding="utf-8")
    assert "publish_seta_evidence_handoff_to_bundle.ps1" in source
    assert "check_evidence_handoff_payload.py" in source
    assert "dashboard_evidence_payload.json" in source


def test_refresh_automation_script_supports_safe_modes():
    source = SCRIPT.read_text(encoding="utf-8")
    assert "[switch]$SkipRefreshCommand" in source
    assert "[switch]$Stage" in source
    assert "[switch]$WhatIf" in source
    assert "[switch]$CommitEvidencePayload" in source
    assert "[switch]$Push" in source
    assert "Invoke-CheckedCommand" in source


def test_refresh_automation_does_not_commit_or_push_by_default():
    source = SCRIPT.read_text(encoding="utf-8")
    assert "[switch]$CommitEvidencePayload" in source
    assert "[switch]$Push" in source
    assert "if (-not $CommitEvidencePayload)" in source
    assert "The script intentionally does not commit or push by default" in source


def test_refresh_automation_commit_push_guardrails_are_present():
    source = SCRIPT.read_text(encoding="utf-8")
    assert "-Push requires -CommitEvidencePayload" in source
    assert "Refusing to commit because unrelated staged files are present" in source
    assert "Refusing to push from detached HEAD" in source
    assert "commit evidence payload" in source
    assert "push evidence payload commit" in source
    assert "seta_bundles/latest/evidence/dashboard_evidence_payload.json" in source
    assert "EvidenceManagedRelPaths" in source
    assert "interactive_dashboard_fix24_public_embed.html" in source
    assert "evidence_refresh_status.json" in source


def test_refresh_automation_docs_explain_task_scheduler_usage():
    doc = DOC.read_text(encoding="utf-8")
    assert "scheduled" in doc.lower()
    assert "run_seta_refresh_with_evidence_handoff.ps1" in doc
    assert "Historical diagnostic only; not a trade signal" in doc
    assert "CommitEvidencePayload" in doc
    assert "unrelated files are already staged" in doc

def test_refresh_automation_avoids_powershell_args_automatic_variable_collision():
    source = SCRIPT.read_text(encoding="utf-8")
    assert "$GitArgs" in source
    assert "[string[]]$Args" not in source
    assert "& git @Args" not in source


def test_refresh_automation_repairs_and_checks_mounts_before_commit_publish():
    source = SCRIPT.read_text(encoding="utf-8")
    assert "ensure_evidence_mounts.py" in source
    assert "check_evidence_refresh_health.py" in source
    assert "check_refresh_integrity.py" in source
    assert "--no-write" in source
    assert "validating Evidence Handoff refresh health after mount repair" in source
    assert "validating Evidence Handoff refresh health after status write" in source
    assert "running refresh integrity report after Evidence repair" in source

    commit_call_index = source.rindex("Invoke-EvidencePayloadCommitPublish")

    assert source.index("repairing Evidence Card mounts after dashboard refresh") < source.index("publishing Evidence Handoff payload")
    assert source.index("validating Evidence Handoff refresh health after mount repair") < source.index("publishing Evidence Handoff payload")
    assert source.index("running refresh integrity report after Evidence repair") < commit_call_index

def test_refresh_automation_git_helpers_capture_native_stderr_safely():
    source = SCRIPT.read_text(encoding="utf-8")
    assert "1> $stdoutPath 2> $stderrPath" in source
    assert "& git @GitArgs 2>&1" not in source
    assert "$previousErrorActionPreference = $ErrorActionPreference" in source
    assert '$ErrorActionPreference = "Continue"' in source
    assert "$ErrorActionPreference = $previousErrorActionPreference" in source
    assert "Remove-Item -Path $stdoutPath, $stderrPath" in source
    assert "if ($exitCode -ne 0)" in source
    assert "failed with exit code $exitCode" in source

