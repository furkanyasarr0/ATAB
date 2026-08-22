@echo off
title ATAB Auto-Updater
cd /d "%~dp0"
cls

echo =======================================================
echo              Updating ATAB Extension...
echo =======================================================
echo.

:: Refresh registry path
reg add "HKCU\Software\Classes\atab-update\shell\open\command" /ve /d "\"%~dp0update.bat\"" /f >nul 2>&1

:: Check if git repository exists
if exist ".git" (
    where git >nul 2>&1
    if %ERRORLEVEL% EQU 0 (
        echo [1/2] Syncing latest changes from GitHub...
        git fetch origin main
        git reset --hard origin/main
        goto FINISH
    )
)

:: Download and extract latest package from GitHub
echo [1/2] Downloading latest version from GitHub...
powershell -NoProfile -Command "[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; $tempZip = Join-Path $env:TEMP 'atab_update.zip'; $tempDir = Join-Path $env:TEMP 'atab_extract'; Invoke-WebRequest -Uri 'https://github.com/furkanyasarr0/ATAB/archive/refs/heads/main.zip' -OutFile $tempZip; if (Test-Path $tempDir) { Remove-Item $tempDir -Recurse -Force }; Expand-Archive -Path $tempZip -DestinationPath $tempDir; $source = Join-Path $tempDir 'ATAB-main'; Copy-Item -Path \"$source\*\" -Destination '%~dp0' -Recurse -Force; Remove-Item $tempZip -Force; Remove-Item $tempDir -Recurse -Force"

:FINISH
echo.
echo =======================================================
echo    [SUCCESS] ATAB Successfully Updated!
echo =======================================================
echo.
echo Opening a new tab will now load the latest version.
echo.
echo This window will close in 3 seconds...
ping 127.0.0.1 -n 4 >nul
exit
