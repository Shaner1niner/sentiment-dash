@echo off
setlocal EnableExtensions EnableDelayedExpansion

REM SETA One-Click Content Pipeline Runner v1 + Reply Queue
REM Runs the draft-only SETA content pipeline and optional reply draft queue.
REM No posting. No API calls by this runner.

cd /d C:\Users\shane\sentiment-dash

echo ============================================================
echo SETA Content Pipeline - One Click Runner + Reply Queue
echo ============================================================
echo Repo: %CD%
echo.

python scripts\run_seta_content_pipeline.py --include-reply-queue
set EXITCODE=%ERRORLEVEL%

echo.
echo ============================================================
if "%EXITCODE%"=="0" (
    echo SETA content pipeline completed successfully.
    echo Opening latest run report...
    if exist "reply_agent\pipeline_runs\seta_content_pipeline_run_latest.md" (
        start "" notepad "reply_agent\pipeline_runs\seta_content_pipeline_run_latest.md"
    ) else (
        echo Latest run report not found.
    )
) else (
    echo SETA content pipeline FAILED with exit code %EXITCODE%.
    if exist "reply_agent\pipeline_runs\seta_content_pipeline_run_latest.md" (
        start "" notepad "reply_agent\pipeline_runs\seta_content_pipeline_run_latest.md"
    )
)
echo ============================================================
echo.

pause
exit /b %EXITCODE%
