# SETA Public Dashboard QA

Run after refreshes when you want one command to check the current public dashboard chart layer, hover taxonomy, Structure strip, and Fix26 dashboard contract.

Main command:

python scripts\run_public_dashboard_qa.py

Faster local loop:

python scripts\run_public_dashboard_qa.py --skip-full-dashboard-smoke

Optional latest alignment report:

python scripts\run_public_dashboard_qa.py --write-alignment-latest

Single-asset alignment check:

python scripts\run_public_dashboard_qa.py --alignment-asset BTC

Optional local files under qa_outputs/ are ignored by git.

Expected warning: embed entry/cache tokens differ is normal while the public route uses the module entrypoint and legacy/member routes use the legacy app token.

What this protects:

- Sentiment MA 21 default overlay
- Decision Pressure hover
- Sentiment-Price Alignment hover
- Sentiment MA 21 legend cleanup
- Structure strip behavior
- Structure strip/current readout alignment
- Fix26 public/member payload contract
- Reviewed briefing compatibility contract


Additional reader-education checks:

- Public chart glossary smoke
- Market Tape attention/structure card smoke
