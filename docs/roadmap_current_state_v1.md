Recommended next roadmap lanes

CI smoke checks for refresh integrity and Evidence Handoff health.

Scheduled wrapper integration for check\_refresh\_integrity.py in report-only mode.

Member/public generated asset inventory and manifest refinement.

Cross-repo handoff documentation for SETA\_engine and SETA\_Prediction\_Intelligence\_Engine.

Product/UX polish only after guardrails stabilize.

Deferred work



Do not do these yet:



make refresh integrity blocking in scheduled automation

expand public evidence archetypes beyond attention\_validation

promote any evidence surface as predictive

add trade-signal language

redesign generated dashboard output

manually edit large generated dashboard bundles unless fixing a specific breakage

Safety boundary



All public/member surfaces should preserve SETA-safe framing.



Historical evidence context is diagnostic only. It is not a trade signal, recommendation, price forecast, target, entry, or exit.

"""



inventory = """# Public/member dashboard inventory v1



Purpose



This document inventories the main public/member dashboard surfaces and generated asset groups currently present in sentiment-dash.



It supports refresh review, roadmap planning, and repo-boundary clarity.



This document is not a methodology specification and does not define prediction or trading logic.



Public surfaces

Homepage

index.html



Purpose:



public landing page

dashboard navigation entry point

public-safe Evidence Handoff card

Evidence Handoff health badge

operational status indicators



Protected markers include:



data-seta-evidence-section

data-seta-evidence-card

data-seta-evidence-health-badge

src/evidence\_handoff\_reader.js

src/evidence\_card\_ui.js

src/evidence\_health\_badge.js

Public dashboard embed

interactive\_dashboard\_fix24\_public\_embed.html



Purpose:



public dashboard route

chart/context surface

module Evidence Context mount



Protected scripts include:



src/evidence\_handoff\_reader.js

src/evidence\_card\_ui.js

src/features/ModuleEvidenceContext.js

Legacy / context card surfaces



Examples:



seta\_public\_context\_cards.html

interactive\_dashboard\_fix24\_public\_legacy\_embed.html



These may remain as fallback or public context routes depending on current deployment.



Member/research surfaces

Member dashboard embed

interactive\_dashboard\_fix24\_member\_embed.html



Purpose:



member/research dashboard route

expanded asset universe

fuller chart/store context

likely consumer of member chart-store assets



This surface should be treated as generated/publication-managed unless intentionally edited.



Generated public chart assets



Public chart assets include:



fix26\_chart\_store\_assets/public/\*.json

fix26\_chart\_store\_public.json

fix26\_chart\_store\_public\_index.json

fix26\_screener\_store.json

fix26\_structure\_score\_history.json



These files are expected to churn during refreshes.



The public asset universe has recently included examples such as AAPL, BTC, COIN, ETH, GLD, MSFT, NVDA, SOL, and SPY.



Generated member chart assets



Member chart assets include:



fix26\_chart\_store\_assets/member/\*.json

fix26\_chart\_store\_member.json

fix26\_chart\_store\_member\_index.json



The member asset universe has recently included examples such as AAPL, AMD, AMZN, AVAX, BNB, BTC, COIN, DOGE, DXY, ETH, GLD, GOOGL, LINK, META, MSFT, MSTR, NFLX, NVDA, PLTR, QQQ, SHOP, SMCI, SOL, SPY, TLT, TSLA, XLE, and XRP.



These files should be classified as generated refresh output.



Generated briefing and website content



Examples:



generated\_briefings\_reviewed.json

generated\_briefings\_reviewed\_v2.json

public\_content/seta\_website\_snippets\_latest.json

public\_content/seta\_website\_snippets\_latest.md

public\_content/site\_refresh\_status.json



These files represent published/generated site content and are expected to change during refreshes.



Prediction/accountability artifacts



Examples:



public\_content/prediction\_outcomes/prediction\_outcome\_overlay\_latest.json

src/features/PredictionAccountabilityPanel.js



These should be treated as display/accountability artifacts in this repo. Source methodology and generation logic should remain upstream.



Safety rule: prediction-accountability surfaces should remain accountability/review oriented. They should not be framed as trade instructions, targets, entries, exits, or recommendations.



Current candle / market snapshot artifacts



Examples:



public\_content/current\_candles/\*.json



These are generated market snapshot artifacts and may churn as part of refresh.



SETA bundle display components



Recently visible bundle-related scripts include:



src/seta\_bundle\_loader.js

src/seta\_bundle\_status\_card.js

src/seta\_bundle\_mini\_panel.js

src/seta\_bundle\_compare\_panel.js



These appear to support dashboard display/status/compare behavior for SETA bundles.



They should be treated as hand-authored source unless a known generator owns them.



Dashboard runtime scripts



Examples:



dashboard\_fix26\_app.js

dashboard\_alert\_events\_v2\_patch.js

src/dashboard\_main.js

src/PlotlyRenderer.js



These scripts are central to dashboard rendering.



Some may be generated or bundled output, especially very large app artifacts. Before changing them manually, confirm whether they are source files or generated publication artifacts.



Evidence Handoff assets



Payload and status artifacts:



seta\_bundles/latest/evidence/dashboard\_evidence\_payload.json

seta\_bundles/latest/evidence/evidence\_refresh\_status.json



Reader/UI scripts:



src/evidence\_handoff\_reader.js

src/evidence\_card\_ui.js

src/evidence\_health\_badge.js

src/features/ModuleEvidenceContext.js



Validation/repair scripts:



scripts/check\_evidence\_handoff\_payload.py

scripts/check\_evidence\_refresh\_health.py

scripts/ensure\_evidence\_mounts.py



Wrapper/publishing scripts:



scripts/run\_seta\_refresh\_with\_evidence\_handoff.ps1

scripts/run\_seta\_public\_card\_site\_with\_evidence\_wrapper.bat

scripts/publish\_seta\_evidence\_handoff\_to\_bundle.ps1

Refresh integrity assets

refresh\_manifest.json

scripts/check\_refresh\_integrity.py

tests/test\_refresh\_integrity.py

docs/public\_refresh\_integrity\_v1.md



Purpose:



classify expected generated churn

report unexpected tracked file changes

verify protected public/member evidence markers

support future scheduled wrapper integration

Post-refresh review checklist



Run:



python -m pytest tests\\\\test\_refresh\_integrity.py

python scripts\\\\check\_refresh\_integrity.py --root . --report-only

python scripts\\\\check\_evidence\_refresh\_health.py --root . --no-write

git status --short --untracked-files=no



Interpretation:



unexpected\_tracked\_files=0 means changed files are inside known generated/protected groups.

missing\_protected\_mounts=0 means evidence mounts survived or were repaired.

\[PASS] evidence refresh health means evidence payload/status/mounts are coherent.

no tracked git status output means local main is clean.

Files that should raise caution if changed unexpectedly



Examples:



scripts/\*.py

scripts/\*.ps1

scripts/\*.bat

src/evidence\_\*.js

src/features/ModuleEvidenceContext.js

tests/\*.py

docs/\*.md

refresh\_manifest.json



These are usually hand-authored guardrail/source files and should not change during ordinary generated refreshes.



Recommended manifest follow-up



refresh\_manifest.json should be reviewed after a few refresh cycles to ensure member assets and new generated public/member payloads are classified clearly.



Likely additions/refinements:



fix26\_chart\_store\_assets/member/\*.json

fix26\_chart\_store\_member.json

fix26\_chart\_store\_member\_index.json

interactive\_dashboard\_fix24\_member\_embed.html

generated\_briefings\_reviewed.json

public\_content/current\_candles/\*.json

public\_content/prediction\_outcomes/\*.json

Safety boundary



This inventory describes repo assets and publication behavior only.



It does not create or endorse trade signals, recommendations, price targets, entries, exits, or predictive claims.

"""



(docs / "roadmap\_current\_state\_v1.md").write\_text(roadmap, encoding="utf-8", newline="\\n")

(docs / "public\_member\_dashboard\_inventory\_v1.md").write\_text(inventory, encoding="utf-8", newline="\\n")



print("\[OK] wrote docs roadmap\_current\_state\_v1.md and public\_member\_dashboard\_inventory\_v1.md")

'@ | Set-Content -Path \_write\_current\_state\_docs.py -Encoding utf8



python \_write\_current\_state\_docs.py

Remove-Item \_write\_current\_state\_docs.py





Then validate:



```powershell

python -m pytest tests\\test\_refresh\_integrity.py

python scripts\\check\_refresh\_integrity.py --root . --report-only

python scripts\\check\_evidence\_refresh\_health.py --root . --no-write



git status --short

