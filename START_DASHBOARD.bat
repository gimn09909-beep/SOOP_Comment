@echo off
title SOOP Rank Analytics - Professional Dashboard
echo ======================================================
echo    SOOP Rank Analytics Engine is Starting...
echo ======================================================
echo.

:: 1. Backend Server Check & Run
echo [1/3] Launching Backend Server (Port 5000)...
start /b cmd /c "node backend/index.js"

:: 2. Frontend Development Server Check & Run
echo [2/3] Launching Frontend Interface (Port 5173)...
start /b cmd /c "npm run dev --prefix frontend"

:: 3. Wait and Open Browser
echo [3/3] Preparing your workspace...
timeout.exe /t 5 /nobreak > nul
echo.
echo ======================================================
echo    SUCCESS: Dashboard is now active!
echo    URL: http://localhost:5173
echo ======================================================
echo.

:: Open default browser
start http://localhost:5173

echo Press any key to stop all servers and exit.
pause > nul

:: Shutdown processes on exit
echo Cleaning up...
taskkill /f /im node.exe > nul 2>&1
exit
