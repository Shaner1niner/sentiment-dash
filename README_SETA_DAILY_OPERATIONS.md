\# SETA Daily Operations Guide



This guide describes the daily operating flow for the SETA dashboard, screener, content pipeline, and public website content system.



\## Current production posture



SETA now has a working daily operating stack:



```text

database / source data

→ enriched chart-history export

→ attention scoring

→ SETA market screener

→ Fix 26 dashboard JSON payloads

→ dashboard smoke test

→ draft-only content pipeline

→ public-safe website content payload



\*\*PowerShell Run all\*\*
cd C:\\Users\\shane\\sentiment-dash

.\\run\_seta\_daily\_all.bat

\*\*cmd Window Run All\*\* 
cd C:\\Users\\shane\\sentiment-dash

run\_seta\_daily\_all.bat





SAVE LOCATIONS 

C:\\Users\\shane\\sentiment-dash\\dashboard\_fix26\_app.js

C:\\Users\\shane\\sentiment-dash\\build\_fix25\_chart\_store\_lean.py

C:\\Users\\shane\\export\_enriched\_chart\_history\_v2.py

C:\\Users\\shane\\snt\_pipeline\\enrich.py





Screener Attachment

python C:\\Users\\shane\\build\_seta\_market\_screener.py --source-dir "G:\\My Drive\\Tableau\_AutoSync"







\*\*DAILY CONTENT PIPELINE\*\*

cd C:\\Users\\shane\\sentiment-dash

run\_seta\_content\_pipeline\_daily.bat



&#x20; Powershell

cd C:\\Users\\shane\\sentiment-dash

.\\run\_seta\_content\_pipeline\_daily.bat













1\. refresh\_fix26\_dashboard\_all.bat

2\. python C:\\Users\\shane\\build\_seta\_market\_screener.py --source-dir "G:\\My Drive\\Tableau\_AutoSync"

3\. run\_seta\_content\_pipeline\_daily.bat



1-3 Masterbat

cd C:\\Users\\shane\\sentiment-dash

notepad run\_seta\_daily\_all.bat



























What the daily all runner does

Step 1 — Dashboard/data/screener refresh



Runs:



refresh\_fix26\_dashboard\_all.bat



This refreshes:



C:\\Users\\shane\\snt\_exports\\final\_combined\_data\_enriched\_chart\_history.csv

G:\\My Drive\\Tableau\_AutoSync\\final\_combined\_data\_enriched\_chart\_history.csv

G:\\My Drive\\Tableau\_AutoSync\\seta\_alert\_events\_365d.csv

G:\\My Drive\\Tableau\_AutoSync\\seta\_alert\_audit\_365d.csv

G:\\My Drive\\Tableau\_AutoSync\\seta\_market\_screener\_365d.csv

G:\\My Drive\\Tableau\_AutoSync\\seta\_market\_screener\_365d.json

G:\\My Drive\\Tableau\_AutoSync\\seta\_indicator\_matrix\_365d.csv

G:\\My Drive\\Tableau\_AutoSync\\seta\_indicator\_matrix\_365d.json

G:\\My Drive\\Tableau\_AutoSync\\seta\_signal\_archetypes\_365d.csv

G:\\My Drive\\Tableau\_AutoSync\\seta\_signal\_archetypes\_365d.json



It also refreshes website/dashboard payloads in the repo:



fix26\_screener\_store.json

fix26\_chart\_store\_public.json

fix26\_chart\_store\_member.json



If auto-commit/auto-push is enabled in the refresh bat, these can update the website automatically.



If auto-commit/auto-push is disabled, commit manually:



git commit -m "Fix 26 dashboard payload and SETA screener refresh"

git push origin main

Step 2 — Draft-only content pipeline



Runs:



run\_seta\_content\_pipeline\_daily.bat



This runs:



daily\_content\_packet

website\_snippets

blog\_outline

blog\_draft

social\_calendar

public\_website\_content



The pipeline should complete with:



status: passed

draft\_only: true

posting\_performed: false

Public website content



The public website content step writes:



public\_content\\seta\_website\_snippets\_latest.json

public\_content\\seta\_website\_snippets\_latest.md



These are public-safe copies of the generated website snippets.



Expected safety fields:



{

&#x20; "schema\_version": "seta\_public\_website\_snippets\_v1",

&#x20; "public\_safe": true,

&#x20; "posting\_performed": false

}



The public website/dashboard should consume:



public\_content/seta\_website\_snippets\_latest.json



Dated public content archives and smoke outputs are ignored by git.



Review files after a daily run



Open these after the run:



reply\_agent\\pipeline\_runs\\seta\_content\_pipeline\_run\_latest.md

reply\_agent\\website\_snippets\\seta\_website\_snippets\_latest.md

reply\_agent\\blog\_outlines\\seta\_blog\_outline\_latest.md

reply\_agent\\blog\_drafts\\seta\_blog\_draft\_latest.md

reply\_agent\\social\_calendar\\seta\_social\_calendar\_latest.md

public\_content\\seta\_website\_snippets\_latest.md



The most important first review file is:



reply\_agent\\pipeline\_runs\\seta\_content\_pipeline\_run\_latest.md

Dashboard smoke test expectations



The dashboard refresh should pass checks for:



fix26\_screener\_store.json

fix26\_chart\_store\_public.json

fix26\_chart\_store\_member.json

dashboard\_fix26\_app.js

interactive\_dashboard\_fix24\_public\_embed.html

interactive\_dashboard\_fix24\_member\_embed.html



The smoke test should end with:



PASSED









Current repo production components



Important root-level ops files:



run\_seta\_daily\_all.bat

run\_seta\_content\_pipeline\_daily.bat

run\_seta\_content\_pipeline\_daily\_with\_reply\_queue.bat

refresh\_fix26\_dashboard\_all.bat



Important content scripts:



scripts\\run\_seta\_content\_pipeline.py

scripts\\build\_seta\_daily\_content\_packet.py

scripts\\build\_seta\_website\_snippets.py

scripts\\build\_seta\_blog\_outline.py

scripts\\build\_seta\_blog\_draft.py

scripts\\build\_seta\_social\_calendar.py

scripts\\publish\_seta\_public\_website\_content.py



Important dashboard/screener scripts:



build\_seta\_market\_screener.py

build\_fix26\_screener\_store.py

build\_fix26\_screener\_store\_enhanced.py



Important reference docs:



agent\_reference\\

Recommended daily habit

Run:

.\\run\_seta\_daily\_all.bat

Confirm the runner says completed successfully.

Review:

reply\_agent\\pipeline\_runs\\seta\_content\_pipeline\_run\_latest.md

Check git:

git status --short

If dashboard payloads changed and were not auto-pushed:

git commit -m "Fix 26 dashboard payload and SETA screener refresh"

git push origin main

Review content artifacts manually before using them externally.

Product focus



For the next build phase, prioritize product quality over subscriber metrics:



better website explanation copy

better public dashboard context

better blog/member note quality

better social calendar usefulness

better review ergonomics



Do not optimize for conversion/subscriber analytics until there is meaningful subscriber activity.





Then commit it:



```powershell

git add README\_SETA\_DAILY\_OPERATIONS.md

git commit -m "Add SETA daily operations guide"

git push origin main























