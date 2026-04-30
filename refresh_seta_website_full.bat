@echo off
setlocal enabledelayedexpansion

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
echo ============================================================ >> "%LOG_FILE%"

set "NO_PAUSE=1"
cd /d "%WEBSITE_REPO%" >> "%LOG_FILE%" 2>&1
if errorlevel 1 goto :fail

echo [0/6] Checking repo branch and pulling latest main...
echo [0/6] Checking repo branch and pulling latest main... >> "%LOG_FILE%"

git fetch origin >> "%LOG_FILE%" 2>&1
if errorlevel 1 goto :fail

git checkout main >> "%LOG_FILE%" 2>&1
if errorlevel 1 goto :fail

git pull origin main >> "%LOG_FILE%" 2>&1
if errorlevel 1 goto :fail

echo [1/6] Running dashboard refresh. This may take several minutes...
echo [1/6] Running dashboard refresh... >> "%LOG_FILE%"

call refresh_fix26_dashboard_all.bat >> "%LOG_FILE%" 2>&1
if errorlevel 1 goto :fail

echo [2/6] Rebuilding SETA daily context...
echo [2/6] Rebuilding SETA daily context... >> "%LOG_FILE%"

"%PYTHON_EXE%" scripts\build_seta_daily_context.py >> "%LOG_FILE%" 2>&1
if errorlevel 1 goto :fail

echo [3/6] Running SETA content pipeline...
echo [3/6] Running SETA content pipeline... >> "%LOG_FILE%"

"%PYTHON_EXE%" scripts\run_seta_content_pipeline.py >> "%LOG_FILE%" 2>&1
if errorlevel 1 goto :fail

echo [4/6] Verifying public content date...
echo [4/6] Verifying public content date... >> "%LOG_FILE%"

"%PYTHON_EXE%" -c "import json; d=json.load(open('public_content/seta_website_snippets_latest.json',encoding='utf-8')); print('date=',d.get('date')); print('published_at_utc=',d.get('published_at_utc'))" >> "%LOG_FILE%" 2>&1
if errorlevel 1 goto :fail

echo [5/6] Staging website files...
echo [5/6] Staging website files... >> "%LOG_FILE%"

git add fix26_chart_store_public.json
git add fix26_chart_store_member.json
git add fix26_screener_store.json
git add public_content
git add reply_agent\daily_context
git add refresh_seta_website_full.bat

git status --short >> "%LOG_FILE%" 2>&1

echo [6/6] Committing and pushing if changes exist...
echo [6/6] Committing and pushing if changes exist... >> "%LOG_FILE%"

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

echo ============================================================
echo SETA full website refresh completed successfully %DATE% %TIME%
echo Log file: %LOG_FILE%
echo ============================================================

echo ============================================================ >> "%LOG_FILE%"
echo SETA full website refresh completed successfully %DATE% %TIME% >> "%LOG_FILE%"
echo ============================================================ >> "%LOG_FILE%"

pause
exit /b 0

:fail
echo ============================================================
echo SETA full website refresh FAILED %DATE% %TIME%
echo See log: %LOG_FILE%
echo ============================================================

echo ============================================================ >> "%LOG_FILE%"
echo SETA full website refresh FAILED %DATE% %TIME% >> "%LOG_FILE%"
echo See log: %LOG_FILE% >> "%LOG_FILE%"
echo ============================================================ >> "%LOG_FILE%"

pause
exit /b 1