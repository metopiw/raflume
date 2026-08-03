@echo off
setlocal
cd /d "%~dp0"
call npm run typecheck
if errorlevel 1 goto :error
call npm test
if errorlevel 1 goto :error
call npm run build
if errorlevel 1 goto :error
echo.
echo Kontroller tamamlandi. Uygulama build edildi.
pause
exit /b 0

:error
echo.
echo Build basarisiz. Yukaridaki hata kaydini kontrol et.
pause
exit /b 1
