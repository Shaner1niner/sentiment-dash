\# Dashboard Quality Gate Runbook



\## Purpose



The dashboard quality gate prevents SETA dashboard refreshes from publishing payloads that are structurally valid but analytically broken.



It was added after a March/April oscillator continuity incident where JSON payloads loaded successfully, but RSI / Stochastic RSI fields had mid-series null holes across multiple assets.



The operating rule is:



> A dashboard refresh is not complete just because JSON files are valid. Core analytical indicators must also pass continuity checks.



\## Main command



Run:



```powershell

python scripts\\run\_dashboard\_quality\_gate.py

