from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
runner = ROOT / "scripts" / "run_seta_content_pipeline.py"


def fail(message: str) -> None:
    raise SystemExit(f"[FAIL] {message}")


def ok(message: str) -> None:
    print(f"[OK] {message}")


if not runner.exists():
    fail(f"missing {runner.relative_to(ROOT)}")

text = runner.read_text(encoding="utf-8")

required_tokens = [
    "OUTPUT_PROFILE_REQUIRED_CONTENT",
    "OUTPUT_PROFILE_REQUIRED_PUBLIC",
    "OUTPUT_PROFILE_OPTIONAL_DRAFT",
    "REQUIRED_OUTPUT_PROFILES",
    "def get_output_profile",
    "def is_required_step",
    "def summarize_run_quality",
    "required_missing_count",
    "optional_missing_count",
    "safety_violation_count",
    "run_quality_status",
    "output_quality",
    "optional_missing",
    "Run quality:",
]

for token in required_tokens:
    if token not in text:
        fail(f"content pipeline output-quality token missing: {token}")

ok("content pipeline output-quality contract tokens are present")

for step_name in [
    "daily_content_packet",
    "website_snippets",
    "blog_outline",
    "blog_draft",
    "social_calendar",
    "public_website_content",
]:
    if f'"name": "{step_name}"' not in text:
        fail(f"missing step definition: {step_name}")

ok("all expected content pipeline steps remain present")

expected_profiles = {
    "daily_content_packet": "OUTPUT_PROFILE_REQUIRED_CONTENT",
    "website_snippets": "OUTPUT_PROFILE_REQUIRED_CONTENT",
    "blog_outline": "OUTPUT_PROFILE_OPTIONAL_DRAFT",
    "blog_draft": "OUTPUT_PROFILE_OPTIONAL_DRAFT",
    "social_calendar": "OUTPUT_PROFILE_OPTIONAL_DRAFT",
    "public_website_content": "OUTPUT_PROFILE_REQUIRED_PUBLIC",
}

for step_name, profile in expected_profiles.items():
    marker = f'"name": "{step_name}"'
    pos = text.find(marker)
    window = text[pos : pos + 700]
    if profile not in window:
        fail(f"{step_name} does not expose expected output profile {profile}")

ok("content pipeline steps expose expected required/optional output profiles")

if "optional_missing" in text and "overall_ok = False" in text:
    optional_pos = text.find("optional_missing")
    nearby = text[optional_pos : optional_pos + 500]
    if "overall_ok = False" in nearby:
        fail("optional_missing appears to force overall failure")

ok("optional missing outputs are warning-classified, not hard failures")
