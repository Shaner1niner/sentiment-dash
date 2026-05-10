#!/usr/bin/env python
from __future__ import annotations
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

def patch_build_input() -> None:
    p = ROOT / "scripts" / "build_ai_briefing_input.py"
    s = p.read_text(encoding="utf-8")

    if "def breadth_channel_quality" not in s:
        insert_at = s.index("\ndef source_breadth(row: dict[str, Any])")
        helper = r'''

def _first_channel_num(row: dict[str, Any], keys: list[str]) -> float | None:
    for key in keys:
        value = num(row.get(key))
        if value is not None and value > 0:
            return value
    return None


def breadth_channel_quality(row: dict[str, Any]) -> dict[str, Any]:
    # Infer whether source breadth should be publicly qualified.
    # Prefer author-level channels when fields are available. If no channel mix
    # is available, use aggregate breadth without exposing implementation caveats.
    channel_keys = {
        "reddit": ["reddit_author_count", "reddit_unique_author_count", "attention_reddit_author_count", "reddit_source_count"],
        "bluesky": ["bsky_author_count", "bsky_unique_author_count", "bluesky_author_count", "bluesky_unique_author_count", "attention_bsky_author_count"],
        "x": ["x_author_count", "twitter_author_count", "tweet_author_count", "x_source_count", "twitter_source_count"],
        "news": ["news_source_count", "news_outlet_count", "news_article_count", "article_source_count"],
    }
    mix = {}
    for channel, keys in channel_keys.items():
        value = _first_channel_num(row, keys)
        if value is not None:
            mix[channel] = round(value, 4)

    total = sum(mix.values())
    if total <= 0:
        return {
            "channel_quality": "aggregate_only",
            "channel_mix": {},
            "public_confidence_note": "",
            "internal_note": "No channel-level breadth mix was available; public copy uses aggregate breadth only.",
        }

    high_certainty = (mix.get("reddit", 0.0) + mix.get("bluesky", 0.0)) / total
    lower_certainty = (mix.get("x", 0.0) + mix.get("news", 0.0)) / total

    if lower_certainty >= 0.70 and high_certainty < 0.25:
        return {
            "channel_quality": "lower_author_certainty_weighted",
            "channel_mix": mix,
            "public_confidence_note": "Confidence is moderated because the available sample leans toward channels where author breadth is harder to verify.",
            "internal_note": "Breadth mix appears weighted toward X/news-like channels; avoid presenting broad breadth as equally strong author distribution.",
        }

    if high_certainty >= 0.40:
        return {
            "channel_quality": "author_distribution_supported",
            "channel_mix": mix,
            "public_confidence_note": "",
            "internal_note": "Breadth mix includes meaningful author-level contribution from Reddit/Bluesky-like channels.",
        }

    return {
        "channel_quality": "mixed_or_unclear",
        "channel_mix": mix,
        "public_confidence_note": "",
        "internal_note": "Breadth mix is mixed or does not strongly require a public caveat.",
    }


def breadth_public_note(label: str, confidence: str, channel: dict[str, Any]) -> str:
    if label == "Broad":
        note = "Participation appears distributed across a broader source base."
    elif label == "Moderate":
        note = "Participation has some breadth, but still needs structure confirmation."
    elif label == "Narrow":
        note = "Attention may be concentrated in a smaller source set."
    else:
        note = "The available sample does not support a strong participation-breadth read."

    confidence_note = str(channel.get("public_confidence_note") or "").strip()
    if confidence_note:
        return f"{note} {confidence_note}"
    if confidence in {"unavailable", "label_only"}:
        return f"{note} Confidence is qualified by available source coverage."
    return note
'''
        s = s[:insert_at] + helper + s[insert_at:]

    start = s.index("def source_breadth(row: dict[str, Any]) -> dict[str, Any]:")
    end = s.index("\n\ndef build_input(", start)
    new_func = r'''def source_breadth(row: dict[str, Any]) -> dict[str, Any]:
    score = first_num(row, ["attention_source_breadth_score", "engagement_source_breadth_score"])
    raw_label = str(row.get("attention_breadth_label") or row.get("engagement_breadth_label") or "").strip()
    channel = breadth_channel_quality(row)

    if score is None and raw_label:
        confidence = "label_only"
        public_note = breadth_public_note(raw_label, confidence, channel)
        return {
            "source_breadth_score": None,
            "source_breadth_label": raw_label,
            "source_breadth_confidence": confidence,
            "source_breadth_channel_quality": channel["channel_quality"],
            "source_breadth_channel_mix": channel["channel_mix"],
            "source_breadth_public_note": public_note,
            "source_breadth_internal_note": channel["internal_note"],
            "source_caveat": "Breadth label is present, but no numeric source breadth score is available.",
            "interpretation": public_note,
            "mention_in_public_copy": True,
        }

    if score is None:
        label = "Source Limited"
        confidence = "unavailable"
        public_note = breadth_public_note(label, confidence, channel)
        return {
            "source_breadth_score": None,
            "source_breadth_label": label,
            "source_breadth_confidence": confidence,
            "source_breadth_channel_quality": channel["channel_quality"],
            "source_breadth_channel_mix": channel["channel_mix"],
            "source_breadth_public_note": public_note,
            "source_breadth_internal_note": channel["internal_note"],
            "source_caveat": "Source breadth is unavailable or sample-limited for this row.",
            "interpretation": public_note,
            "mention_in_public_copy": True,
        }

    label = "Broad" if score >= 70 else ("Moderate" if score >= 45 else "Narrow")
    confidence = "usable" if score >= 45 else "caution"
    public_note = breadth_public_note(label, confidence, channel)

    return {
        "source_breadth_score": round(score, 2),
        "source_breadth_label": label,
        "source_breadth_confidence": confidence,
        "source_breadth_channel_quality": channel["channel_quality"],
        "source_breadth_channel_mix": channel["channel_mix"],
        "source_breadth_public_note": public_note,
        "source_breadth_internal_note": channel["internal_note"],
        "source_caveat": channel["public_confidence_note"],
        "interpretation": public_note,
        "mention_in_public_copy": True,
    }
'''
    s = s[:start] + new_func + s[end:]
    p.write_text(s, encoding="utf-8")
    print("[OK] patched build_ai_briefing_input.py")

def patch_generator() -> None:
    p = ROOT / "scripts" / "generate_ai_briefing_draft.py"
    s = p.read_text(encoding="utf-8")
    start = s.index("def build_trust_check(briefing_input: dict[str, Any]) -> str:")
    end = s.index("\n\ndef build_watch_item(", start)
    new_func = r'''def build_trust_check(briefing_input: dict[str, Any]) -> str:
    breadth = briefing_input.get("breadth_trust") or {}
    breadth_label = clean_text(breadth.get("source_breadth_label"), "Source Limited")
    breadth_score = breadth.get("source_breadth_score")
    breadth_score_text = "" if breadth_score is None else f" ({compact_number(breadth_score)})"

    public_note = clean_text(
        breadth.get("source_breadth_public_note") or breadth.get("interpretation"),
        "Source breadth is a trust layer for the participation read.",
    )
    caveat = clean_text(breadth.get("source_caveat"), "")
    if "x and news" in caveat.lower() or "news breadth" in caveat.lower():
        caveat = ""
    if not caveat:
        caveat = public_breadth_caveat(breadth)

    return " ".join(
        part
        for part in [
            f"Source breadth is {breadth_label}{breadth_score_text}.",
            public_note,
            caveat,
            "Breadth is a trust layer for participation context, not a standalone demand signal.",
        ]
        if part
    )
'''
    s = s[:start] + new_func + s[end:]
    p.write_text(s, encoding="utf-8")
    print("[OK] patched generate_ai_briefing_draft.py")

def patch_regression() -> None:
    p = ROOT / "scripts" / "check_briefing_semantic_regression.py"
    s = p.read_text(encoding="utf-8")
    if '"x and news inputs"' not in s:
        s = s.replace(
            '        "overlap event",\n',
            '        "overlap event",\n        "x and news inputs",\n        "news breadth may reflect",\n        "outlet repetition or syndication",\n',
            1,
        )
    p.write_text(s, encoding="utf-8")
    print("[OK] patched check_briefing_semantic_regression.py")

def main() -> int:
    patch_build_input()
    patch_generator()
    patch_regression()
    print("[DONE] Breadth trust refinement applied")
    return 0

if __name__ == "__main__":
    raise SystemExit(main())
