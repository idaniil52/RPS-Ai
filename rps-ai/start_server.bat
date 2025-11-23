@echo off
echo Starting local server...

REM Start a simple Python HTTP server on port 8000
python -m http.server 8000

REM Wait a second for the server to start
timeout /t 1 /nobreak >nul

REM Auto-open Chrome pointing to your index.html
start chrome http://localhost:8000/index.html

pause
