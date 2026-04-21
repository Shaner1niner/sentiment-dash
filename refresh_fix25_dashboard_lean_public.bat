@echo off
setlocal

REM =============================================================
REM Fix 25B public dashboard refresh script
REM
REM What it does:
REM   1. Runs export_enriched_chart_history_v2.py
REM   2. Builds a lean minified public website JSON
REM   3. Stages changed website repo files in git
REM   4. Optionally commits and pushes
REM =============================================================

set "PYTHON_EXE=C:\Users\shane\anaconda3\python.exe"
set "EXPORTER_SCRIPT=C:\Users\shane\export_enriched_chart_history_v2.py"
set "EXPORT_DIR=C:\Users\shane\snt_exports"
set "EXPORT_FILENAME=final_combined_data_enriched_chart_history.csv"
set "WEBSITE_REPO=C:\Users\shane\sentiment-dash"
set "JSON_BUILDER=%WEBSITE_REPO%\build_fix25_chart_store_lean.py"
set "OUTPUT_JSON=%WEBSITE_REPO%\fix24_chart_store.json"

REM Public free basket for the website JSON
set "CHART_TERMS=BTC,ETH,NVDA,NFLX,COIN"

REM Optional behavior switches
set "AUTO_COMMIT=0"
set "AUTO_PUSH=0"
set "COMMIT_MESSAGE=Refresh Fix 25B lean public dashboard data"

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

if not exist "%JSON_BUILDER%" (
  echo [ERROR] JSON builder script not found:
  echo         %JSON_BUILDER%
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
set "INPUT_CSV=%EXPORT_DIR%\%EXPORT_FILENAME%"

echo.
echo ============================================================
echo [1/4] Running chart-history exporter...
echo ============================================================
"%PYTHON_EXE%" "%EXPORTER_SCRIPT%" ^
  --history-days 365 ^
  --output-dir "%EXPORT_DIR%" ^
  --output-filename "%EXPORT_FILENAME%" ^
  --with-attention ^
  --chart-terms %CHART_TERMS% ^
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
echo [2/4] Building lean website JSON...
echo ============================================================
"%PYTHON_EXE%" "%JSON_BUILDER%" ^
  --input-csv "%INPUT_CSV%" ^
  --output-json "%OUTPUT_JSON%" ^
  --terms %CHART_TERMS% ^
  --minify
if errorlevel 1 (
  echo [ERROR] JSON builder failed.
  goto :fail
)

if not exist "%OUTPUT_JSON%" (
  echo [ERROR] Expected JSON was not created:
  echo         %OUTPUT_JSON%
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

git add fix24_chart_store.json
if exist interactive_dashboard_fix25_public_embed_canonical_overlap.html git add interactive_dashboard_fix25_public_embed_canonical_overlap.html
if exist interactive_dashboard_fix25_member_embed_canonical_overlap.html git add interactive_dashboard_fix25_member_embed_canonical_overlap.html
if exist interactive_dashboard_fix24_public_embed.html git add interactive_dashboard_fix24_public_embed.html
if exist interactive_dashboard_fix24_member_embed.html git add interactive_dashboard_fix24_member_embed.html

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
echo Lean public JSON:
echo   %OUTPUT_JSON%
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
