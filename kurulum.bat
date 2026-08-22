@echo off
title ATAB Kurulum
cls
echo =======================================================
echo          ATAB Tek Tikla Guncelleme Kurulumu
echo =======================================================
echo.
echo Windows ozel protokol kaydi yapiliyor...

set SCRIPT_DIR=%~dp0
set BATCH_FILE=%SCRIPT_DIR%guncelle.bat

reg add "HKCU\Software\Classes\atab-update" /ve /d "URL:ATAB Updater Protocol" /f >nul
reg add "HKCU\Software\Classes\atab-update" /v "URL Protocol" /d "" /f >nul
reg add "HKCU\Software\Classes\atab-update\shell\open\command" /ve /d "\"%BATCH_FILE%\"" /f >nul

echo.
echo [BASARILI] Kurulum tamamlandi!
echo Artik eklentideki "Tek Tikla Guncelle" butonuna basildiginda
echo guncelleyici otomatik olarak acilacaktir.
echo.
echo Bu pencere 3 saniye icinde kapanacaktir...
ping 127.0.0.1 -n 4 >nul
exit
