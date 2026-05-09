#!/usr/bin/env python
"""Compact SETA reference guidance for AI briefing inputs."""

from __future__ import annotations

import json
import re
from dataclasses import dataclass
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[1]

REFERENCE_FILE_NAMES = (
    "seta_agent_reference.json",
    "seta_metric_dictionary.json",
    "seta_archetype_dictionary.json",
    "seta_indicator_family_dictionary.json",
    "seta_glossary.json",
    "SETA_Score_Glossary.json",
    "SETA_Indicator_Family_Glossary.json",
    "seta_enriched_column_descriptions_grouped.json",
    "seta_reference_manifest.json",
)


def normalize_reference_key(value: Any) -> str:
    text = "" if value is None else str(value)
    text = text.strip().lower().replace("&", " and ")
    text = re.sub(r"[^a-z0-9]+", "_", text)
    text = re.sub(r"_+", "_", text)
    return text.strip("_")


def safe_str(value: Any) -> str:
    if value is None:
        return ""
    if isinstance(value, float) and value != value:
        return ""
    return str(value).strip()


def first_present(*values: Any) -> str:
    for value in values:
        text = safe_str(value)
        if text:
            return text
    return ""


def load_json(path: Path) -> Any:
    return json.loads(path.read_text(encoding="utf-8"))


@dataclass(frozen=True)
class ReferenceLookupResult:
    key: str
    found: bool
    payload: dict[str, Any]


class SETABriefingReferencePack:
    def __init__(self, reference_dir: str | Path = ROOT / "agent_reference") -> None:
        self.reference_dir = Path(reference_dir)
        self.raw: dict[str, Any] = {}
        self.columns: dict[str, dict[str, Any]] = {}
        self.scores: dict[str, dict[str, Any]] = {}
        self.families: dict[str, dict[str, Any]] = {}
        self.archetypes: dict[str, dict[str, Any]] = {}
        self.reply_policy: dict[str, Any] = {}
        self.manifest: dict[str, Any] = {}
        self.missing_files: list[str] = []
        self._load()

    def _load(self) -> None:
        for name in REFERENCE_FILE_NAMES:
            path = self.reference_dir / name
            if not path.exists():
                self.missing_files.append(name)
                continue
            self.raw[name] = load_json(path)

        self.manifest = self.raw.get("seta_reference_manifest.json") or {}
        agent_reference = self.raw.get("seta_agent_reference.json") or {}
        self.reply_policy = agent_reference.get("reply_policy") or {}

        self._index_scores(agent_reference.get("scores") or {})
        self._index_scores((self.raw.get("seta_metric_dictionary.json") or {}).get("scores") or {})
        self._index_score_glossary_list(self.raw.get("SETA_Score_Glossary.json") or [])
        self._index_score_glossary_list((self.raw.get("seta_glossary.json") or {}).get("score_glossary") or [])

        self._index_columns(agent_reference.get("columns") or {})
        self._index_columns((self.raw.get("seta_metric_dictionary.json") or {}).get("columns") or {})
        self._index_column_description_list((self.raw.get("seta_glossary.json") or {}).get("column_descriptions") or [])
        self._index_grouped_columns(self.raw.get("seta_enriched_column_descriptions_grouped.json") or {})

        self._index_families(agent_reference.get("indicator_families") or {})
        self._index_families((self.raw.get("seta_indicator_family_dictionary.json") or {}).get("indicator_families") or {})
        self._index_family_glossary_list(self.raw.get("SETA_Indicator_Family_Glossary.json") or [])
        self._index_family_glossary_list((self.raw.get("seta_glossary.json") or {}).get("indicator_family_glossary") or [])

        self._index_archetypes(agent_reference.get("archetypes") or {})
        self._index_archetypes((self.raw.get("seta_archetype_dictionary.json") or {}).get("archetypes") or {})

    def _merge(self, target: dict[str, dict[str, Any]], key: str, payload: dict[str, Any]) -> None:
        norm = normalize_reference_key(key)
        if not norm:
            return
        existing = target.get(norm, {})
        merged = dict(existing)
        for pkey, pval in payload.items():
            if pval in (None, "", [], {}):
                continue
            if pkey not in merged or merged[pkey] in (None, "", [], {}):
                merged[pkey] = pval
        target[norm] = merged

    def _index_scores(self, scores: dict[str, Any]) -> None:
        for key, payload in scores.items():
            if isinstance(payload, dict):
                record = dict(payload)
                record.setdefault("source_key", key)
                record.setdefault("name", payload.get("plain_name") or key)
                self._merge(self.scores, key, record)
                if payload.get("plain_name"):
                    self._merge(self.scores, payload["plain_name"], record)

    def _index_score_glossary_list(self, rows: list[Any]) -> None:
        for row in rows:
            if isinstance(row, dict):
                key = row.get("term") or row.get("plain_name")
                if key:
                    record = dict(row)
                    record.setdefault("name", key)
                    self._merge(self.scores, key, record)

    def _index_columns(self, columns: dict[str, Any]) -> None:
        for key, payload in columns.items():
            if isinstance(payload, dict):
                record = dict(payload)
                record.setdefault("column", key)
                record.setdefault("column_name", key)
                self._merge(self.columns, key, record)

    def _index_column_description_list(self, rows: list[Any]) -> None:
        for row in rows:
            if isinstance(row, dict):
                key = row.get("column_name") or row.get("column")
                if key:
                    record = dict(row)
                    record.setdefault("column", key)
                    self._merge(self.columns, key, record)

    def _index_grouped_columns(self, grouped: dict[str, Any]) -> None:
        for section in grouped.get("sections", []) if isinstance(grouped, dict) else []:
            section_name = section.get("section")
            for subsection in section.get("subsections", []) or []:
                subsection_name = subsection.get("subsection")
                for row in subsection.get("columns", []) or []:
                    if isinstance(row, dict) and row.get("column"):
                        record = dict(row)
                        record.setdefault("section", section_name)
                        record.setdefault("subsection", subsection_name)
                        record.setdefault("description", row.get("explanation"))
                        record.setdefault("category", row.get("theme"))
                        self._merge(self.columns, row["column"], record)

    def _index_families(self, families: dict[str, Any]) -> None:
        for key, payload in families.items():
            if isinstance(payload, dict):
                record = dict(payload)
                record.setdefault("family_key", key)
                record.setdefault("plain_name", payload.get("plain_name") or key)
                self._merge(self.families, key, record)
                if payload.get("plain_name"):
                    self._merge(self.families, payload["plain_name"], record)

    def _index_family_glossary_list(self, rows: list[Any]) -> None:
        for row in rows:
            if isinstance(row, dict):
                key = row.get("indicator_family") or row.get("plain_name")
                if key:
                    record = dict(row)
                    record.setdefault("plain_name", key)
                    self._merge(self.families, key, record)

    def _index_archetypes(self, archetypes: dict[str, Any]) -> None:
        for key, payload in archetypes.items():
            if isinstance(payload, dict):
                record = dict(payload)
                record.setdefault("archetype_key", key)
                record.setdefault("plain_name", payload.get("plain_name") or key)
                self._merge(self.archetypes, key, record)
                if payload.get("plain_name"):
                    self._merge(self.archetypes, payload["plain_name"], record)

    def get_column(self, column: str) -> ReferenceLookupResult:
        key = normalize_reference_key(column)
        payload = self.columns.get(key)
        return ReferenceLookupResult(column, bool(payload), dict(payload or {}))

    def get_score(self, score: str) -> ReferenceLookupResult:
        key = normalize_reference_key(score)
        payload = self.scores.get(key)
        return ReferenceLookupResult(score, bool(payload), dict(payload or {}))

    def get_family(self, family: str) -> ReferenceLookupResult:
        key = normalize_reference_key(family)
        payload = self.families.get(key)
        return ReferenceLookupResult(family, bool(payload), dict(payload or {}))

    def get_archetype(self, archetype: str) -> ReferenceLookupResult:
        key = normalize_reference_key(archetype)
        payload = self.archetypes.get(key)
        return ReferenceLookupResult(archetype, bool(payload), dict(payload or {}))

    def build_guidance(
        self,
        *,
        columns: list[str] | None = None,
        score_terms: list[str] | None = None,
        families: list[str] | None = None,
        archetypes: list[str] | None = None,
        max_items: int = 8,
    ) -> dict[str, Any]:
        definitions: list[dict[str, Any]] = []
        cautions: list[str] = []

        for column in columns or []:
            result = self.get_column(column)
            if not result.found:
                continue
            payload = result.payload
            name = first_present(payload.get("column_name"), payload.get("column"), column)
            definitions.append({
                "type": "column",
                "name": name,
                "category": first_present(payload.get("category"), payload.get("theme"), payload.get("section")),
                "definition": first_present(payload.get("description"), payload.get("explanation")),
                "recommended_use": safe_str(payload.get("recommended_use")),
                "caution": first_present(payload.get("cautions"), payload.get("caution")),
            })
            if definitions[-1]["caution"]:
                cautions.append(f"{name}: {definitions[-1]['caution']}")

        for score in score_terms or []:
            result = self.get_score(score)
            if not result.found:
                continue
            payload = result.payload
            name = first_present(payload.get("plain_name"), payload.get("name"), score)
            definitions.append({
                "type": "score",
                "name": name,
                "definition": safe_str(payload.get("definition")),
                "where_used": safe_str(payload.get("where_used")),
                "caution": safe_str(payload.get("caution")),
                "reply_guidance": safe_str(payload.get("reply_guidance")),
            })
            if definitions[-1]["caution"]:
                cautions.append(f"{name}: {definitions[-1]['caution']}")

        for family in families or []:
            result = self.get_family(family)
            if not result.found:
                continue
            payload = result.payload
            definitions.append({
                "type": "family",
                "name": first_present(payload.get("plain_name"), family),
                "definition": safe_str(payload.get("definition")),
                "interpretation_notes": safe_str(payload.get("interpretation_notes")),
                "reply_guidance": safe_str(payload.get("reply_guidance")),
            })

        for archetype in archetypes or []:
            result = self.get_archetype(archetype)
            if not result.found:
                continue
            payload = result.payload
            name = first_present(payload.get("plain_name"), archetype)
            definitions.append({
                "type": "archetype",
                "name": name,
                "direction": safe_str(payload.get("direction")),
                "definition": safe_str(payload.get("definition")),
                "caution": safe_str(payload.get("caution")),
                "reply_guidance": safe_str(payload.get("reply_guidance")),
            })
            if definitions[-1]["caution"]:
                cautions.append(f"{name}: {definitions[-1]['caution']}")

        policy_avoid = self.reply_policy.get("avoid") or []
        disallowed_phrases = self.reply_policy.get("disallowed_phrases") or []
        return {
            "schema_version": "ai_briefing_reference_guidance_v1",
            "reference_manifest_version": self.manifest.get("schema_version"),
            "definitions": definitions[:max_items],
            "cautions": cautions[:max_items],
            "policy_avoid": policy_avoid[:max_items] if isinstance(policy_avoid, list) else [],
            "disallowed_phrases": disallowed_phrases[:max_items] if isinstance(disallowed_phrases, list) else [],
            "missing_files": list(self.missing_files),
        }


def load_briefing_reference_pack(reference_dir: str | Path = ROOT / "agent_reference") -> SETABriefingReferencePack:
    return SETABriefingReferencePack(reference_dir)


def build_default_briefing_guidance(
    *,
    archetypes: list[str] | None = None,
    families: list[str] | None = None,
) -> dict[str, Any]:
    pack = load_briefing_reference_pack()
    return pack.build_guidance(
        columns=[
            "attention_source_breadth_score",
            "attention_level_score",
            "attention_regime_score",
            "seta_dashboard_summary_score",
            "signal_dispersion_score",
            "screener_attention_priority_score",
        ],
        score_terms=[
            "attention_priority_score",
            "dispersion_score",
        ],
        families=families or ["Summary / Consensus", "MACD", "RSI / Stoch RSI", "Bollinger / Overlap", "Sentiment Ribbon"],
        archetypes=archetypes or [],
        max_items=10,
    )
