@echo off
echo ==================================================
echo PRAHARI MISSION CONTROL - STARTUP
echo ==================================================

echo [1] Checking Python dependencies...
pip install -r backend\requirements.txt

echo [2] Starting FastAPI Backend on port 8000...
start cmd /k "title Prahari Backend && cd backend && uvicorn main:app --host 0.0.0.0 --port 8000 --reload"

echo [3] Checking Node dependencies...
cd frontend
if not exist "node_modules" (
    echo Installing frontend dependencies...
    npm install
)

echo [4] Starting Vite Frontend on port 5173...
start cmd /k "title Prahari Frontend && npm run dev"

timeout /t 2 /nobreak >nul
start "" "http://localhost:5173"

echo ==================================================
echo Prahari Mission Control is running!
echo Backend API : http://localhost:8000
echo Frontend UI : http://localhost:5173
echo ==================================================
cd ..
