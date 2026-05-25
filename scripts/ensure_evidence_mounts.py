from __future__ import annotations

import argparse
import re
from pathlib import Path

PAYLOAD_URL = "seta_bundles/latest/evidence/dashboard_evidence_payload.json"

INDEX_EVIDENCE_SECTION = f'''
    <section class="ops evidence-stage" aria-label="Historical SETA evidence context" data-seta-evidence-section hidden>
      <div class="panel evidence-panel">
        <div
          id="seta-evidence-card-root"
          data-seta-evidence-card
          data-payload-url="{PAYLOAD_URL}"
        ></div>
      </div>
    </section>
'''

INDEX_SCRIPT_BLOCK = '''
  <script src="src/evidence_handoff_reader.js"></script>
  <script src="src/evidence_card_ui.js"></script>
'''

MODULE_SCRIPT_BLOCK = '''
    <script src="src/evidence_handoff_reader.js"></script>
    <script src="src/evidence_card_ui.js"></script>
    <script src="src/features/ModuleEvidenceContext.js"></script>
'''


def read_text(path: Path) -> str:
    return path.read_text(encoding="utf-8-sig")


def write_text(path: Path, text: str) -> None:
    path.write_text(text.lstrip("\ufeff"), encoding="utf-8", newline="\n")


def remove_script_tags(html: str, script_paths: list[str]) -> str:
    for script_path in script_paths:
        pattern = rf'\s*<script src="{re.escape(script_path)}"></script>'
        html = re.sub(pattern, "", html)
    return html


def ensure_before_body(html: str, block: str) -> str:
    if "</body>" not in html:
        raise ValueError("Cannot insert Evidence Card scripts because </body> was not found.")
    return html.replace("</body>", f"{block}\n</body>", 1)


def ensure_homepage_mount(root: Path) -> bool:
    path = root / "index.html"
    original = read_text(path)
    html = original.lstrip("\ufeff")

    if "data-seta-evidence-section" not in html:
        html = re.sub(
            r'(</section>\s*\n\s*<section class="grid" aria-label="SETA navigation">)',
            f"</section>{INDEX_EVIDENCE_SECTION}\n\n    <section class=\"grid\" aria-label=\"SETA navigation\">",
            html,
            count=1,
        )

    if "data-seta-evidence-section" not in html:
        raise ValueError("Homepage Evidence Card mount could not be restored.")

    html = remove_script_tags(
        html,
        [
            "src/evidence_handoff_reader.js",
            "src/evidence_card_ui.js",
        ],
    )
    html = ensure_before_body(html, INDEX_SCRIPT_BLOCK)

    if html != original:
        write_text(path, html)
        return True
    return False


def ensure_module_dashboard_mount(root: Path) -> bool:
    path = root / "interactive_dashboard_fix24_public_embed.html"
    original = read_text(path)
    html = original.lstrip("\ufeff")

    html = remove_script_tags(
        html,
        [
            "src/evidence_handoff_reader.js",
            "src/evidence_card_ui.js",
            "src/features/ModuleEvidenceContext.js",
        ],
    )

    html = re.sub(
        r'(\s*<script type="module" src="\./src/dashboard_main\.js[^"]*"></script>)',
        f"\n{MODULE_SCRIPT_BLOCK}\n\\1",
        html,
        count=1,
    )

    required = [
        "src/evidence_handoff_reader.js",
        "src/evidence_card_ui.js",
        "src/features/ModuleEvidenceContext.js",
    ]
    missing = [item for item in required if item not in html]
    if missing:
        raise ValueError(f"Module dashboard Evidence Context scripts could not be restored: {missing}")

    if html != original:
        write_text(path, html)
        return True
    return False


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Restore SETA Evidence Card mounts after generated dashboard refreshes."
    )
    parser.add_argument("--root", default=".", help="sentiment-dash repository root")
    args = parser.parse_args()

    root = Path(args.root).resolve()
    changed = []

    if ensure_homepage_mount(root):
        changed.append("index.html")

    if ensure_module_dashboard_mount(root):
        changed.append("interactive_dashboard_fix24_public_embed.html")

    if changed:
        print("[OK] repaired Evidence Card mounts:", ", ".join(changed))
    else:
        print("[OK] Evidence Card mounts already present")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
