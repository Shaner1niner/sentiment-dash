# SETA MACD Visual Polish v3

This v3 patch is based on the exact live block extracted from:

```text
dashboard_fix26_app.js
```

Relevant lines in the extracted context:

```text
2158-2165: MACD histogram, price MACD, signal, scaled sentiment MACD, scaled sentiment signal
2168-2170: MACD cross markers
2212-2215: sentiment confirmation and last cross summary
2266: MACD annotation
```

## What changes

```text
- Renames primary MACD histogram to Price MACD Histogram
- Adds a subtle Sentiment MACD Histogram Overlay
- Hides the noisier scaled_sentiment_macd fast line by default
- Keeps the hidden fast line in customdata hover context
- Renames Scaled Sentiment Signal to Sentiment MACD Signal
- Styles the sentiment signal as a lighter dotted contextual line
- Moves bull/bear cross markers to the sentiment signal line
- Softens cross marker sizing/colors
- Updates annotation from Last Cross / Histogram to Last Sentiment Cross / Price Hist
```

## Install

```powershell
cd C:\Users\shane\Downloads\seta_macd_visual_polish_v3_pack\seta_macd_visual_polish_v3_pack

copy patch_seta_macd_visual_polish_v3.py C:\Users\shane\sentiment-dash\
copy scripts\smoke_seta_macd_visual_polish_v3.py C:\Users\shane\sentiment-dash\scripts\
copy README_SETA_MACD_VISUAL_POLISH_V3.md C:\Users\shane\sentiment-dash\
```

## Patch and test

```powershell
cd C:\Users\shane\sentiment-dash

$py = "C:\Users\shane\miniconda3\envs\seta_auto\python.exe"

& $py patch_seta_macd_visual_polish_v3.py
& $py scripts\smoke_seta_macd_visual_polish_v3.py
```

## Preview

Open the local dashboard and inspect the MACD panel.

Acceptance criteria:

```text
- Price MACD remains primary
- Sentiment fast MACD line is no longer drawn by default
- Sentiment signal line is visible but not overpowering
- Sentiment histogram overlay is subtle
- Cross markers are readable and less cluttered
```

## Commit

```powershell
git add dashboard_fix26_app.js scripts\smoke_seta_macd_visual_polish_v3.py README_SETA_MACD_VISUAL_POLISH_V3.md

git commit -m "Polish MACD sentiment overlay display"

git push origin feature/macd-visual-polish

git status --short
```

## Optional cleanup

After commit, remove patch scripts and prior failed v2 artifacts if untracked:

```powershell
Remove-Item patch_seta_macd_visual_polish_v3.py -ErrorAction SilentlyContinue
Remove-Item README_SETA_MACD_VISUAL_POLISH_V2.md -ErrorAction SilentlyContinue
Remove-Item scripts\smoke_seta_macd_visual_polish_v2.py -ErrorAction SilentlyContinue
Remove-Item patch_seta_macd_visual_polish_v2.py -ErrorAction SilentlyContinue

git status --short
```
