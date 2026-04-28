@echo off
setlocal EnableExtensions EnableDelayedExpansion

REM SETA One-Click Content Pipeline Runner v1
REM Runs the draft-only SETA content pipeline and opens the latest run report.
REM No posting. No API calls by this runner.

cd /d C:\Users\shane\sentiment-dash

echo ============================================================
echo SETA Content Pipeline - One Click Runner
echo ============================================================
echo Repo: %CD%
echo.

REM Prefer the active Python environment. If launched outside conda, python should still resolve.
python scripts\run_seta_content_pipeline.py
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

    echo.
    echo Optional review files:
    echo   reply_agent\website_snippets\seta_website_snippets_latest.md
    echo   reply_agent\blog_outlines\seta_blog_outline_latest.md
    echo   reply_agent\blog_drafts\seta_blog_draft_latest.md
    echo   reply_agent\social_calendar\seta_social_calendar_latest.md
) else (
    echo SETA content pipeline FAILED with exit code %EXITCODE%.
    echo Opening latest run report if available...
    if exist "reply_agent\pipeline_runs\seta_content_pipeline_run_latest.md" (
        start "" notepad "reply_agent\pipeline_runs\seta_content_pipeline_run_latest.md"
    )
)
echo ============================================================
echo.

pause
exit /b %EXITCODE%
