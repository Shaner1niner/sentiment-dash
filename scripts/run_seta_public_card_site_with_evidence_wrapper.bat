@echo off
setlocal

set DASH_ROOT=C:\Users\shane\sentiment-dash
set SETA_ENGINE_ROOT=C:\SETA_engine\SETA_engine_git_initialized_for_push\SETA_engine
set PUBLIC_CARD_BAT=C:\Users\shane\Projects\SETA_Prediction_Intelligence_Engine\scripts\run_public_card_site_publish_scheduled.bat
set LOG_DIR=C:\Users\shane\sentiment-dash\logs\evidence_scheduler

if not exist "%LOG_DIR%" mkdir "%LOG_DIR%"

for /f "tokens=1-4 delims=/ " %%a in ("%date%") do set RUN_DATE=%%d%%a%%b
for /f "tokens=1-3 delims=:." %%a in ("%time%") do set RUN_TIME=%%a%%b%%c
set RUN_TIME=%RUN_TIME: =0%

set LOG_FILE=%LOG_DIR%\seta_public_card_site_with_evidence_%RUN_DATE%_%RUN_TIME%.log

echo SETA public-card + evidence wrapper started at %date% %time% > "%LOG_FILE%"
echo dash_root=%DASH_ROOT% >> "%LOG_FILE%"
echo seta_engine_root=%SETA_ENGINE_ROOT% >> "%LOG_FILE%"
echo public_card_bat=%PUBLIC_CARD_BAT% >> "%LOG_FILE%"

powershell.exe -ExecutionPolicy Bypass -File "%DASH_ROOT%\scripts\run_seta_refresh_with_evidence_handoff.ps1" ^
  -DashRoot "%DASH_ROOT%" ^
  -SetaEngineRoot "%SETA_ENGINE_ROOT%" ^
  -RefreshCommand "cmd.exe /c ""%PUBLIC_CARD_BAT%""" ^
  -CommitEvidencePayload ^
  -Push >> "%LOG_FILE%" 2>&1

set EXIT_CODE=%ERRORLEVEL%
echo wrapper_exit_code=%EXIT_CODE% >> "%LOG_FILE%"
echo SETA public-card + evidence wrapper finished at %date% %time% >> "%LOG_FILE%"

exit /b %EXIT_CODE%
