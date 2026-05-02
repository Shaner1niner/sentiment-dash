#!/usr/bin/env python
from __future__ import annotations

import argparse
import json
import re
import sys
from dataclasses import dataclass
from datetime import datetime, timezone
from email.utils import parsedate_to_datetime
from typing import Any
from urllib.error import HTTPError, URLError
from urllib.parse import urljoin, urlparse
from urllib.request import Request, urlopen


DEFAULT_BASE_URL = "https://shaner1niner.github.io/sentiment-dash/"
EXPECTED_SPY_ONLY_GAP = {"SPY"}

HTML_ENDPOINTS = {
    "site root": "",
    "public dashboard": "interactive_dashboard_fix24_public_embed.html",
    "member dashboard": "interactive_dashboard_fix24_member_embed.html",
    "market context cards": "seta_public_context_cards.html",
}

JSON_ENDPOINTS = {
    "manifest": "dashboard_fix26_mode_manifest.json",
    "public chart store": "fix26_chart_store_public.json",
    "member chart store": "fix26_chart_store_member.json",
    "screener store": "fix26_screener_store.json",
    "public snippets": "public_content/seta_website_snippets_latest.json",
}


@dataclass
class Response:
    url: str
    status: int
    text: str
    content_type: str
    last_modified: datetime | None


class LiveHealthCheck:
    def __init__(self, base_url: str, timeout: float, max_age_hours: float) -> None:
        self.base_url = base_url.rstrip("/") + "/"
        self.timeout = timeout
        self.max_age_hours = max_age_hours
        self.errors: list[str] = []
        self.warnings: list[str] = []
        self.responses: dict[str, Response] = {}
        self.json_payloads: dict[str, Any] = {}

    def ok(self, msg: str) -> None:
        print(f"[OK] {msg}")

    def warn(self, msg: str) -> None:
        self.warnings.append(msg)
        print(f"[WARN] {msg}")

    def fail(self, msg: str) -> None:
        self.errors.append(msg)
        print(f"[ERROR] {msg}")

    def fetch(self, label: str, rel_or_url: str) -> Response | None:
        url = self.resolve(rel_or_url)
        request = Request(
            url,
            headers={
                "User-Agent": "sentiment-dash-live-health/1.0",
                "Cache-Control": "no-cache",
            },
        )
        try:
            with urlopen(request, timeout=self.timeout) as raw:
                body = raw.read()
                charset = raw.headers.get_content_charset() or "utf-8"
                text = body.decode(charset, errors="replace")
                last_modified = parse_http_datetime(raw.headers.get("Last-Modified"))
                response = Response(
                    url=url,
                    status=raw.status,
                    text=text,
                    content_type=raw.headers.get("Content-Type", ""),
                    last_modified=last_modified,
                )
        except HTTPError as exc:
            self.fail(f"{label} returned HTTP {exc.code}: {url}")
            return None
        except (OSError, URLError) as exc:
            self.fail(f"{label} could not be fetched: {url} ({exc})")
            return None

        if response.status == 200:
            self.ok(f"{label} returned 200 ({url})")
        else:
            self.fail(f"{label} returned HTTP {response.status}: {url}")
        self.responses[label] = response
        return response

    def resolve(self, rel_or_url: str) -> str:
        parsed = urlparse(rel_or_url)
        if parsed.scheme and parsed.netloc:
            return rel_or_url
        return urljoin(self.base_url, rel_or_url)

    def fetch_baseline(self) -> None:
        for label, rel in HTML_ENDPOINTS.items():
            self.fetch(label, rel)
        for label, rel in JSON_ENDPOINTS.items():
            response = self.fetch(label, rel)
            if response is None:
                continue
            try:
                self.json_payloads[label] = json.loads(response.text)
                self.ok(f"{label} is valid JSON")
            except json.JSONDecodeError as exc:
                self.fail(f"{label} is not valid JSON: {exc}")

    def check_html_contracts(self) -> None:
        expected_titles = {
            "public dashboard": "SETA Market Dashboard",
            "member dashboard": "SETA Research Dashboard",
            "market context cards": "SETA Market Context Cards",
        }
        for label, expected in expected_titles.items():
            response = self.responses.get(label)
            if response is None:
                continue
            title = extract_title(response.text)
            if title == expected:
                self.ok(f"{label} title is {expected}")
            else:
                self.fail(f"{label} title expected {expected!r}, got {title!r}")

        cache_tokens: dict[str, str] = {}
        for label in ["public dashboard", "member dashboard"]:
            response = self.responses.get(label)
            if response is None:
                continue
            refs = extract_repo_refs(response.text)
            for required in [
                "dashboard_fix26_base.css",
                "dashboard_fix26_app.js",
                "dashboard_alert_events_v2_patch.js",
            ]:
                matching = [ref for ref in refs if ref.split("?", 1)[0] == required]
                if not matching:
                    self.fail(f"{label} does not reference {required}")
                    continue
                for ref in matching:
                    self.fetch(f"{label} asset {ref}", ref)
                    if required == "dashboard_fix26_app.js":
                        token = query_token(ref)
                        if token:
                            cache_tokens[label] = token
                        else:
                            self.fail(f"{label} references dashboard_fix26_app.js without cache token")

        unique_tokens = sorted(set(cache_tokens.values()))
        if len(unique_tokens) == 1:
            self.ok(f"dashboard JS cache token is consistent: {unique_tokens[0]}")
        elif len(unique_tokens) > 1:
            self.warn(f"dashboard JS cache tokens differ: {cache_tokens}")

        context = self.responses.get("market context cards")
        if context and "public_content/seta_website_snippets_latest.json" in context.text:
            self.ok("market context cards references the public snippets payload")
        elif context:
            self.fail("market context cards does not reference the public snippets payload")

    def check_manifest_and_payloads(self) -> None:
        manifest = self.json_payloads.get("manifest")
        if not isinstance(manifest, dict):
            self.fail("manifest root is not an object")
            return
        modes = manifest.get("modes")
        if not isinstance(modes, dict) or not modes:
            self.fail("manifest missing non-empty modes")
            return
        self.ok(f"manifest modes: {', '.join(sorted(modes))}")

        for mode_name, mode_cfg in modes.items():
            if not isinstance(mode_cfg, dict):
                self.fail(f"manifest mode {mode_name} is not an object")
                continue
            data_url = mode_cfg.get("dataUrl")
            assets = {
                str(asset).upper()
                for asset in mode_cfg.get("assets", [])
                if str(asset).strip()
            }
            if not isinstance(data_url, str) or not data_url:
                self.fail(f"manifest mode {mode_name} missing dataUrl")
                continue
            label = f"{mode_name} chart store"
            payload = self.payload_by_url(data_url)
            if not isinstance(payload, dict):
                self.fail(f"manifest mode {mode_name} dataUrl not loaded: {data_url}")
                continue
            self.check_chart_payload(label, payload, expected_mode=mode_name)
            included = chart_store_assets(payload)
            configured_missing = sorted(assets - included)
            if configured_missing:
                gap = set(configured_missing)
                if gap == EXPECTED_SPY_ONLY_GAP:
                    self.warn(f"{mode_name} chart payload is missing SPY only; expected upstream gap")
                else:
                    self.fail(
                        f"{mode_name} chart payload missing configured assets: "
                        f"{', '.join(configured_missing)}"
                    )
            else:
                self.ok(f"{mode_name} chart payload covers all configured assets")

    def payload_by_url(self, data_url: str) -> Any:
        absolute = self.resolve(data_url)
        for response_label, response in self.responses.items():
            if response.url.split("?", 1)[0] == absolute.split("?", 1)[0]:
                return self.json_payloads.get(response_label)
        response = self.fetch(f"manifest dataUrl {data_url}", data_url)
        if response is None:
            return None
        try:
            payload = json.loads(response.text)
        except json.JSONDecodeError as exc:
            self.fail(f"manifest dataUrl {data_url} is not valid JSON: {exc}")
            return None
        self.json_payloads[f"manifest dataUrl {data_url}"] = payload
        return payload

    def check_chart_payload(self, label: str, payload: dict[str, Any], expected_mode: str) -> None:
        meta = payload.get("_meta")
        if not isinstance(meta, dict):
            self.fail(f"{label} missing _meta")
            return
        generated_at = parse_payload_datetime(meta.get("generated_at_utc"))
        if generated_at is None:
            self.fail(f"{label} missing parseable _meta.generated_at_utc")
        else:
            self.check_freshness(f"{label} generated_at_utc", generated_at)

        mode = meta.get("mode")
        if mode == expected_mode:
            self.ok(f"{label} mode={expected_mode}")
        else:
            self.fail(f"{label} mode expected {expected_mode!r}, got {mode!r}")

        included = meta.get("included_assets")
        if isinstance(included, list) and included:
            self.ok(f"{label} included assets count={len(included)}")
        else:
            self.fail(f"{label} missing non-empty _meta.included_assets")

        row_count_daily = meta.get("row_count_daily")
        row_count_weekly = meta.get("row_count_weekly")
        if positive_int(row_count_daily) and positive_int(row_count_weekly):
            self.ok(f"{label} row counts D={row_count_daily} W={row_count_weekly}")
        else:
            self.warn(f"{label} row counts look incomplete: D={row_count_daily} W={row_count_weekly}")

        missing = {str(asset).upper() for asset in meta.get("missing_assets", [])}
        unexpected_missing = sorted(missing - EXPECTED_SPY_ONLY_GAP)
        if unexpected_missing:
            self.fail(f"{label} has unexpected missing assets: {', '.join(unexpected_missing)}")
        elif missing == EXPECTED_SPY_ONLY_GAP:
            self.ok(f"{label} missing assets limited to expected upstream SPY gap")
        elif missing:
            self.warn(f"{label} reports missing assets: {', '.join(sorted(missing))}")
        else:
            self.ok(f"{label} reports no missing assets")

    def check_public_snippets(self) -> None:
        payload = self.json_payloads.get("public snippets")
        if not isinstance(payload, dict):
            self.fail("public snippets root is not an object")
            return
        if payload.get("public_safe") is True:
            self.ok("public snippets public_safe=true")
        else:
            self.fail("public snippets public_safe is not true")
        if payload.get("posting_performed") is False:
            self.ok("public snippets posting_performed=false")
        else:
            self.fail("public snippets posting_performed is not false")

        snippets = payload.get("snippets")
        if isinstance(snippets, list) and snippets:
            self.ok(f"public snippets count={len(snippets)}")
        else:
            self.fail("public snippets list is empty or missing")

        published_at = parse_payload_datetime(payload.get("published_at_utc") or payload.get("published_at"))
        if published_at is None:
            self.fail("public snippets missing parseable published_at_utc")
        else:
            self.check_freshness("public snippets published_at_utc", published_at)

        text = json.dumps(payload, ensure_ascii=False).lower()
        for forbidden in ["c:\\\\users", "g:\\\\my drive", "reply_agent\\\\pipeline_runs"]:
            if forbidden.lower() in text:
                self.fail(f"public snippets leaked internal path token: {forbidden}")
        self.ok("public snippets contain no known internal path tokens")

    def check_screener(self) -> None:
        payload = self.json_payloads.get("screener store")
        if not isinstance(payload, dict):
            self.fail("screener store root is not an object")
            return
        by_term = payload.get("by_term")
        if isinstance(by_term, dict) and by_term:
            self.ok(f"screener by_term count={len(by_term)}")
        else:
            self.fail("screener store missing non-empty by_term")

    def check_freshness(self, label: str, timestamp: datetime) -> None:
        now = datetime.now(timezone.utc)
        age_hours = (now - timestamp.astimezone(timezone.utc)).total_seconds() / 3600
        if age_hours < -1:
            self.warn(f"{label} is dated in the future: {timestamp.isoformat()}")
        elif age_hours <= self.max_age_hours:
            self.ok(f"{label} fresh ({age_hours:.1f}h old)")
        else:
            self.fail(
                f"{label} stale ({age_hours:.1f}h old; max {self.max_age_hours:.1f}h)"
            )

    def run(self) -> int:
        print("=" * 76)
        print("GitHub Pages live health check")
        print(f"Base URL: {self.base_url}")
        print(f"Freshness window: {self.max_age_hours:.1f} hours")
        print("=" * 76)
        self.fetch_baseline()
        self.check_html_contracts()
        self.check_manifest_and_payloads()
        self.check_public_snippets()
        self.check_screener()
        print("=" * 76)
        if self.warnings:
            print(f"Warnings: {len(self.warnings)}")
        if self.errors:
            print(f"FAILED: {len(self.errors)} error(s)")
            for error in self.errors:
                print(f" - {error}")
            return 1
        print("PASSED")
        return 0


def extract_title(html: str) -> str | None:
    match = re.search(r"<title>\s*(.*?)\s*</title>", html, flags=re.IGNORECASE | re.DOTALL)
    if not match:
        return None
    return re.sub(r"\s+", " ", match.group(1)).strip()


def extract_repo_refs(html: str) -> list[str]:
    refs: list[str] = []
    for match in re.finditer(r"""(?:src|href)=["']([^"']+)["']""", html, flags=re.IGNORECASE):
        ref = match.group(1).strip()
        if not ref or ref.startswith(("http://", "https://", "data:", "#")):
            continue
        refs.append(ref)
    return refs


def query_token(ref: str) -> str | None:
    if "?" not in ref:
        return None
    query = ref.split("?", 1)[1]
    for part in query.split("&"):
        if part.startswith("v="):
            return part.split("=", 1)[1] or None
    return None


def chart_store_assets(payload: dict[str, Any]) -> set[str]:
    assets: set[str] = set()
    for freq in ["D", "W"]:
        bucket = payload.get(freq)
        if isinstance(bucket, dict):
            assets.update(str(key).upper() for key in bucket)
    meta = payload.get("_meta")
    if isinstance(meta, dict):
        included = meta.get("included_assets")
        if isinstance(included, list):
            assets.update(str(asset).upper() for asset in included)
    return assets


def positive_int(value: Any) -> bool:
    return isinstance(value, int) and value > 0


def parse_payload_datetime(value: Any) -> datetime | None:
    if not isinstance(value, str) or not value.strip():
        return None
    raw = value.strip()
    if raw.endswith("Z"):
        raw = raw[:-1] + "+00:00"
    try:
        parsed = datetime.fromisoformat(raw)
    except ValueError:
        return None
    if parsed.tzinfo is None:
        parsed = parsed.replace(tzinfo=timezone.utc)
    return parsed


def parse_http_datetime(value: str | None) -> datetime | None:
    if not value:
        return None
    try:
        parsed = parsedate_to_datetime(value)
    except (TypeError, ValueError):
        return None
    if parsed.tzinfo is None:
        parsed = parsed.replace(tzinfo=timezone.utc)
    return parsed


def parse_args(argv: list[str]) -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Check the live GitHub Pages deployment for the SETA dashboard."
    )
    parser.add_argument(
        "--base-url",
        default=DEFAULT_BASE_URL,
        help=f"GitHub Pages base URL. Default: {DEFAULT_BASE_URL}",
    )
    parser.add_argument(
        "--timeout",
        type=float,
        default=20.0,
        help="Per-request timeout in seconds. Default: 20",
    )
    parser.add_argument(
        "--max-age-hours",
        type=float,
        default=48.0,
        help="Maximum age for generated/published payload timestamps. Default: 48",
    )
    return parser.parse_args(argv)


def main(argv: list[str] | None = None) -> int:
    args = parse_args(sys.argv[1:] if argv is None else argv)
    check = LiveHealthCheck(args.base_url, args.timeout, args.max_age_hours)
    return check.run()


if __name__ == "__main__":
    raise SystemExit(main())
