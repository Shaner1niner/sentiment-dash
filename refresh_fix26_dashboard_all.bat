@echo off
setlocal

REM =============================================================
REM Fix 26 public/member dashboard refresh script
REM
REM What it does:
REM   1. Reads the Fix 26 manifest to get the union of public/member assets
REM   2. Runs export_enriched_chart_history_v2.py for that union
REM   3. Builds separate lean public/member JSON payloads
REM   4. Stages changed website repo files in git
REM   5. Optionally commits and pushes
REM =============================================================

set "PYTHON_EXE=C:\Users\shane\anaconda3\python.exe"
set "EXPORTER_SCRIPT=C:\Users\shane\export_enriched_chart_history_v2.py"
set "EXPORT_DIR=C:\Users\shane\snt_exports"
set "EXPORT_FILENAME=final_combined_data_enriched_chart_history.csv"
set "WEBSITE_REPO=C:\Users\shane\sentiment-dash"
set "MANIFEST=%WEBSITE_REPO%\dashboard_fix26_mode_manifest.json"
set "PAYLOAD_BUILDER=%WEBSITE_REPO%\build_fix26_chart_store_payloads.py"
set "PUBLIC_JSON=%WEBSITE_REPO%\fix26_chart_store_public.json"
set "MEMBER_JSON=%WEBSITE_REPO%\fix26_chart_store_member.json"
set "INPUT_CSV=%EXPORT_DIR%\%EXPORT_FILENAME%"

REM Optional behavior switches
set "AUTO_COMMIT=0"
set "AUTO_PUSH=0"
set "COMMIT_MESSAGE=Fix 26 asset expansion and mode-config payload refresh"

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

set "EXPORT_TERMS=BTC,ETH,SOL,NVDA,MSFT,COIN,AAPL,SPY,GLD,DOGE,AVAX,LINK,BNB,XRP,AMZN,GOOGL,META,NFLX,TSLA,QQQ,XLE,TLT,DXY,AMD,PLTR,SHOP,SMCI,MSTR"

echo.
echo ============================================================
echo [1/4] Running chart-history exporter...
echo ============================================================
echo Export terms: %EXPORT_TERMS%
"%PYTHON_EXE%" "%EXPORTER_SCRIPT%" ^
  --history-days 365 ^
  --output-dir "%EXPORT_DIR%" ^
  --output-filename "%EXPORT_FILENAME%" ^
  --with-attention ^
  --chart-terms %EXPORT_TERMS% ^
  --trim-to-chart-terms
if errorlevel 1 (
  echo [ERROR] Exporter failed.
  goto :fail
)

if not exist "%INPUT_CSV%" (
  echo [ERROR] Expected CSV was not created:
  echo         %INPUT_CSV%
  goto :fail
)

echo.
echo ============================================================
echo [2/4] Building Fix 26 public/member JSON payloads...
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
echo [3/4] Staging website repo changes...
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
if exist interactive_dashboard_fix24_public_embed.html git add interactive_dashboard_fix24_public_embed.html
if exist interactive_dashboard_fix24_member_embed.html git add interactive_dashboard_fix24_member_embed.html
if exist interactive_dashboard_fix24_externalized_loader.html git add interactive_dashboard_fix24_externalized_loader.html
if exist fix26_implementation_notes.md git add fix26_implementation_notes.md

echo.
echo Current git status:
git status --short

if "%AUTO_COMMIT%"=="1" (
  echo.
  echo ============================================================
  echo [4/4] Creating git commit...
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
echo Refreshed CSV:
echo   %INPUT_CSV%
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
