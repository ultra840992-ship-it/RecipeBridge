@echo off
chcp 65001 > nul
title RecipeBridge Telegram Bot
set PYTHONUTF8=1
echo ============================================================
echo   RecipeBridge Telegram Bot v2 Starting...
echo   Bot: @RecipeBridgeBot
echo   Chat ID: 7913005798
echo ============================================================
echo.
python "%~dp0..\scripts\telegram_bridge.py"
echo.
echo [Bot Stopped]
pause
