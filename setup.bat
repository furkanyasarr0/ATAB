@echo off
title ATAB Setup
cls
echo =======================================================
echo          ATAB One-Click Auto-Updater Setup
echo =======================================================
echo.
echo Registering custom URL protocol for Windows...

set SCRIPT_DIR=%~dp0
set BATCH_FILE=%SCRIPT_DIR%update.bat

reg add "HKCU\Software\Classes\atab-update" /ve /d "URL:ATAB Updater Protocol" /f >nul
reg add "HKCU\Software\Classes\atab-update" /v "URL Protocol" /d "" /f >nul
reg add "HKCU\Software\Classes\atab-update\shell\open\command" /ve /d "\"%BATCH_FILE%\"" /f >nul

echo.
echo [SUCCESS] Setup completed successfully!
echo Now clicking "Update Now" inside the extension will automatically
echo launch the updater.
echo.
echo This window will close in 3 seconds...
ping 127.0.0.1 -n 4 >nul
exit
