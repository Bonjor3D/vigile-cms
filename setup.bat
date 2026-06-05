@echo off
title Vigile Setup
cd /d "%~dp0"

echo ============================================
echo   Vigile CMS - Install Dependencies
echo ============================================
echo.

:: Helper: reload PATH from registry
:refresh_path
for /f "tokens=2*" %%a in ('reg query "HKLM\SYSTEM\CurrentControlSet\Control\Session Manager\Environment" /v Path 2^>nul') do if not "%%b"=="" set "SYSTEM_PATH=%%b"
for /f "tokens=2*" %%a in ('reg query "HKCU\Environment" /v Path 2^>nul') do if not "%%b"=="" set "USER_PATH=%%b"
set "PATH=%SYSTEM_PATH%;%USER_PATH%"
exit /b 0

:: --- Node.js ---
echo [1/4] Checking Node.js...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [INFO] Node.js not found, installing via winget...
    winget install --id OpenJS.NodeJS.LTS --silent --accept-package-agreements
    if %errorlevel% neq 0 (
        echo [ERROR] Could not install Node.js
        echo Download manually: https://nodejs.org/ (v22+ LTS)
        pause
        exit /b 1
    )
    call :refresh_path
)
node --version
echo [OK]

:: --- Frontend dependencies ---
echo.
echo [2/4] Installing frontend dependencies...
cd /d "%~dp0frontend"
if %errorlevel% neq 0 (
    echo [ERROR] frontend\ folder not found!
    pause
    exit /b 1
)
call npm install
if %errorlevel% neq 0 (
    echo [ERROR] npm install failed
    pause
    exit /b 1
)
echo [OK]

:: --- .NET SDK ---
echo.
echo [3/4] Checking .NET SDK...
dotnet --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [INFO] .NET SDK not found, installing via winget...
    winget install --id Microsoft.DotNet.SDK.10 --silent --accept-package-agreements 2>nul
    if %errorlevel% neq 0 (
        echo [INFO] .NET 10 not available, trying .NET 9...
        winget install --id Microsoft.DotNet.SDK.9 --silent --accept-package-agreements 2>nul
    )
    call :refresh_path
    dotnet --version >nul 2>&1
    if %errorlevel% neq 0 (
        echo [ERROR] Could not install .NET SDK
        echo Download manually: https://dotnet.microsoft.com/download
        pause
        exit /b 1
    )
)
echo [OK]
dotnet --version

:: --- Backend restore ---
echo.
echo [4/4] Restoring backend packages...
cd /d "%~dp0backend"
if %errorlevel% neq 0 (
    echo [ERROR] backend\ folder not found!
    pause
    exit /b 1
)
call dotnet restore
if %errorlevel% neq 0 (
    echo [ERROR] dotnet restore failed
    pause
    exit /b 1
)
echo [OK]

cd /d "%~dp0"

echo.
echo ============================================
echo  All dependencies installed!
echo ============================================
echo.
echo  Run start.bat to launch the project.
echo.
pause
