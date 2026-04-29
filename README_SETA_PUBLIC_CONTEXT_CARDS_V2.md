# SETA Public Website Context Cards v2

This polish pass upgrades the public context cards page.

## Improvements

```text
featured context row
global safety/status pills
SEO-friendly explanatory blocks
collapsed detail sections
ticker anchor links
less repetitive visible risk-note copy
sticky controls
stronger product-page presentation
```

The page still reads:

```text
public_content/seta_website_snippets_latest.json
```

and still requires:

```json
{
  "public_safe": true,
  "posting_performed": false
}
```

## Install

From the extracted pack folder:

```powershell
copy patch_seta_public_context_cards_v2.py C:\Users\shane\sentiment-dash\
copy scripts\smoke_seta_public_context_cards_v2.py C:\Users\shane\sentiment-dash\scripts\
copy README_SETA_PUBLIC_CONTEXT_CARDS_V2.md C:\Users\shane\sentiment-dash\
```

## Patch

```powershell
cd C:\Users\shane\sentiment-dash
$py = "C:\Users\shane\miniconda3\envs\seta_auto\python.exe"
& $py patch_seta_public_context_cards_v2.py
```

## Smoke test

```powershell
& $py scripts\smoke_seta_public_context_cards_v2.py
```

## Preview

```powershell
& $py -m http.server 8765
```

Open:

```text
http://localhost:8765/seta_public_context_cards.html
```

## Commit

```powershell
git add seta_public_context_cards.html scripts\smoke_seta_public_context_cards_v2.py README_SETA_PUBLIC_CONTEXT_CARDS_V2.md
git commit -m "Polish SETA public website context cards"
git push origin main
git status --short
```
