@echo off
setlocal

REM =============================================================
REM Fix 26 public/member dashboard refresh script
REM
REM What it does:
REM   1. Runs export_enriched_chart_history_v2.py
REM   2. Writes chart-history/attention/alert CSV outputs locally and to Tableau AutoSync
REM   3. Builds SETA screener, indicator matrix, signal archetype CSVs, and JSON sidecars
REM   4. Builds Fix 26 screener JSON payload for the website
REM   5. Builds separate lean public/member chart JSON payloads
REM   6. Stages changed website repo files in git
REM   7. Optionally commits and pushes
REM
REM Safety behavior:
REM   - Stops if any required upstream step fails
REM   - Deletes prior screener CSV/JSON outputs before rebuilding so stale files cannot pass validation
REM =============================================================

set "PYTHON_EXE=C:\Users\shane\anaconda3\python.exe"
set "EXPORTER_SCRIPT=C:\Users\shane\export_enriched_chart_history_v2.py"
set "EXPORT_DIR=C:\Users\shane\snt_exports"
set "EXPORT_FILENAME=final_combined_data_enriched_chart_history.csv"
set "TABLEAU_AUTOSYNC_DIR=G:\My Drive\Tableau_AutoSync"

set "WEBSITE_REPO=C:\Users\shane\sentiment-dash"
set "MANIFEST=%WEBSITE_REPO%\dashboard_fix26_mode_manifest.json"
set "PAYLOAD_BUILDER=%WEBSITE_REPO%\build_fix26_chart_store_payloads.py"
set "PUBLIC_JSON=%WEBSITE_REPO%\fix26_chart_store_public.json"
set "MEMBER_JSON=%WEBSITE_REPO%\fix26_chart_store_member.json"
set "INPUT_CSV=%EXPORT_DIR%\%EXPORT_FILENAME%"

REM Preferred location is versioned inside sentiment-dash; fallback supports your current local script.
set "SCREENER_SCRIPT=%WEBSITE_REPO%\scripts\build_seta_market_screener.py"
if not exist "%SCREENER_SCRIPT%" set "SCREENER_SCRIPT=C:\Users\shane\build_seta_market_screener.py"

set "SCREENER_STORE_BUILDER=%WEBSITE_REPO%\scripts\build_fix26_screener_store.py"
set "SCREENER_STORE_JSON=%WEBSITE_REPO%\fix26_screener_store.json"

set "SCREENER_CSV=%TABLEAU_AUTOSYNC_DIR%\seta_market_screener_365d.csv"
set "INDICATOR_MATRIX_CSV=%TABLEAU_AUTOSYNC_DIR%\seta_indicator_matrix_365d.csv"
set "ARCHETYPES_CSV=%TABLEAU_AUTOSYNC_DIR%\seta_signal_archetypes_365d.csv"

set "SCREENER_JSON=%TABLEAU_AUTOSYNC_DIR%\seta_market_screener_365d.json"
set "INDICATOR_MATRIX_JSON=%TABLEAU_AUTOSYNC_DIR%\seta_indicator_matrix_365d.json"
set "ARCHETYPES_JSON=%TABLEAU_AUTOSYNC_DIR%\seta_signal_archetypes_365d.json"

set "ALERT_EVENTS_CSV=%TABLEAU_AUTOSYNC_DIR%\seta_alert_events_365d.csv"
set "ALERT_AUDIT_CSV=%TABLEAU_AUTOSYNC_DIR%\seta_alert_audit_365d.csv"

REM Optional behavior switches
set "AUTO_COMMIT=1"
set "AUTO_PUSH=1"
set "COMMIT_MESSAGE=Fix 26 dashboard payload and SETA screener refresh"

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

if not exist "%PAYLOAD_BUILDER%" (
  echo [ERROR] Fix 26 payload builder not found:
  echo         %PAYLOAD_BUILDER%
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
echo [1/6] Running chart-history exporter...
echo ============================================================
echo Export terms: %EXPORT_TERMS%
echo Local export dir: %EXPORT_DIR%
echo Tableau AutoSync dir: %TABLEAU_AUTOSYNC_DIR%
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
if exist "%INDICATOR_MATRIX_CSV%" del "%INDICATOR_MATRIX_CSV%"
if exist "%ARCHETYPES_CSV%" del "%ARCHETYPES_CSV%"
if exist "%SCREENER_JSON%" del "%SCREENER_JSON%"
if exist "%INDICATOR_MATRIX_JSON%" del "%INDICATOR_MATRIX_JSON%"
if exist "%ARCHETYPES_JSON%" del "%ARCHETYPES_JSON%"
if exist "%SCREENER_STORE_JSON%" del "%SCREENER_STORE_JSON%"

echo.
echo ============================================================
echo [2/6] Building SETA screener CSVs and JSON sidecars...
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

if not exist "%SCREENER_JSON%" (
  echo [ERROR] Expected screener JSON sidecar was not created:
  echo         %SCREENER_JSON%
  echo Make sure scripts\build_seta_market_screener.py contains write_json_sidecar.
  goto :fail
)

if not exist "%INDICATOR_MATRIX_JSON%" (
  echo [ERROR] Expected indicator matrix JSON sidecar was not created:
  echo         %INDICATOR_MATRIX_JSON%
  echo Make sure scripts\build_seta_market_screener.py contains write_json_sidecar.
  goto :fail
)

if not exist "%ARCHETYPES_JSON%" (
  echo [ERROR] Expected signal archetypes JSON sidecar was not created:
  echo         %ARCHETYPES_JSON%
  echo Make sure scripts\build_seta_market_screener.py contains write_json_sidecar.
  goto :fail
)

echo.
echo ============================================================
echo [3/6] Building Fix 26 screener JSON payload...
echo ============================================================
"%PYTHON_EXE%" "%SCREENER_STORE_BUILDER%" ^
  --source-dir "%TABLEAU_AUTOSYNC_DIR%" ^
  --output-dir "%WEBSITE_REPO%"
if errorlevel 1 (
  echo [ERROR] Fix 26 screener JSON payload builder failed.
  goto :fail
)

if not exist "%SCREENER_STORE_JSON%" (
  echo [ERROR] Expected website screener JSON was not created:
  echo         %SCREENER_STORE_JSON%
  goto :fail
)

echo.
echo ============================================================
echo [4/6] Building Fix 26 public/member chart JSON payloads...
echo ============================================================
"%PYTHON_EXE%" "%PAYLOAD_BUILDER%" ^
  --manifest "%MANIFEST%" ^
  --input-csv "%INPUT_CSV%" ^
  --output-dir "%WEBSITE_REPO%" ^
  --mode all ^
  --minify
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
echo [5/6] Staging website repo changes...
echo ============================================================
pushd "%WEBSITE_REPO%"
if errorlevel 1 (
  echo [ERROR] Could not enter website repo folder.
  goto :fail
)

git add dashboard_fix26_mode_manifest.json
git add dashboard_fix26_base.css
git add dashboard_fix26_app.js
git add build_fix26_chart_store_payloads.py
git add refresh_fix26_dashboard_all.bat
git add fix26_chart_store_public.json
git add fix26_chart_store_member.json
git add fix26_screener_store.json
if exist scripts\build_fix26_screener_store.py git add scripts\build_fix26_screener_store.py
REM phase_g_market_tape_v1
if exist scripts\build_seta_market_screener.py git add scripts\build_seta_market_screener.py
if exist scripts\build_fix26_screener_store.py git add scripts\build_fix26_screener_store.py
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

echo.
echo Current git status:
git status --short

if "%AUTO_COMMIT%"=="1" (
  echo.
  echo ============================================================
  echo [6/6] Creating git commit...
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
pause
exit /b 0

:fail
echo.
echo Script stopped due to an error.
pause
exit /b 1
