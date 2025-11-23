@echo off
echo Starting local server...

REM Start Python HTTP server in background
start /B python -m http.server 8000

REM Wait a second for the server to boot
timeout /t 2 >nul

REM Auto-open Chrome
start chrome http://localhost:8000/index.html

echo Server running. Press CTRL+C to stop.
pause
