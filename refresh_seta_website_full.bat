@echo off
setlocal enabledelayedexpansion

REM ============================================================
REM SETA full website refresh runner - hardened publisher
REM
REM Runs:
REM   1. Sync local main with origin/main
REM   2. Fix 26 dashboard/data refresh
REM   3. SETA daily context rebuild
REM   4. SETA public content pipeline
REM   5. Public-safe content gates
REM   6. Local smoke gates
REM   7. Stage generated website-facing artifacts only
REM   8. Commit + push to origin/main when generated changes exist
REM   9. Optional live GitHub Pages health check
REM
REM Designed for Windows Task Scheduler:
REM   - No pause
REM   - UTF-8 safe Python/log output
REM   - Writes timestamped logs
REM   - Fails closed on unsafe content or smoke-test failures
REM ============================================================

chcp 65001 >nul
set "PYTHONUTF8=1"
set "PYTHONIOENCODING=utf-8"
set "NO_PAUSE=1"

set "PYTHON_EXE=C:\Users\shane\anaconda3\python.exe"
set "WEBSITE_REPO=C:\Users\shane\sentiment-dash"
set "LOG_DIR=%WEBSITE_REPO%\logs"

if "%COMMIT_MESSAGE%"=="" set "COMMIT_MESSAGE=Automated SETA website refresh"
if "%RUN_LIVE_SMOKE%"=="" set "RUN_LIVE_SMOKE=0"

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
echo [0/11] Checking Python, Git, repo, and environment...
echo [0/11] Checking Python, Git, repo, and environment... >> "%LOG_FILE%"

if not exist "%PYTHON_EXE%" (
  echo [ERROR] Python executable not found: %PYTHON_EXE%
  echo [ERROR] Python executable not found: %PYTHON_EXE% >> "%LOG_FILE%"
  goto :fail
)

where git >nul 2>nul
if errorlevel 1 (
  echo [ERROR] Git is not available in PATH.
  echo [ERROR] Git is not available in PATH. >> "%LOG_FILE%"
  goto :fail
)

if "%TWT_SNT_DB_URL%"=="" (
  echo [ERROR] TWT_SNT_DB_URL is not set.
  echo [ERROR] TWT_SNT_DB_URL is not set. >> "%LOG_FILE%"
  goto :fail
)

echo.
echo [1/11] Syncing local main with origin/main...
echo [1/11] Syncing local main with origin/main... >> "%LOG_FILE%"

git fetch --prune origin >> "%LOG_FILE%" 2>&1
if errorlevel 1 goto :fail

git checkout main >> "%LOG_FILE%" 2>&1
if errorlevel 1 goto :fail

git pull --ff-only origin main >> "%LOG_FILE%" 2>&1
if errorlevel 1 goto :fail

REM Do not begin a scheduled publish over human-edited tracked files.
git diff --quiet
if errorlevel 1 (
  echo [ERROR] Unstaged tracked changes exist before refresh. Refusing to continue.
  echo [ERROR] Unstaged tracked changes exist before refresh. Refusing to continue. >> "%LOG_FILE%"
  git status --short >> "%LOG_FILE%" 2>&1
  goto :fail
)

git diff --cached --quiet
if errorlevel 1 (
  echo [ERROR] Staged changes exist before refresh. Refusing to continue.
  echo [ERROR] Staged changes exist before refresh. Refusing to continue. >> "%LOG_FILE%"
  git status --short >> "%LOG_FILE%" 2>&1
  goto :fail
)

echo.
echo [2/11] Running Fix 26 dashboard refresh...
echo [2/11] Running Fix 26 dashboard refresh... >> "%LOG_FILE%"

call refresh_fix26_dashboard_all.bat >> "%LOG_FILE%" 2>&1
if errorlevel 1 goto :fail

echo.
echo [3/11] Rebuilding SETA daily context...
echo [3/11] Rebuilding SETA daily context... >> "%LOG_FILE%"

"%PYTHON_EXE%" scripts\build_seta_daily_context.py >> "%LOG_FILE%" 2>&1
if errorlevel 1 goto :fail

echo.
echo [4/11] Running SETA content pipeline...
echo [4/11] Running SETA content pipeline... >> "%LOG_FILE%"

"%PYTHON_EXE%" scripts\run_seta_content_pipeline.py >> "%LOG_FILE%" 2>&1
if errorlevel 1 goto :fail

echo.
echo [5/11] Enforcing public content safety gates...
echo [5/11] Enforcing public content safety gates... >> "%LOG_FILE%"

"%PYTHON_EXE%" -c "import json,sys; p='public_content/seta_website_snippets_latest.json'; d=json.load(open(p,encoding='utf-8')); print('date=',d.get('date')); print('published_at_utc=',d.get('published_at_utc')); print('public_safe=',d.get('public_safe')); print('posting_performed=',d.get('posting_performed')); print('snippets=',len(d.get('snippets') or [])); ok=(d.get('public_safe') is True and d.get('posting_performed') is False and len(d.get('snippets') or [])>0); sys.exit(0 if ok else 1)" >> "%LOG_FILE%" 2>&1
if errorlevel 1 (
  echo [ERROR] Public content safety gate failed.
  echo [ERROR] Public content safety gate failed. >> "%LOG_FILE%"
  goto :fail
)

echo.
echo [6/11] Running local smoke gates...
echo [6/11] Running local smoke gates... >> "%LOG_FILE%"

"%PYTHON_EXE%" scripts\smoke_fix26_dashboard.py >> "%LOG_FILE%" 2>&1
if errorlevel 1 goto :fail

"%PYTHON_EXE%" scripts\smoke_seta_public_context_cards_v2.py >> "%LOG_FILE%" 2>&1
if errorlevel 1 goto :fail

"%PYTHON_EXE%" scripts\smoke_seta_public_website_content.py >> "%LOG_FILE%" 2>&1
if errorlevel 1 goto :fail

"%PYTHON_EXE%" scripts\smoke_seta_macd_visual_polish_v3.py >> "%LOG_FILE%" 2>&1
if errorlevel 1 goto :fail

git diff --check >> "%LOG_FILE%" 2>&1
if errorlevel 1 goto :fail

echo.
echo [7/11] Running git status before staging...
echo [7/11] Running git status before staging... >> "%LOG_FILE%"

git status --short >> "%LOG_FILE%" 2>&1

echo.
echo [8/11] Staging generated website-facing files only...
echo [8/11] Staging generated website-facing files only... >> "%LOG_FILE%"

REM Intentionally do not stage runner scripts here. Script changes should be reviewed separately.
git add -- fix26_chart_store_public.json
git add -- fix26_chart_store_member.json
git add -- fix26_screener_store.json
git add -- public_content
git add -- reply_agent\daily_context

git status --short >> "%LOG_FILE%" 2>&1

echo.
echo [9/11] Checking staged diff hygiene...
echo [9/11] Checking staged diff hygiene... >> "%LOG_FILE%"

git diff --cached --check >> "%LOG_FILE%" 2>&1
if errorlevel 1 goto :fail

echo.
echo [10/11] Committing and pushing if changes exist...
echo [10/11] Committing and pushing if changes exist... >> "%LOG_FILE%"

git diff --cached --quiet
if errorlevel 1 (
  git commit -m "%COMMIT_MESSAGE%" >> "%LOG_FILE%" 2>&1
  if errorlevel 1 goto :fail

  git push origin HEAD:main >> "%LOG_FILE%" 2>&1
  if errorlevel 1 goto :fail
) else (
  echo No staged changes to commit.
  echo No staged changes to commit. >> "%LOG_FILE%"
)

echo.
echo [11/11] Final verification...
echo [11/11] Final verification... >> "%LOG_FILE%"

git rev-parse HEAD >> "%LOG_FILE%" 2>&1
git ls-remote origin refs/heads/main >> "%LOG_FILE%" 2>&1
git status --short >> "%LOG_FILE%" 2>&1

if "%RUN_LIVE_SMOKE%"=="1" (
  echo.
  echo [optional] Running live GitHub Pages health check...
  echo [optional] Running live GitHub Pages health check... >> "%LOG_FILE%"
  "%PYTHON_EXE%" scripts\smoke_github_pages_live.py >> "%LOG_FILE%" 2>&1
  if errorlevel 1 goto :fail
) else (
  echo Live GitHub Pages health check skipped. Set RUN_LIVE_SMOKE=1 to enable it.
  echo Live GitHub Pages health check skipped. Set RUN_LIVE_SMOKE=1 to enable it. >> "%LOG_FILE%"
)

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
