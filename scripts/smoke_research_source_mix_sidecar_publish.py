from __future__ import annotations

import json
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
publisher = ROOT / "scripts" / "publish_research_source_mix_sidecar.py"


def fail(message: str) -> None:
    raise SystemExit(f"[FAIL] {message}")


def ok(message: str) -> None:
    print(f"[OK] {message}")


if not publisher.exists():
    fail(f"missing {publisher.relative_to(ROOT)}")

text = publisher.read_text(encoding="utf-8")

required_tokens = [
    "research_source_mix_contract.json",
    "DEFAULT_SOURCE",
    "snt_exports",
    "DEFAULT_TARGETS",
    "fix26_chart_store_assets",
    "publish_sidecar",
    "allow_missing",
    "--require-source",
    "record_count",
]

for token in required_tokens:
    if token not in text:
        fail(f"sidecar publisher missing token: {token}")

ok("sidecar publisher exposes expected source/target contract tokens")

namespace = {}
exec(compile(text, str(publisher), "exec"), namespace)
publish_sidecar = namespace["publish_sidecar"]

with tempfile.TemporaryDirectory() as tmp:
    tmp_path = Path(tmp)
    missing = tmp_path / "missing.json"
    target = tmp_path / "public" / "research_source_mix_contract.json"
    result = publish_sidecar(missing, [target], allow_missing=True)
    if result != 0:
        fail("missing optional source should skip with return 0")
    if target.exists():
        fail("missing optional source should not create target")

    source = tmp_path / "research_source_mix_contract.json"
    source.write_text(
        json.dumps({"records": [{"term": "BTC", "weights": {"reddit": 0.6, "bsky": 0.4}}]}),
        encoding="utf-8",
    )
    result = publish_sidecar(source, [target], allow_missing=False)
    if result != 1:
        fail(f"expected one published target, got {result}")
    if not target.exists():
        fail("publisher did not create target sidecar")
    payload = json.loads(target.read_text(encoding="utf-8"))
    if payload.get("records", [{}])[0].get("term") != "BTC":
        fail("published target payload does not match source")

ok("sidecar publisher skips missing optional source and copies valid sidecar")
