from __future__ import annotations

import json
from datetime import datetime, timezone
from pathlib import Path


PATH = Path("fix26_structure_score_history.json")
REQUIRED_TERMS = ["BTC", "ETH", "SOL"]


def parse_time(value: str):
    return datetime.fromisoformat(value.replace("Z", "+00:00")).astimezone(timezone.utc)


def fail(message: str) -> None:
    raise SystemExit(f"[FAIL] {message}")


def ok(message: str) -> None:
    print(f"[OK] {message}")


if not PATH.exists():
    fail(f"{PATH} does not exist")

data = json.loads(PATH.read_text(encoding="utf-8"))

if data.get("schema_version") != "structure_score_history_v1":
    fail("unexpected schema_version")
ok("structure history schema version is correct")

points_by_term = data.get("points_by_term")
latest_by_term = data.get("latest_by_term")

if not isinstance(points_by_term, dict) or not points_by_term:
    fail("points_by_term is empty")
ok(f"points_by_term contains {len(points_by_term)} asset(s)")

if not isinstance(latest_by_term, dict) or not latest_by_term:
    fail("latest_by_term is empty")
ok(f"latest_by_term contains {len(latest_by_term)} asset(s)")

for term in REQUIRED_TERMS:
    if term not in latest_by_term:
        fail(f"missing latest_by_term[{term}]")
ok("required latest assets are present")

retention_hours = int(data.get("retention_hours", 48))
now = datetime.now(timezone.utc)

for term, points in points_by_term.items():
    if not isinstance(points, list) or not points:
        fail(f"{term} has no points")

    seen = set()
    for point in points:
        ts = point.get("as_of_utc")
        if not ts:
            fail(f"{term} point missing as_of_utc")

        if ts in seen:
            fail(f"{term} has duplicate point for {ts}")
        seen.add(ts)

        age_hours = (now - parse_time(ts)).total_seconds() / 3600
        if age_hours > retention_hours + 2:
            fail(f"{term} point outside retention window: {ts}")

        score = point.get("structure_score")
        if not isinstance(score, (int, float)):
            fail(f"{term} point has non-numeric structure_score")

        if score < 0 or score > 100:
            fail(f"{term} structure_score outside 0-100: {score}")

ok("structure history points are valid")
