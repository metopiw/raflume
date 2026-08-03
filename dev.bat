@echo off
setlocal
cd /d "%~dp0"
call npm run dev
if errorlevel 1 (
  echo.
  echo Gelistirme modu baslatilamadi.
  pause
  exit /b 1
)
