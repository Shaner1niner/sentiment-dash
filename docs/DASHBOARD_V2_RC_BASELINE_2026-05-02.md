\# Dashboard v2 Release Candidate Baseline - 2026-05-02



\## Baseline tag



`dashboard-v2-drawer-candle-clean-2026-05-02`



\## Commit posture



This release-candidate baseline was validated after the Timeline drawer / weekly candle repair stack and the refreshed SETA dashboard data stores were aligned on `main`.



Known-good head at validation time:



`314d9b8 Refresh SETA dashboard data stores`



\## Validated surfaces



Browser QA passed for:



\- Public dashboard loads

\- Member dashboard loads

\- Daily -> Weekly -> Daily switching

\- Timeline drawer collapse / reopen

\- Chart width after drawer collapse / reopen

\- Bands=None + Ribbon=None

\- Bands=Price

\- Bands=Combined/Canonical Overlap



\## Smoke validation



Local smoke checks passed:



\- `python scripts\\smoke\_fix26\_dashboard.py`

\- `python scripts\\smoke\_seta\_public\_context\_cards\_v2.py`

\- `python scripts\\smoke\_seta\_macd\_visual\_polish\_v3.py`

\- `python scripts\\smoke\_github\_pages\_live.py`

\- `git diff --check`



Expected warnings:



\- SPY may be missing from public/member chart payloads while upstream coverage is absent.



\## Live Pages validation



GitHub Pages live health passed for:



\- Site root

\- Public dashboard

\- Member dashboard

\- Market Context Cards

\- Manifest

\- Public chart store

\- Member chart store

\- Screener store

\- Public website snippets



The live dashboard JS cache token was confirmed as:



`drawer\_candle\_004`



\## Product read



This is the first clean Dashboard v2 release-candidate baseline where layout, weekly grouping, timeline drawer behavior, chart width, and key band modes were all browser-validated together.



\## Protected going forward



Future work should branch from this baseline and avoid direct `main` changes except for intentional generated data/content refreshes.



Avoid reintroducing:



\- global Plotly debounce

\- deferred dropdown dispatch

\- pointerdown dropdown interception

\- broad trace filtering

\- unreviewed line-ending churn



\## Recommended next work



1\. Public-facing launch polish.

2\. Market Context Cards / public snippets publishing automation.

3\. Performance improvements through fewer traces and clearer visual presets, not event-timing hacks.

