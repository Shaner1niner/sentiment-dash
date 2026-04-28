@echo off
setlocal EnableExtensions

cd /d C:\Users\shane\sentiment-dash

set "PYTHON_EXE=C:\Users\shane\miniconda3\envs\seta_auto\python.exe"
if not exist "%PYTHON_EXE%" set "PYTHON_EXE=C:\Users\shane\miniconda3\python.exe"

echo ============================================================
echo SETA Content Pipeline - One Click Runner
echo ============================================================
echo Repo: %CD%
echo Python: %PYTHON_EXE%
echo.

"%PYTHON_EXE%" scripts\run_seta_content_pipeline.py
set "EXITCODE=%ERRORLEVEL%"

echo.
echo ============================================================
if not "%EXITCODE%"=="0" goto failed

echo SETA content pipeline completed successfully.
echo Opening latest run report...
if exist "reply_agent\pipeline_runs\seta_content_pipeline_run_latest.md" start "" notepad "reply_agent\pipeline_runs\seta_content_pipeline_run_latest.md"

echo.
echo Optional review files:
echo   reply_agent\website_snippets\seta_website_snippets_latest.md
echo   reply_agent\blog_outlines\seta_blog_outline_latest.md
echo   reply_agent\blog_drafts\seta_blog_draft_latest.md
echo   reply_agent\social_calendar\seta_social_calendar_latest.md
goto done

:failed
echo SETA content pipeline FAILED with exit code %EXITCODE%.
echo Opening latest run report if available...
if exist "reply_agent\pipeline_runs\seta_content_pipeline_run_latest.md" start "" notepad "reply_agent\pipeline_runs\seta_content_pipeline_run_latest.md"

:done
echo ============================================================
echo.
pause
exit /b %EXITCODE%
