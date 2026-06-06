@echo off
title Vigile
cd /d "%~dp0"

echo Starting Vigile CMS...
echo.

:: Start backend
echo [Backend] Starting on http://localhost:5000
start "Vigile Backend" cmd /k "cd /d "%~dp0backend" & dotnet run"

:: Wait for backend to initialize
timeout /t 5 /nobreak >nul

:: Start frontend
echo [Frontend] Starting on http://localhost:5173
start "Vigile Frontend" cmd /k "cd /d "%~dp0frontend" & npm run dev"

echo.
echo ============================================
echo   Vigile is running!
echo   Frontend: http://localhost:5173
echo   Backend:  http://localhost:5000
echo ============================================
echo.
echo   Close the console windows to stop.
