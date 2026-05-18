@echo off
setlocal EnableExtensions EnableDelayedExpansion

REM ============================================================
REM SETA DAILY ALL RUNNER - DATA / CONTENT / BOT FEED / AUTO PUBLISH
REM
REM Purpose:
REM   1) Refresh Fix26 dashboard/data/screener exports
REM   2) Rebuild SETA daily context and content pipeline outputs
REM   3) Compile and dual-save seta_hot_memory_bot_feed.json
REM   4) Stage website-facing generated artifacts
REM   5) Commit and push to origin/main when changes exist
REM
REM Recommended Task Scheduler usage:
REM   Program/script: cmd.exe
REM   Arguments: /c ""C:\Users\shane\sentiment-dash\run_seta_daily_all.bat""
REM   Start in: C:\Users\shane\sentiment-dash
REM
REM Interactive mode:
REM   run_seta_daily_all.bat interactive
REM ============================================================

chcp 65001 >nul
set "PYTHONUTF8=1"
set "PYTHONIOENCODING=utf-8"

set "NO_PAUSE=1"
set "OPEN_REPORT=0"
if /I "%~1"=="interactive" (
    set "NO_PAUSE=0"
    set "OPEN_REPORT=1"
)

set "WEBSITE_REPO=C:\Users\shane\sentiment-dash"
set "TABLEAU_AUTOSYNC=G:\My Drive\Tableau_AutoSync"
set "LOCAL_BACKUP=C:\Users\shane\Tableau_LocalBackups"
set "BOT_COMPILER=C:\Users\shane\snt_pipeline\run_bot_compiler.py"
set "LOG_DIR=%WEBSITE_REPO%\logs"
set "FAIL_MARKER=%LOG_DIR%\seta_daily_all_LAST_FAILED.txt"
set "SUCCESS_MARKER=%LOG_DIR%\seta_daily_all_LAST_SUCCESS.txt"

REM Auto-publish is now the default operating model for the daily task.
if "%AUTO_COMMIT%"=="" set "AUTO_COMMIT=1"
if "%AUTO_PUSH%"=="" set "AUTO_PUSH=1"
if "%COMMIT_MESSAGE%"=="" set "COMMIT_MESSAGE=Automated SETA daily refresh"
if "%PUBLISH_BRANCH%"=="" set "PUBLISH_BRANCH=automation/seta-daily-publish"

REM Optional cleanup mode. Normally not needed now that AUTO_COMMIT/AUTO_PUSH are enabled.
if "%CLEAN_REPO_AFTER_RUN%"=="" set "CLEAN_REPO_AFTER_RUN=0"

if not exist "%LOG_DIR%" mkdir "%LOG_DIR%" >nul 2>nul
if exist "%FAIL_MARKER%" del "%FAIL_MARKER%" >nul 2>nul

cd /d "%WEBSITE_REPO%"
if errorlevel 1 (
    set "EXITCODE=2"
    echo ERROR: Could not cd to %WEBSITE_REPO%
    goto failed
)

if "%PYTHON_EXE%"=="" set "PYTHON_EXE=C:\Users\shane\miniconda3\envs\seta_auto\python.exe"
if not exist "%PYTHON_EXE%" set "PYTHON_EXE=C:\Users\shane\miniconda3\python.exe"
if not exist "%PYTHON_EXE%" set "PYTHON_EXE=C:\Users\shane\anaconda3\python.exe"

if not exist "%PYTHON_EXE%" (
    set "EXITCODE=2"
    echo ERROR: Python executable not found.
    echo Checked:
    echo   C:\Users\shane\miniconda3\envs\seta_auto\python.exe
    echo   C:\Users\shane\miniconda3\python.exe
    echo   C:\Users\shane\anaconda3\python.exe
    goto failed
)

where git >nul 2>nul
if errorlevel 1 (
    set "EXITCODE=2"
    echo ERROR: Git is not available in PATH.
    goto failed
)

if not exist "%TABLEAU_AUTOSYNC%" (
    set "EXITCODE=2"
    echo ERROR: Tableau AutoSync folder is not available:
    echo   %TABLEAU_AUTOSYNC%
    echo Start Google Drive for Desktop and confirm G: is mounted.
    goto failed
)

echo ============================================================
echo SETA DAILY ALL RUNNER
echo ============================================================
echo Repo: %CD%
echo Python: %PYTHON_EXE%
echo Tableau AutoSync: %TABLEAU_AUTOSYNC%
echo Bot compiler: %BOT_COMPILER%
echo Started: %DATE% %TIME%
echo NO_PAUSE=%NO_PAUSE% OPEN_REPORT=%OPEN_REPORT%
echo AUTO_COMMIT=%AUTO_COMMIT% AUTO_PUSH=%AUTO_PUSH% CLEAN_REPO_AFTER_RUN=%CLEAN_REPO_AFTER_RUN%
echo ============================================================
echo.

REM ------------------------------------------------------------
REM STEP 0 - Git preflight and automation branch setup
REM ------------------------------------------------------------
echo ============================================================
echo STEP 0 - Git preflight and automation branch setup
echo ============================================================

git fetch --prune origin
set "EXITCODE=%ERRORLEVEL%"
if errorlevel 1 goto failed

for /f "delims=" %%B in ('git branch --show-current 2^>nul') do set "CURRENT_BRANCH=%%B"
echo Current branch before setup: !CURRENT_BRANCH!
echo Publish branch: %PUBLISH_BRANCH%

REM Local commits on main are blocked by repo policy. For AUTO_COMMIT runs,
REM switch to a dedicated automation branch, then push that branch HEAD to origin/main.
if "%AUTO_COMMIT%"=="1" (
    if /I "!CURRENT_BRANCH!"=="main" (
        echo Commit policy blocks local commits on main.
        echo Switching to automation branch: %PUBLISH_BRANCH%
        if /I "%CURRENT_BRANCH%"=="%PUBLISH_BRANCH%" (
    echo Already on publish branch: %PUBLISH_BRANCH%
) else (
    REM The publish branch is disposable. Force it to origin/main before switching
    REM so stale local automation commits cannot block scheduled refreshes.
    git branch -f %PUBLISH_BRANCH% origin/main
    if errorlevel 1 (
        echo ERROR: Could not point %PUBLISH_BRANCH% at origin/main.
        set "EXITCODE=128"
        goto failed
    )
    git switch %PUBLISH_BRANCH%
    if errorlevel 1 (
        echo ERROR: Could not switch to %PUBLISH_BRANCH%.
        set "EXITCODE=128"
        goto failed
    )
)
        set "EXITCODE=!ERRORLEVEL!"
        if errorlevel 1 goto failed
    )

    for /f "delims=" %%B in ('git branch --show-current 2^>nul') do set "CURRENT_BRANCH=%%B"
    echo Current branch after setup: !CURRENT_BRANCH!

    if /I not "!CURRENT_BRANCH!"=="main" (
        echo Syncing !CURRENT_BRANCH! with origin/main using fast-forward only...
        git reset --hard origin/main
        set "EXITCODE=!ERRORLEVEL!"
        if errorlevel 1 (
            echo ERROR: Could not fast-forward !CURRENT_BRANCH! to origin/main.
            echo Check git status and branch permissions, then rerun.
            goto failed
        )
    )
) else (
    echo AUTO_COMMIT=0, staying on current branch.
)

echo Current repo status before refresh:
git status --short

REM ------------------------------------------------------------
REM STEP 1 - Refresh dashboard/data/screener stores
REM ------------------------------------------------------------
echo.
echo ============================================================
echo STEP 1 - Refresh Fix26 dashboard/data/screener stores
echo ============================================================

if not exist "refresh_fix26_dashboard_all.bat" (
    echo ERROR: refresh_fix26_dashboard_all.bat not found.
    set "EXITCODE=2"
    goto failed
)

call "refresh_fix26_dashboard_all.bat"
set "EXITCODE=%ERRORLEVEL%"
if errorlevel 1 goto failed

REM ------------------------------------------------------------
REM STEP 2 - Rebuild daily context and SETA content pipeline
REM ------------------------------------------------------------
echo.
echo ============================================================
echo STEP 2 - Rebuild SETA daily context
echo ============================================================

if not exist "scripts\build_seta_daily_context.py" (
    echo ERROR: scripts\build_seta_daily_context.py not found.
    set "EXITCODE=2"
    goto failed
)

"%PYTHON_EXE%" "scripts\build_seta_daily_context.py"
set "EXITCODE=%ERRORLEVEL%"
if errorlevel 1 goto failed

echo.
echo ============================================================
echo STEP 3 - Run SETA content pipeline
echo ============================================================

if not exist "scripts\run_seta_content_pipeline.py" (
    echo ERROR: scripts\run_seta_content_pipeline.py not found.
    set "EXITCODE=2"
    goto failed
)

"%PYTHON_EXE%" "scripts\run_seta_content_pipeline.py"
set "EXITCODE=%ERRORLEVEL%"
if errorlevel 1 goto failed

echo.
echo Verifying public website content safety flags...
"%PYTHON_EXE%" -c "import json,sys; p=r'public_content\seta_website_snippets_latest.json'; d=json.load(open(p,encoding='utf-8')); print('public date=',d.get('date')); print('published_at_utc=',d.get('published_at_utc')); print('public_safe=',d.get('public_safe')); print('posting_performed=',d.get('posting_performed')); sys.exit(0 if d.get('public_safe') is True and d.get('posting_performed') is False else 1)"
set "EXITCODE=%ERRORLEVEL%"
if errorlevel 1 goto failed

REM ------------------------------------------------------------
REM STEP 4 - Compile and dual-save SETA Hot Memory Bot Feed
REM ------------------------------------------------------------
echo.
echo ============================================================
echo STEP 4 - Compile SETA Hot Memory Bot Feed
echo ============================================================
echo Compiling final JSON with Macro Analyst Takes...

if not exist "%BOT_COMPILER%" (
    echo ERROR: Bot compiler not found:
    echo   %BOT_COMPILER%
    set "EXITCODE=2"
    goto failed
)

"%PYTHON_EXE%" "%BOT_COMPILER%"
set "EXITCODE=%ERRORLEVEL%"
if errorlevel 1 goto failed

if not exist "%TABLEAU_AUTOSYNC%\seta_hot_memory_bot_feed.json" (
    echo ERROR: Expected bot feed was not created:
    echo   %TABLEAU_AUTOSYNC%\seta_hot_memory_bot_feed.json
    set "EXITCODE=3"
    goto failed
)

echo.
echo Bot memory feed updated:
dir "%TABLEAU_AUTOSYNC%\seta_hot_memory_bot_feed.json"

if exist "%LOCAL_BACKUP%\seta_hot_memory_bot_feed.json" (
    echo.
    echo Local backup updated:
    dir "%LOCAL_BACKUP%\seta_hot_memory_bot_feed.json"
) else (
    echo.
    echo WARNING: Local backup copy not found:
    echo   %LOCAL_BACKUP%\seta_hot_memory_bot_feed.json
)

echo.
echo Bot feed sanity check:
"%PYTHON_EXE%" -c "import json; p=r'%TABLEAU_AUTOSYNC%\seta_hot_memory_bot_feed.json'; d=json.load(open(p,encoding='utf-8')); print('assets=',len(d)); print('first=',d[0].get('term') if d else None)"
set "EXITCODE=%ERRORLEVEL%"
if errorlevel 1 goto failed

REM ------------------------------------------------------------
REM STEP 5 - Stage, commit, and push generated website-facing files
REM ------------------------------------------------------------
echo.
echo ============================================================
echo STEP 5 - Stage, commit, and push website-facing files
echo ============================================================

REM Clear any staging created by nested scripts. Then stage only approved generated artifacts.
git restore --staged . >nul 2>nul

git add -- fix26_chart_store_public.json
git add -- fix26_chart_store_member.json
git add -- fix26_screener_store.json
git add -- fix26_structure_score_history.json
git add -- fix26_chart_store_public_index.json
git add -- fix26_chart_store_member_index.json
git add -- fix26_chart_store_assets\public
git add -- fix26_chart_store_assets\member
git add -- generated_briefings_reviewed.json
git add -- generated_briefings_reviewed_v2.json
git add -- public_content

set "EXITCODE=%ERRORLEVEL%"
if errorlevel 1 goto failed

echo Staged repo status:
git status --short

git diff --cached --check
set "EXITCODE=%ERRORLEVEL%"
if errorlevel 1 goto failed

git diff --cached --quiet
if errorlevel 1 (
    if "%AUTO_COMMIT%"=="1" (
        echo Committing staged generated changes...
        git -c gc.auto=0 commit -m "%COMMIT_MESSAGE%"
        set "EXITCODE=%ERRORLEVEL%"
        if errorlevel 1 goto failed

        if "%AUTO_PUSH%"=="1" (
            echo Pushing HEAD to origin/main...
            git push origin HEAD:main
            set "EXITCODE=%ERRORLEVEL%"
            if errorlevel 1 goto failed
        ) else (
            echo AUTO_PUSH=0, commit created locally but not pushed.
        )
    ) else (
        echo AUTO_COMMIT=0, leaving generated changes staged for manual commit.
    )
) else (
    echo No staged generated repo changes to commit.
)

if exist cloud_sync_staging rmdir /s /q cloud_sync_staging

if "%CLEAN_REPO_AFTER_RUN%"=="1" (
    echo.
    echo CLEAN_REPO_AFTER_RUN=1: cleaning any remaining generated working-tree changes...
    git restore --staged . >nul 2>nul
    git restore -- fix26_chart_store_public.json fix26_chart_store_member.json fix26_screener_store.json >nul 2>nul
    git restore -- fix26_structure_score_history.json >nul 2>nul
    git restore -- fix26_chart_store_public_index.json fix26_chart_store_member_index.json >nul 2>nul
    git restore -- generated_briefings_reviewed.json generated_briefings_reviewed_v2.json >nul 2>nul
    git restore -- public_content >nul 2>nul
    git restore -- fix26_chart_store_assets\public fix26_chart_store_assets\member >nul 2>nul
)

REM ------------------------------------------------------------
REM Done
REM ------------------------------------------------------------
echo.
echo ============================================================
echo SETA DAILY ALL RUNNER completed successfully.
echo Finished: %DATE% %TIME%
echo ============================================================
echo.
echo Latest review files:
echo   reply_agent\pipeline_runs\seta_content_pipeline_run_latest.md
echo   reply_agent\website_snippets\seta_website_snippets_latest.md
echo   reply_agent\blog_drafts\seta_blog_draft_latest.md
echo   reply_agent\social_calendar\seta_social_calendar_latest.md
echo.
echo Latest bot feed:
echo   %TABLEAU_AUTOSYNC%\seta_hot_memory_bot_feed.json
echo.
echo Final git status:
git status --short

call :write_success_marker

if "%OPEN_REPORT%"=="1" (
    if exist "reply_agent\pipeline_runs\seta_content_pipeline_run_latest.md" start "" notepad "reply_agent\pipeline_runs\seta_content_pipeline_run_latest.md"
)

if not "%NO_PAUSE%"=="1" pause
exit /b 0

:failed
if "%EXITCODE%"=="" set "EXITCODE=1"
echo.
echo ============================================================
echo SETA DAILY ALL RUNNER FAILED.
echo Exit code: %EXITCODE%
echo Failed at: %DATE% %TIME%
echo Failure marker: %FAIL_MARKER%
echo ============================================================
echo.
call :write_failure_marker
if "%OPEN_REPORT%"=="1" (
    if exist "reply_agent\pipeline_runs\seta_content_pipeline_run_latest.md" start "" notepad "reply_agent\pipeline_runs\seta_content_pipeline_run_latest.md"
)
if not "%NO_PAUSE%"=="1" pause
exit /b %EXITCODE%

:write_success_marker
(
  echo SETA DAILY ALL RUNNER SUCCESS
  echo Timestamp: %DATE% %TIME%
  echo Repo: %CD%
  echo Branch:
  git branch --show-current
  echo.
  echo HEAD:
  git rev-parse HEAD
  echo.
  echo origin/main:
  git ls-remote origin refs/heads/main
  echo.
  echo Bot feed:
  dir "%TABLEAU_AUTOSYNC%\seta_hot_memory_bot_feed.json"
  echo.
  echo Git status:
  git status --short
) > "%SUCCESS_MARKER%" 2>&1
exit /b 0

:write_failure_marker
(
  echo SETA DAILY ALL RUNNER FAILED
  echo Timestamp: %DATE% %TIME%
  echo Exit code: %EXITCODE%
  echo Repo: %CD%
  echo Branch:
  git branch --show-current
  echo.
  echo HEAD:
  git rev-parse HEAD
  echo.
  echo Git status:
  git status --short
  echo.
  echo Suggested checks:
  echo   1. Confirm Google Drive G: is mounted.
  echo   2. Confirm Python path is valid.
  echo   3. Confirm git status is clean or only generated files changed.
  echo   4. Rerun manually from C:\Users\shane\sentiment-dash.
) > "%FAIL_MARKER%" 2>&1
exit /b 0

