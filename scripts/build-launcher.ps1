$ErrorActionPreference = 'Stop'

$projectRoot = Split-Path -Parent $PSScriptRoot
$sourcePath = Join-Path $PSScriptRoot 'RaflumeLauncher.cs'
$desktopHostSourcePath = Join-Path $PSScriptRoot 'RaflumeDesktopHost.cs'
$iconPath = Join-Path $projectRoot 'assets\app-icon.ico'
$outputPath = Join-Path $projectRoot 'Raflume.exe'
$desktopHostOutputPath = Join-Path $projectRoot 'assets\RaflumeDesktopHost.exe'
$windowsDirectory = [Environment]::GetEnvironmentVariable('WINDIR')
$compilerPath = Join-Path $windowsDirectory 'Microsoft.NET\Framework64\v4.0.30319\csc.exe'

foreach ($requiredPath in @($sourcePath, $desktopHostSourcePath, $iconPath, $compilerPath)) {
  if (-not (Test-Path -LiteralPath $requiredPath -PathType Leaf)) {
    throw "Gerekli dosya bulunamadı: $requiredPath"
  }
}

& $compilerPath `
  /nologo `
  /target:winexe `
  /optimize+ `
  "/win32icon:$iconPath" `
  "/out:$outputPath" `
  /reference:System.dll `
  /reference:System.Windows.Forms.dll `
  $sourcePath

if ($LASTEXITCODE -ne 0 -or -not (Test-Path -LiteralPath $outputPath -PathType Leaf)) {
  throw 'Raflume launcher derlenemedi.'
}

& $compilerPath `
  /nologo `
  /target:exe `
  /optimize+ `
  "/out:$desktopHostOutputPath" `
  /reference:System.dll `
  $desktopHostSourcePath

if ($LASTEXITCODE -ne 0 -or -not (Test-Path -LiteralPath $desktopHostOutputPath -PathType Leaf)) {
  throw 'Raflume masaüstü yardımcısı derlenemedi.'
}

$launcher = Get-Item -LiteralPath $outputPath
Write-Output "Launcher hazır: $($launcher.FullName) ($($launcher.Length) bayt)"
$desktopHost = Get-Item -LiteralPath $desktopHostOutputPath
Write-Output "Masaüstü yardımcısı hazır: $($desktopHost.FullName) ($($desktopHost.Length) bayt)"
