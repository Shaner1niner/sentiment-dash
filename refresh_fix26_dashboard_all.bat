@echo off
setlocal
chcp 65001 >nul
set "PYTHONUTF8=1"
set "PYTHONIOENCODING=utf-8"


REM =============================================================
REM Fix 26 public/member dashboard refresh script - production hardened
REM
REM What it does:
REM   1. Runs export_enriched_chart_history_v2.py for the dashboard union
REM   1b. Optionally overlays chart-history from final_combined_data_enriched_tbl
REM       through scripts\export_dashboard_chart_history_from_db.py
REM   2. Writes chart-history/attention/alert CSV outputs locally and to Tableau AutoSync
REM   3. Builds SETA screener, indicator matrix, and signal archetype CSVs/JSONs
REM   4. Builds Fix 26 screener JSON payload for the website
REM   5. Builds separate lean public/member chart JSON payloads
REM   6. Refreshes reviewed Briefing Mode payload keys against the latest chart date
REM   7. Runs dashboard smoke checks
REM   8. Stages changed website repo files in git
REM   9. Optionally commits and pushes
REM
REM Safety behavior:
REM   - Default chart-history payload path uses the canonical DB overlay
REM   - Set USE_DB_CHART_EXPORT=0 to force legacy chart-history output
REM   - DB chart-history export must pass row/date-depth guardrails before overwriting CSVs
REM   - Legacy exporter still refreshes alert/audit/attention sidecars used downstream
REM   - If the DB chart-history bridge fails, the script falls back to legacy
REM     chart-history output unless DB_EXPORT_FALLBACK_TO_LEGACY=0
REM   - Stops if any required upstream step fails
REM   - Deletes prior screener outputs before rebuilding so stale files cannot pass validation
REM   - Smoke test fails fast on missing Market Tape/dashboard payload pieces
REM =============================================================

set "PYTHON_EXE=C:\Users\shane\anaconda3\python.exe"
set "EXPORTER_SCRIPT=C:\Users\shane\export_enriched_chart_history_v2.py"
set "EXPORT_DIR=C:\Users\shane\snt_exports"
set "EXPORT_FILENAME=final_combined_data_enriched_chart_history.csv"
set "TABLEAU_AUTOSYNC_DIR=G:\My Drive\Tableau_AutoSync"

set "WEBSITE_REPO=C:\Users\shane\sentiment-dash"
set "MANIFEST=%WEBSITE_REPO%\dashboard_fix26_mode_manifest.json"
set "PAYLOAD_BUILDER=%WEBSITE_REPO%\build_fix26_chart_store_payloads.py"
set "DB_EXPORT_BRIDGE=%WEBSITE_REPO%\scripts\export_dashboard_chart_history_from_db.py"
set "PUBLIC_JSON=%WEBSITE_REPO%\fix26_chart_store_public.json"
set "MEMBER_JSON=%WEBSITE_REPO%\fix26_chart_store_member.json"
set "INPUT_CSV=%EXPORT_DIR%\%EXPORT_FILENAME%"
set "SMOKE_SCRIPT=%WEBSITE_REPO%\scripts\smoke_fix26_dashboard.py"

REM Preferred location is versioned inside sentiment-dash; fallback supports current local script.
set "SCREENER_SCRIPT=%WEBSITE_REPO%\scripts\build_seta_market_screener.py"
if not exist "%SCREENER_SCRIPT%" set "SCREENER_SCRIPT=C:\Users\shane\build_seta_market_screener.py"

set "SCREENER_STORE_BUILDER=%WEBSITE_REPO%\scripts\build_fix26_screener_store.py"
set "SCREENER_STORE_JSON=%WEBSITE_REPO%\fix26_screener_store.json"
set "STRUCTURE_HISTORY_BUILDER=%WEBSITE_REPO%\scripts\append_structure_score_history.py"
set "STRUCTURE_HISTORY_JSON=%WEBSITE_REPO%\fix26_structure_score_history.json"
set "STRUCTURE_HISTORY_SMOKE=%WEBSITE_REPO%\scripts\smoke_structure_score_history.py"
set "REVIEWED_BRIEFING_REFRESH=%WEBSITE_REPO%\scripts\regenerate_reviewed_briefings_v2.py"
set "REVIEWED_BRIEFINGS_JSON=%WEBSITE_REPO%\generated_briefings_reviewed.json"
set "REVIEWED_BRIEFINGS_V2_JSON=%WEBSITE_REPO%\generated_briefings_reviewed_v2.json"

set "SCREENER_CSV=%TABLEAU_AUTOSYNC_DIR%\seta_market_screener_365d.csv"
set "SCREENER_JSON=%TABLEAU_AUTOSYNC_DIR%\seta_market_screener_365d.json"
set "INDICATOR_MATRIX_CSV=%TABLEAU_AUTOSYNC_DIR%\seta_indicator_matrix_365d.csv"
set "INDICATOR_MATRIX_JSON=%TABLEAU_AUTOSYNC_DIR%\seta_indicator_matrix_365d.json"
set "ARCHETYPES_CSV=%TABLEAU_AUTOSYNC_DIR%\seta_signal_archetypes_365d.csv"
set "ARCHETYPES_JSON=%TABLEAU_AUTOSYNC_DIR%\seta_signal_archetypes_365d.json"
set "ALERT_EVENTS_CSV=%TABLEAU_AUTOSYNC_DIR%\seta_alert_events_365d.csv"
set "ALERT_AUDIT_CSV=%TABLEAU_AUTOSYNC_DIR%\seta_alert_audit_365d.csv"

REM Optional behavior switches
set "AUTO_COMMIT=0"
set "AUTO_PUSH=0"
set "COMMIT_MESSAGE=Fix 26 dashboard payload and SETA screener refresh"

REM DB chart-history bridge switches. Defaults can be overridden before running this BAT:
REM   set USE_DB_CHART_EXPORT=0
REM   set DB_EXPORT_FALLBACK_TO_LEGACY=0
REM   set DB_CHART_EXPORT_ASSET_SOURCE=db
REM   set DB_CHART_MIN_ROWS_PER_TERM=150
REM   set DB_CHART_MIN_MEDIAN_ROWS_PER_TERM=250
REM   set DB_CHART_MIN_DATE_SPAN_DAYS=330
if "%USE_DB_CHART_EXPORT%"=="" set "USE_DB_CHART_EXPORT=1"
if "%DB_EXPORT_FALLBACK_TO_LEGACY%"=="" set "DB_EXPORT_FALLBACK_TO_LEGACY=1"
if "%DB_CHART_EXPORT_ASSET_SOURCE%"=="" set "DB_CHART_EXPORT_ASSET_SOURCE=manifest"
if "%DB_CHART_EXPORT_MODE%"=="" set "DB_CHART_EXPORT_MODE=all"
if "%DB_CHART_HISTORY_DAYS%"=="" set "DB_CHART_HISTORY_DAYS=365"
if "%DB_CHART_MIN_ROWS_PER_TERM%"=="" set "DB_CHART_MIN_ROWS_PER_TERM=150"
if "%DB_CHART_MIN_MEDIAN_ROWS_PER_TERM%"=="" set "DB_CHART_MIN_MEDIAN_ROWS_PER_TERM=250"
if "%DB_CHART_MIN_DATE_SPAN_DAYS%"=="" set "DB_CHART_MIN_DATE_SPAN_DAYS=330"

if "%TWT_SNT_DB_URL%"=="" (
  echo [ERROR] TWT_SNT_DB_URL is not set.
  echo Please add it in Windows Environment Variables.
  goto :fail
)

if not exist "%PYTHON_EXE%" (
  echo [ERROR] Python executable not found:
  echo         %PYTHON_EXE%
  goto :fail
)

if not exist "%EXPORTER_SCRIPT%" (
  echo [ERROR] Exporter script not found:
  echo         %EXPORTER_SCRIPT%
  goto :fail
)

if "%USE_DB_CHART_EXPORT%"=="1" (
  if not exist "%DB_EXPORT_BRIDGE%" (
    echo [ERROR] DB chart-history export bridge not found:
    echo         %DB_EXPORT_BRIDGE%
    goto :fail
  )
)

if not exist "%PAYLOAD_BUILDER%" (
  echo [ERROR] Fix 26 payload builder not found:
  echo         %PAYLOAD_BUILDER%
  goto :fail
)

if not exist "%STRUCTURE_HISTORY_BUILDER%" (
  echo [ERROR] Structure Score history builder not found:
  echo         %STRUCTURE_HISTORY_BUILDER%
  goto :fail
)

if not exist "%SCREENER_SCRIPT%" (
  echo [ERROR] SETA screener builder not found:
  echo         %SCREENER_SCRIPT%
  echo Expected either:
  echo         %WEBSITE_REPO%\scripts\build_seta_market_screener.py
  echo or:
  echo         C:\Users\shane\build_seta_market_screener.py
  goto :fail
)

if not exist "%SCREENER_STORE_BUILDER%" (
  echo [ERROR] Fix 26 screener store builder not found:
  echo         %SCREENER_STORE_BUILDER%
  goto :fail
)

if not exist "%SMOKE_SCRIPT%" (
  echo [ERROR] Dashboard smoke test not found:
  echo         %SMOKE_SCRIPT%
  goto :fail
)

if not exist "%REVIEWED_BRIEFING_REFRESH%" (
  echo [ERROR] Reviewed briefing refresh script not found:
  echo         %REVIEWED_BRIEFING_REFRESH%
  goto :fail
)

if not exist "%MANIFEST%" (
  echo [ERROR] Fix 26 mode manifest not found:
  echo         %MANIFEST%
  goto :fail
)

if not exist "%WEBSITE_REPO%" (
  echo [ERROR] Website repo folder not found:
  echo         %WEBSITE_REPO%
  goto :fail
)

where git >nul 2>nul
if errorlevel 1 (
  echo [ERROR] Git is not available in PATH.
  goto :fail
)

if not exist "%EXPORT_DIR%" mkdir "%EXPORT_DIR%"
if not exist "%TABLEAU_AUTOSYNC_DIR%" mkdir "%TABLEAU_AUTOSYNC_DIR%"

set "EXPORT_TERMS=BTC,ETH,SOL,NVDA,MSFT,COIN,AAPL,SPY,GLD,DOGE,AVAX,LINK,BNB,XRP,AMZN,GOOGL,META,NFLX,TSLA,QQQ,XLE,TLT,DXY,AMD,PLTR,SHOP,SMCI,MSTR"

echo.
echo ============================================================
echo [1/8] Running legacy chart-history exporter...
echo ============================================================
echo Export terms: %EXPORT_TERMS%
echo Local export dir: %EXPORT_DIR%
echo Tableau AutoSync dir: %TABLEAU_AUTOSYNC_DIR%
echo DB chart-history overlay: %USE_DB_CHART_EXPORT%
"%PYTHON_EXE%" "%EXPORTER_SCRIPT%" ^
  --history-days 365 ^
  --output-dir "%EXPORT_DIR%" ^
  --output-filename "%EXPORT_FILENAME%" ^
  --tableau-autosync-dir "%TABLEAU_AUTOSYNC_DIR%" ^
  --with-attention ^
  --chart-terms %EXPORT_TERMS% ^
  --trim-to-chart-terms
if errorlevel 1 (
  echo [ERROR] Exporter failed. Screener and JSON payloads were not rebuilt.
  goto :fail
)

if "%USE_DB_CHART_EXPORT%"=="1" (
  echo.
  echo ============================================================
  echo [1b/8] Overlaying chart-history CSV from canonical DB table...
  echo ============================================================
  echo DB bridge: %DB_EXPORT_BRIDGE%
  echo DB asset source: %DB_CHART_EXPORT_ASSET_SOURCE%
  echo DB mode: %DB_CHART_EXPORT_MODE%
  echo DB history days: %DB_CHART_HISTORY_DAYS%
  echo DB min rows per term: %DB_CHART_MIN_ROWS_PER_TERM%
  echo DB min median rows per term: %DB_CHART_MIN_MEDIAN_ROWS_PER_TERM%
  echo DB min date span days: %DB_CHART_MIN_DATE_SPAN_DAYS%
  "%PYTHON_EXE%" "%DB_EXPORT_BRIDGE%" ^
    --asset-source "%DB_CHART_EXPORT_ASSET_SOURCE%" ^
    --mode "%DB_CHART_EXPORT_MODE%" ^
    --history-days %DB_CHART_HISTORY_DAYS% ^
    --min-rows-per-term %DB_CHART_MIN_ROWS_PER_TERM% ^
    --min-median-rows-per-term %DB_CHART_MIN_MEDIAN_ROWS_PER_TERM% ^
    --min-date-span-days %DB_CHART_MIN_DATE_SPAN_DAYS% ^
    --output-dir "%EXPORT_DIR%" ^
    --output-filename "%EXPORT_FILENAME%" ^
    --tableau-autosync-dir "%TABLEAU_AUTOSYNC_DIR%"
  if errorlevel 1 (
    if "%DB_EXPORT_FALLBACK_TO_LEGACY%"=="1" (
      echo [WARN] DB chart-history overlay failed. Continuing with legacy exporter chart-history CSV.
    ) else (
      echo [ERROR] DB chart-history overlay failed and DB_EXPORT_FALLBACK_TO_LEGACY=0.
      goto :fail
    )
  )
)

if not exist "%INPUT_CSV%" (
  echo [ERROR] Expected local chart-history CSV was not created:
  echo         %INPUT_CSV%
  goto :fail
)

if not exist "%TABLEAU_AUTOSYNC_DIR%\%EXPORT_FILENAME%" (
  echo [ERROR] Expected Tableau AutoSync chart-history CSV was not created:
  echo         %TABLEAU_AUTOSYNC_DIR%\%EXPORT_FILENAME%
  goto :fail
)

if not exist "%ALERT_EVENTS_CSV%" (
  echo [ERROR] Expected alert events CSV was not created:
  echo         %ALERT_EVENTS_CSV%
  goto :fail
)

if not exist "%ALERT_AUDIT_CSV%" (
  echo [ERROR] Expected alert audit CSV was not created:
  echo         %ALERT_AUDIT_CSV%
  goto :fail
)

echo.
echo Cleaning prior screener outputs...
if exist "%SCREENER_CSV%" del "%SCREENER_CSV%"
if exist "%SCREENER_JSON%" del "%SCREENER_JSON%"
if exist "%INDICATOR_MATRIX_CSV%" del "%INDICATOR_MATRIX_CSV%"
if exist "%INDICATOR_MATRIX_JSON%" del "%INDICATOR_MATRIX_JSON%"
if exist "%ARCHETYPES_CSV%" del "%ARCHETYPES_CSV%"
if exist "%ARCHETYPES_JSON%" del "%ARCHETYPES_JSON%"
if exist "%SCREENER_STORE_JSON%" del "%SCREENER_STORE_JSON%"

echo.
echo ============================================================
echo [2/8] Building SETA market screener, indicator matrix, and archetypes...
echo ============================================================
echo Screener script: %SCREENER_SCRIPT%
"%PYTHON_EXE%" "%SCREENER_SCRIPT%" ^
  --source-dir "%TABLEAU_AUTOSYNC_DIR%"
if errorlevel 1 (
  echo [ERROR] SETA screener builder failed. JSON payloads were not rebuilt.
  goto :fail
)

if not exist "%SCREENER_CSV%" (
  echo [ERROR] Expected screener CSV was not created:
  echo         %SCREENER_CSV%
  goto :fail
)

if not exist "%INDICATOR_MATRIX_CSV%" (
  echo [ERROR] Expected indicator matrix CSV was not created:
  echo         %INDICATOR_MATRIX_CSV%
  goto :fail
)

if not exist "%ARCHETYPES_CSV%" (
  echo [ERROR] Expected signal archetypes CSV was not created:
  echo         %ARCHETYPES_CSV%
  goto :fail
)

REM JSON siblings are expected after the recent builder update.
if not exist "%SCREENER_JSON%" echo [WARN] Screener JSON sibling was not found: %SCREENER_JSON%
if not exist "%INDICATOR_MATRIX_JSON%" echo [WARN] Indicator matrix JSON sibling was not found: %INDICATOR_MATRIX_JSON%
if not exist "%ARCHETYPES_JSON%" echo [WARN] Signal archetypes JSON sibling was not found: %ARCHETYPES_JSON%

echo.
echo ============================================================
echo [3/8] Building Fix 26 screener JSON payload...
echo ============================================================
"%PYTHON_EXE%" "%SCREENER_STORE_BUILDER%" ^
  --source-dir "%TABLEAU_AUTOSYNC_DIR%" ^
  --output-dir "%WEBSITE_REPO%"
if errorlevel 1 (
  echo [ERROR] Fix 26 screener JSON payload builder failed.
  goto :fail
)

if not exist "%SCREENER_STORE_JSON%" (
  echo [ERROR] Expected screener JSON was not created:
  echo         %SCREENER_STORE_JSON%
  goto :fail
)

echo.
echo ============================================================
echo [3b/8] Appending Structure Score history snapshot...
echo ============================================================
"%PYTHON_EXE%" "%STRUCTURE_HISTORY_BUILDER%" ^
  --input "%SCREENER_STORE_JSON%" ^
  --output "%STRUCTURE_HISTORY_JSON%" ^
  --retention-hours 48
if errorlevel 1 (
  echo [ERROR] Structure Score history snapshot failed.
  goto :fail
)

echo.
echo ============================================================
echo [4/8] Building Fix 26 public/member chart JSON payloads...
echo ============================================================
"%PYTHON_EXE%" "%PAYLOAD_BUILDER%" ^
  --manifest "%MANIFEST%" ^
  --input-csv "%INPUT_CSV%" ^
  --output-dir "%WEBSITE_REPO%" ^
  --mode all ^
  --minify ^
  --split-assets
if errorlevel 1 (
  echo [ERROR] Fix 26 payload builder failed.
  goto :fail
)

if not exist "%PUBLIC_JSON%" (
  echo [ERROR] Expected public JSON was not created:
  echo         %PUBLIC_JSON%
  goto :fail
)

if not exist "%MEMBER_JSON%" (
  echo [ERROR] Expected member JSON was not created:
  echo         %MEMBER_JSON%
  goto :fail
)

echo.
echo ============================================================
echo [5/8] Refreshing reviewed Briefing Mode payload keys...
echo ============================================================
pushd "%WEBSITE_REPO%"
"%PYTHON_EXE%" "%REVIEWED_BRIEFING_REFRESH%" --path "%REVIEWED_BRIEFINGS_V2_JSON%" --refresh-keys --expand-from-manifest
if errorlevel 1 (
  popd
  echo [ERROR] Reviewed briefing V2 refresh failed.
  goto :fail
)
"%PYTHON_EXE%" "%REVIEWED_BRIEFING_REFRESH%" --path "%REVIEWED_BRIEFINGS_JSON%" --refresh-keys --expand-from-manifest
if errorlevel 1 (
  popd
  echo [ERROR] Legacy reviewed briefing refresh failed.
  goto :fail
)
popd

echo.
echo ============================================================
echo [6/8] Running dashboard smoke test...
echo ============================================================
pushd "%WEBSITE_REPO%"
"%PYTHON_EXE%" "%SMOKE_SCRIPT%"
if errorlevel 1 (
  popd
  echo [ERROR] Dashboard smoke test failed.
  goto :fail
)

"%PYTHON_EXE%" "%STRUCTURE_HISTORY_SMOKE%"
if errorlevel 1 (
  popd
  echo [ERROR] Structure Score history smoke test failed.
  goto :fail
)
popd

echo.
echo ============================================================
echo [7/8] Staging website repo changes...
echo ============================================================
pushd "%WEBSITE_REPO%"
if errorlevel 1 (
  echo [ERROR] Could not enter website repo folder.
  goto :fail
)

git add .gitignore
git add dashboard_fix26_mode_manifest.json
git add dashboard_fix26_base.css
git add dashboard_fix26_app.js
git add build_fix26_chart_store_payloads.py
git add refresh_fix26_dashboard_all.bat
git add fix26_chart_store_public.json
git add fix26_chart_store_member.json
git add fix26_chart_store_public_index.json
git add fix26_chart_store_member_index.json
if exist fix26_chart_store_assets git add fix26_chart_store_assets
git add fix26_screener_store.json
if exist fix26_structure_score_history.json git add fix26_structure_score_history.json
if exist generated_briefings_reviewed.json git add generated_briefings_reviewed.json
if exist generated_briefings_reviewed_v2.json git add generated_briefings_reviewed_v2.json
if exist scripts\build_seta_market_screener.py git add scripts\build_seta_market_screener.py
if exist scripts\build_fix26_screener_store.py git add scripts\build_fix26_screener_store.py
if exist scripts\append_structure_score_history.py git add scripts\append_structure_score_history.py
if exist scripts\smoke_structure_score_history.py git add scripts\smoke_structure_score_history.py
if exist scripts\regenerate_reviewed_briefings_v2.py git add scripts\regenerate_reviewed_briefings_v2.py
if exist scripts\smoke_fix26_dashboard.py git add scripts\smoke_fix26_dashboard.py
if exist interactive_dashboard_fix24_public_embed.html git add interactive_dashboard_fix24_public_embed.html
if exist interactive_dashboard_fix24_member_embed.html git add interactive_dashboard_fix24_member_embed.html
if exist interactive_dashboard_fix24_externalized_loader.html git add interactive_dashboard_fix24_externalized_loader.html
if exist fix26_implementation_notes.md git add fix26_implementation_notes.md
if exist SMOKE_TEST.md git add SMOKE_TEST.md
if exist docs\SETA_Screener_Output_Glossary.xlsx git add docs\SETA_Screener_Output_Glossary.xlsx
if exist docs\SETA_Screener_All_Column_Descriptions.csv git add docs\SETA_Screener_All_Column_Descriptions.csv
if exist docs\SETA_Score_Glossary.csv git add docs\SETA_Score_Glossary.csv
if exist docs\SETA_Archetype_Glossary.csv git add docs\SETA_Archetype_Glossary.csv
if exist docs\SETA_Indicator_Family_Glossary.csv git add docs\SETA_Indicator_Family_Glossary.csv
if exist docs\SETA_Score_Glossary.json git add docs\SETA_Score_Glossary.json
if exist docs\SETA_Archetype_Glossary.json git add docs\SETA_Archetype_Glossary.json
if exist docs\SETA_Indicator_Family_Glossary.json git add docs\SETA_Indicator_Family_Glossary.json

echo.
echo Current git status:
git status --short

if "%AUTO_COMMIT%"=="1" (
  echo.
  echo ============================================================
  echo [8/8] Creating git commit...
  echo ============================================================
  git commit -m "%COMMIT_MESSAGE%"
  if errorlevel 1 (
    echo [WARN] Commit step returned a non-zero status.
  )

  if "%AUTO_PUSH%"=="1" (
    echo.
    echo Pushing to origin main...
    git push origin main
    if errorlevel 1 (
      echo [WARN] Push step returned a non-zero status.
    )
  )
)

popd

echo.
echo ============================================================
echo DONE
echo ============================================================
echo Refreshed local chart-history CSV:
echo   %INPUT_CSV%
echo Refreshed Tableau AutoSync chart-history CSV:
echo   %TABLEAU_AUTOSYNC_DIR%\%EXPORT_FILENAME%
echo Alert events:
echo   %ALERT_EVENTS_CSV%
echo Alert audit:
echo   %ALERT_AUDIT_CSV%
echo Screener CSV:
echo   %SCREENER_CSV%
echo Screener JSON:
echo   %SCREENER_JSON%
echo Indicator matrix CSV:
echo   %INDICATOR_MATRIX_CSV%
echo Indicator matrix JSON:
echo   %INDICATOR_MATRIX_JSON%
echo Signal archetypes CSV:
echo   %ARCHETYPES_CSV%
echo Signal archetypes JSON:
echo   %ARCHETYPES_JSON%
echo Website screener JSON:
echo   %SCREENER_STORE_JSON%
echo Public JSON:
echo   %PUBLIC_JSON%
echo Member JSON:
echo   %MEMBER_JSON%
echo.
echo The repo changes are staged and ready.
echo If AUTO_COMMIT and AUTO_PUSH are both 0, run these next:
echo   cd %WEBSITE_REPO%
echo   git commit -m "%COMMIT_MESSAGE%"
echo   git push origin main
echo.
if not "%NO_PAUSE%"=="1" pause
exit /b 0

:fail
echo.
echo Script stopped due to an error.
if not "%NO_PAUSE%"=="1" pause
exit /b 1

echo.
echo Running dashboard quality gate...
python scripts\run_dashboard_quality_gate.py
if errorlevel 1 (
    echo Dashboard quality gate failed.
    exit /b 1
)

echo Dashboard quality gate passed.

