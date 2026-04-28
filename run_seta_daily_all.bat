@echo off
setlocal EnableExtensions

cd /d C:\Users\shane\sentiment-dash

set "PYTHON_EXE=C:\Users\shane\miniconda3\envs\seta_auto\python.exe"
if not exist "%PYTHON_EXE%" set "PYTHON_EXE=C:\Users\shane\miniconda3\python.exe"

echo ============================================================
echo SETA DAILY ALL RUNNER
echo ============================================================
echo Repo: %CD%
echo Python: %PYTHON_EXE%
echo Started: %DATE% %TIME%
echo ============================================================
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

echo.
echo ============================================================
echo STEP 2 - Run SETA content pipeline
echo ============================================================

if not exist "run_seta_content_pipeline_daily.bat" (
    echo ERROR: run_seta_content_pipeline_daily.bat not found.
    set "EXITCODE=2"
    goto failed
)

call "run_seta_content_pipeline_daily.bat"
set "EXITCODE=%ERRORLEVEL%"

if errorlevel 1 goto failed

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

if exist "reply_agent\pipeline_runs\seta_content_pipeline_run_latest.md" start "" notepad "reply_agent\pipeline_runs\seta_content_pipeline_run_latest.md"

pause
exit /b 0

:failed
echo.
echo ============================================================
echo SETA DAILY ALL RUNNER FAILED.
echo Exit code: %EXITCODE%
echo Failed at: %DATE% %TIME%
echo ============================================================
echo.
if exist "reply_agent\pipeline_runs\seta_content_pipeline_run_latest.md" start "" notepad "reply_agent\pipeline_runs\seta_content_pipeline_run_latest.md"
pause
exit /b %EXITCODE%