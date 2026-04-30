@echo off
setlocal enabledelayedexpansion

REM ============================================================
REM SETA full website refresh runner
REM
REM Runs:
REM   1. Fix 26 dashboard/data refresh
REM   2. SETA daily context rebuild
REM   3. SETA public content pipeline
REM   4. Verification
REM   5. Single final commit + push to origin/main
REM
REM Designed for Windows Task Scheduler:
REM   - No pause
REM   - UTF-8 safe Python/log output
REM   - Writes timestamped logs
REM ============================================================

chcp 65001 >nul
set "PYTHONUTF8=1"
set "PYTHONIOENCODING=utf-8"
set "NO_PAUSE=1"

set "PYTHON_EXE=C:\Users\shane\anaconda3\python.exe"
set "WEBSITE_REPO=C:\Users\shane\sentiment-dash"
set "LOG_DIR=%WEBSITE_REPO%\logs"

set "STAMP=%DATE:~-4%%DATE:~4,2%%DATE:~7,2%_%TIME:~0,2%%TIME:~3,2%%TIME:~6,2%"
set "STAMP=%STAMP: =0%"
set "LOG_FILE=%LOG_DIR%\seta_full_refresh_%STAMP%.log"

if not exist "%LOG_DIR%" mkdir "%LOG_DIR%"

echo ============================================================
echo SETA full website refresh started %DATE% %TIME%
echo Log file: %LOG_FILE%
echo ============================================================

echo ============================================================ > "%LOG_FILE%"
echo SETA full website refresh started %DATE% %TIME% >> "%LOG_FILE%"
echo Log file: %LOG_FILE% >> "%LOG_FILE%"
echo ============================================================ >> "%LOG_FILE%"

cd /d "%WEBSITE_REPO%" >> "%LOG_FILE%" 2>&1
if errorlevel 1 goto :fail

echo.
echo [0/8] Checking Python, Git, repo, and environment...
echo [0/8] Checking Python, Git, repo, and environment... >> "%LOG_FILE%"

if not exist "%PYTHON_EXE%" (
  echo [ERROR] Python executable not found: %PYTHON_EXE% >> "%LOG_FILE%"
  goto :fail
)

where git >nul 2>nul
if errorlevel 1 (
  echo [ERROR] Git is not available in PATH. >> "%LOG_FILE%"
  goto :fail
)

if "%TWT_SNT_DB_URL%"=="" (
  echo [ERROR] TWT_SNT_DB_URL is not set. >> "%LOG_FILE%"
  goto :fail
)

echo.
echo [1/8] Syncing local main with origin/main...
echo [1/8] Syncing local main with origin/main... >> "%LOG_FILE%"

git fetch origin >> "%LOG_FILE%" 2>&1
if errorlevel 1 goto :fail

git checkout main >> "%LOG_FILE%" 2>&1
if errorlevel 1 goto :fail

git pull --ff-only origin main >> "%LOG_FILE%" 2>&1
if errorlevel 1 goto :fail

echo.
echo [2/8] Running Fix 26 dashboard refresh...
echo [2/8] Running Fix 26 dashboard refresh... >> "%LOG_FILE%"

call refresh_fix26_dashboard_all.bat >> "%LOG_FILE%" 2>&1
if errorlevel 1 goto :fail

echo.
echo [3/8] Rebuilding SETA daily context...
echo [3/8] Rebuilding SETA daily context... >> "%LOG_FILE%"

"%PYTHON_EXE%" scripts\build_seta_daily_context.py >> "%LOG_FILE%" 2>&1
if errorlevel 1 goto :fail

echo.
echo [4/8] Running SETA content pipeline...
echo [4/8] Running SETA content pipeline... >> "%LOG_FILE%"

"%PYTHON_EXE%" scripts\run_seta_content_pipeline.py >> "%LOG_FILE%" 2>&1
if errorlevel 1 goto :fail

echo.
echo [5/8] Verifying refreshed public content...
echo [5/8] Verifying refreshed public content... >> "%LOG_FILE%"

"%PYTHON_EXE%" -c "import json; d=json.load(open('public_content/seta_website_snippets_latest.json',encoding='utf-8')); print('date=',d.get('date')); print('published_at_utc=',d.get('published_at_utc')); print('public_safe=',d.get('public_safe')); print('posting_performed=',d.get('posting_performed'))" >> "%LOG_FILE%" 2>&1
if errorlevel 1 goto :fail

echo.
echo [6/8] Running git status before staging...
echo [6/8] Running git status before staging... >> "%LOG_FILE%"

git status --short >> "%LOG_FILE%" 2>&1

echo.
echo [7/8] Staging website-facing files...
echo [7/8] Staging website-facing files... >> "%LOG_FILE%"

git add refresh_seta_website_full.bat
git add refresh_fix26_dashboard_all.bat

git add fix26_chart_store_public.json
git add fix26_chart_store_member.json
git add fix26_screener_store.json

git add public_content
git add reply_agent\daily_context

git status --short >> "%LOG_FILE%" 2>&1

echo.
echo [8/8] Committing and pushing if changes exist...
echo [8/8] Committing and pushing if changes exist... >> "%LOG_FILE%"

git diff --cached --quiet
if errorlevel 1 (
  git commit -m "Automated SETA website refresh" >> "%LOG_FILE%" 2>&1
  if errorlevel 1 goto :fail

  git push origin HEAD:main >> "%LOG_FILE%" 2>&1
  if errorlevel 1 goto :fail
) else (
  echo No staged changes to commit.
  echo No staged changes to commit. >> "%LOG_FILE%"
)

echo.
echo Final verification:
echo Final verification: >> "%LOG_FILE%"

git rev-parse HEAD >> "%LOG_FILE%" 2>&1
git ls-remote origin refs/heads/main >> "%LOG_FILE%" 2>&1

echo ============================================================
echo SETA full website refresh completed successfully %DATE% %TIME%
echo Log file: %LOG_FILE%
echo ============================================================

echo ============================================================ >> "%LOG_FILE%"
echo SETA full website refresh completed successfully %DATE% %TIME% >> "%LOG_FILE%"
echo ============================================================ >> "%LOG_FILE%"

exit /b 0

:fail
echo.
echo ============================================================
echo SETA full website refresh FAILED %DATE% %TIME%
echo See log: %LOG_FILE%
echo ============================================================

echo ============================================================ >> "%LOG_FILE%"
echo SETA full website refresh FAILED %DATE% %TIME% >> "%LOG_FILE%"
echo See log: %LOG_FILE% >> "%LOG_FILE%"
echo ============================================================ >> "%LOG_FILE%"

exit /b 1