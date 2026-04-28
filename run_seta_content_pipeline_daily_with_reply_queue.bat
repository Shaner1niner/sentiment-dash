@echo off
setlocal EnableExtensions

cd /d C:\Users\shane\sentiment-dash

set "PYTHON_EXE=C:\Users\shane\miniconda3\envs\seta_auto\python.exe"
if not exist "%PYTHON_EXE%" set "PYTHON_EXE=C:\Users\shane\miniconda3\python.exe"

echo ============================================================
echo SETA Content Pipeline - One Click Runner + Reply Queue
echo ============================================================
echo Repo: %CD%
echo Python: %PYTHON_EXE%
echo.

"%PYTHON_EXE%" scripts\run_seta_content_pipeline.py --include-reply-queue
set "EXITCODE=%ERRORLEVEL%"

echo.
echo ============================================================
if not "%EXITCODE%"=="0" goto failed

echo SETA content pipeline completed successfully.
echo Opening latest run report...
if exist "reply_agent\pipeline_runs\seta_content_pipeline_run_latest.md" start "" notepad "reply_agent\pipeline_runs\seta_content_pipeline_run_latest.md"
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
