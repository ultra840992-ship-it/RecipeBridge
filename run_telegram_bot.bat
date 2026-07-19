@echo off
chcp 65001 > nul
set PYTHONUTF8=1
title RecipeBridge Telegram Bot v2
echo ============================================================
echo   RecipeBridge Telegram Bot v2
echo   @RecipeBridgeBot  ChatID: 7913005798
echo ============================================================
python -X utf8 "05_Meta\scripts\telegram_bridge.py"
echo.
echo [Bot stopped. Close this window or press any key to exit]
pause
