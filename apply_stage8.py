import re
import subprocess
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent

def apply():
    print("Applying Safe Cutover (Unplugging the Monolith)...")
    html_files = list(REPO_ROOT.glob("*.html"))
    
    # Precision regex to find the old script tag without breaking surrounding HTML
    pattern = re.compile(r'<script[^>]*src=["\']([^"\']*dashboard_fix26_app\.js[^"\']*)["\'][^>]*></script>', re.IGNORECASE)
    replacement = '<script type="module" src="./src/dashboard_main.js"></script>'

    updated_count = 0
    for html_file in html_files:
        if "v2_test_harness" in html_file.name:
            continue

        content = html_file.read_text(encoding="utf-8")
        if pattern.search(content):
            new_content = pattern.sub(replacement, content)
            html_file.write_text(new_content, encoding="utf-8")
            print(f"[OK] Swapped brain in: {html_file.name}")
            updated_count += 1

    if updated_count > 0:
        subprocess.run(["git", "add", "*.html"])
        subprocess.run(["git", "commit", "-m", "Refactor: Safe cutover replacing legacy script tag with V2 module"])
        print("Safe cutover applied! V2 is now the only brain.")
    else:
        print("[SKIP] No legacy script tags found.")

if __name__ == "__main__":
    apply()