# Public/member refresh integrity v1

This document defines the first lightweight refresh-integrity lane for sentiment-dash.

## Purpose

Automated public/member refreshes can legitimately update generated JSON, static assets, and public HTML wrappers. The goal of this lane is to make that churn easier to audit.

This is a guardrail and observability layer only. It does not change dashboard methodology, consumer UI behavior, trading language, or Evidence Handoff interpretation.

## Files added

- refresh_manifest.json
- scripts/check_refresh_integrity.py
- tests/test_refresh_integrity.py

## Manifest groups

generated_public_data lists JSON/Markdown/data payloads expected to churn during refreshes.

generated_public_html lists static public HTML wrappers that may be rewritten by a generator.

protected_mount_markers lists strings that must remain present after refreshes, especially Evidence Handoff mounts and badge/script wiring.

## Checker behavior

The checker reads tracked working-tree changes from git status --short --untracked-files=no.

It classifies changed tracked files as generated_public_data, generated_public_html, protected_surface, or unexpected.

It also checks protected mount markers in key HTML surfaces.

## Commands

Report current state:

python scripts\check_refresh_integrity.py --root . --report-only

Strict check:

python scripts\check_refresh_integrity.py --root .

JSON report:

python scripts\check_refresh_integrity.py --root . --json --report-only

## Non-goals

- Do not redesign dashboard refresh.
- Do not alter chart payload generation.
- Do not change Evidence Handoff methodology.
- Do not introduce prediction, trade-signal, recommendation, or price-forecast language.
