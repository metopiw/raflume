@echo off
setlocal
cd /d "%~dp0"

where node >nul 2>nul
if errorlevel 1 (
  echo Node.js bulunamadi. Node.js 20 veya 22 kurulu olmali.
  pause
  exit /b 1
)

if not exist "node_modules\electron\package.json" (
  echo Bagimliliklar bulunamadi, npm install calistiriliyor...
  call npm install
  if errorlevel 1 goto :error
)

if not exist "node_modules\electron\dist\electron.exe" (
  echo Electron Windows calistiricisi indiriliyor...
  node node_modules\electron\install.js
  if errorlevel 1 goto :error
)

if not exist "dist-electron\main\index.js" (
  echo Hazir build bulunamadi, uygulama derleniyor...
  call npm run build
  if errorlevel 1 goto :error
)

call npm run start:built
if errorlevel 1 goto :error
exit /b 0

:error
echo.
echo Uygulama baslatilamadi. Yukaridaki hata kaydini kontrol et.
pause
exit /b 1
