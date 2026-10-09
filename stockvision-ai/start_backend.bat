@echo off
echo ========================================================
echo Starting StockVision AI Backend (FastAPI on Port 8000)...
echo ========================================================
cd /d "%~dp0\backend"
python -m uvicorn app:app --host 127.0.0.1 --port 8000 --reload
pause
