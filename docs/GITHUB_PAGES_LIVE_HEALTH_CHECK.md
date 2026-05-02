# GitHub Pages Live Health Check

This repo is currently hosted on GitHub Pages, and daily pushes are the production refresh mechanism. The live health check verifies the deployed site and payload contract after those pushes land.

Run from the repo root:

```powershell
python scripts/smoke_github_pages_live.py
```

If the Windows `python` alias points to the Microsoft Store stub, use the installed Python executable directly.

The default target is:

```text
https://shaner1niner.github.io/sentiment-dash/
```

The check verifies:

- Public dashboard, member dashboard, Market Context Cards, root page, and JSON payloads return HTTP 200.
- Dashboard embed pages still resolve their shared CSS, app JS, alert-events patch, and app JS cache token.
- Manifest public/member modes point at loadable chart stores.
- Chart stores have fresh `_meta.generated_at_utc`, non-empty included assets, and daily/weekly row counts.
- `SPY` remains warning-only when it is the sole missing configured asset, because that gap is upstream of this repo.
- Public website snippets are fresh, `public_safe=true`, `posting_performed=false`, non-empty, and free of known local path tokens.
- Screener store has a non-empty `by_term` universe.

Optional flags:

```powershell
python scripts/smoke_github_pages_live.py --max-age-hours 72
python scripts/smoke_github_pages_live.py --base-url https://shaner1niner.github.io/sentiment-dash/
```

Recommended use:

1. Let the daily refresh push complete.
2. Run this smoke against GitHub Pages.
3. Treat failures as production-blocking unless they are clearly GitHub Pages propagation delay.
4. Treat the `SPY` warning as informational until the upstream data pipeline restores SPY coverage.

