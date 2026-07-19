@echo off
title RecipeBridge Live AI Dashboard Launcher
chcp 65001 >nul

echo ====================================================================
echo   RecipeBridge Live AI Dashboard Launcher
echo ====================================================================
echo.
echo [1/2] Starting Live API Server (Port 8000)...
start /B python 05_Meta/scripts/live_server.py

:: Wait for binding (2 seconds)
ping 127.0.0.1 -n 3 >nul

echo.
echo [2/2] Opening Dashboard in Web Browser...
start "" "05_Meta/dashboard/index.html"

echo.
echo ====================================================================
echo   [SUCCESS] Live AI Dashboard is running.
echo   Press any key or close this window to stop the API Server.
echo ====================================================================
echo.
pause
taskkill /F /IM python.exe >nul 2>&1
