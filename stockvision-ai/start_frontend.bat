@echo off
echo ========================================================
echo Starting StockVision AI Frontend (Vite on Port 5173)...
echo ========================================================
cd /d "%~dp0\frontend"
npm run dev -- --host 127.0.0.1 --port 5173
pause
