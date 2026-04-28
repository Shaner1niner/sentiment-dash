# SETA Public Website Context Cards v1

This adds a website-ready card page that reads:

```text
public_content/seta_website_snippets_latest.json
```

and displays public-safe SETA explanation cards.

## What it shows

Each card can show:

```text
term
universe
copy archetype
narrative theme
headline
public note
watch condition
SETA read
regime note
narrative note
risk note
```

## Safety

The page refuses to treat the data as valid unless the JSON has:

```json
{
  "public_safe": true,
  "posting_performed": false
}
```

The visible copy also includes:

```text
Interpretation context only; not predictions, recommendations, or trade signals.
```

## Install

From the extracted pack folder:

```powershell
copy seta_public_context_cards.html C:\Users\shane\sentiment-dash\
copy scripts\smoke_seta_public_context_cards.py C:\Users\shane\sentiment-dash\scripts\
copy README_SETA_PUBLIC_CONTEXT_CARDS.md C:\Users\shane\sentiment-dash\
```

## Test

From the repo root:

```powershell
cd C:\Users\shane\sentiment-dash

python scripts\smoke_seta_public_context_cards.py
```

If PowerShell does not know `python`, use:

```powershell
$py = "C:\Users\shane\miniconda3\envs\seta_auto\python.exe"
& $py scripts\smoke_seta_public_context_cards.py
```

## Open locally

The page fetches JSON, so it works best through a simple local server:

```powershell
cd C:\Users\shane\sentiment-dash
$py = "C:\Users\shane\miniconda3\envs\seta_auto\python.exe"
& $py -m http.server 8765
```

Then open:

```text
http://localhost:8765/seta_public_context_cards.html
```

## Commit

```powershell
git add seta_public_context_cards.html scripts\smoke_seta_public_context_cards.py README_SETA_PUBLIC_CONTEXT_CARDS.md
git commit -m "Add SETA public website context cards"
git push origin main
git status --short
```

## Website integration options

### Option A: Standalone page

Link directly to:

```text
seta_public_context_cards.html
```

### Option B: Embed in an existing page

Use an iframe:

```html
<iframe
  src="seta_public_context_cards.html"
  title="SETA Market Context Cards"
  style="width:100%;height:900px;border:0;border-radius:24px;"
></iframe>
```

### Option C: Dashboard integration later

A later patch can integrate the card renderer directly into the existing dashboard app. For v1, the standalone page is safer because it does not risk breaking the current dashboard.
