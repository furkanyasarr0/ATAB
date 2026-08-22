@echo off
title ATAB Guncelleyici
cd /d "%~dp0"
cls

echo =======================================================
echo          ATAB Eklentisi Guncelleniyor...
echo =======================================================
echo.

:: Kayit defteri yolunu tazele
reg add "HKCU\Software\Classes\atab-update\shell\open\command" /ve /d "\"%~dp0guncelle.bat\"" /f >nul 2>&1

:: Git reposu kontrolu
if exist ".git" (
    where git >nul 2>&1
    if %ERRORLEVEL% EQU 0 (
        echo [1/2] GitHub uzerinden son guncellemeler cekiliyor...
        git pull origin main
        goto FINISH
    )
)

:: Git yoksa PowerShell ile son surumu indirip guncelle
echo [1/2] GitHub'dan en guncel surum paketi indiriliyor...
powershell -NoProfile -Command "[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; $tempZip = Join-Path $env:TEMP 'atab_update.zip'; $tempDir = Join-Path $env:TEMP 'atab_extract'; Invoke-WebRequest -Uri 'https://github.com/furkanyasarr0/ATAB/archive/refs/heads/main.zip' -OutFile $tempZip; if (Test-Path $tempDir) { Remove-Item $tempDir -Recurse -Force }; Expand-Archive -Path $tempZip -DestinationPath $tempDir; $source = Join-Path $tempDir 'ATAB-main'; Copy-Item -Path \"$source\*\" -Destination '%~dp0' -Recurse -Force; Remove-Item $tempZip -Force; Remove-Item $tempDir -Recurse -Force"

:FINISH
echo.
echo =======================================================
echo    [BASARILI] ATAB En Son Surume Guncellendi!
echo =======================================================
echo.
echo Tarayicinizda yeni bir sekme actiginizda guncel surum aktif olacaktir.
echo.
echo Bu pencere 3 saniye icinde kapanacaktir...
ping 127.0.0.1 -n 4 >nul
exit
