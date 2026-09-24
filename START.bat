@echo off
setlocal enabledelayedexpansion

echo ======================================================================
echo 🛰️  PRAHARI MISSION CONTROL - AUTOMATED STARTUP
echo ======================================================================
echo.

:: 1. Check Python
where python >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Python is not installed or not in your PATH!
    echo Please install Python 3.10+ from https://www.python.org/downloads/
    echo (Make sure to check 'Add Python to PATH' during installation)
    pause
    exit /b 1
)

:: 2. Check Node / npm
where npm >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Node.js / npm is not installed or not in your PATH!
    echo Please install Node.js (LTS version) from https://nodejs.org/
    pause
    exit /b 1
)

echo [1/4] Installing / Checking Python dependencies...
python -m pip install -r backend\requirements.txt --quiet
if %ERRORLEVEL% neq 0 (
    echo [WARNING] Some Python packages failed to install with --quiet. Retrying with verbose...
    python -m pip install -r backend\requirements.txt
)

echo.
echo [2/4] Starting FastAPI Backend on http://localhost:8000...
start "Prahari Backend API" cmd /k "cd backend && python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload"

echo.
echo [3/4] Installing / Checking Frontend dependencies...
cd frontend
if not exist "node_modules" (
    echo First-time setup: Installing npm packages (this may take 1-2 minutes)...
    call npm install
)

echo.
echo [4/4] Starting Vite React Frontend on http://localhost:5173...
start "Prahari Frontend UI" cmd /k "npm run dev"
cd ..

echo.
echo ======================================================================
echo ✓ Prahari Mission Control is launching!
echo   • Frontend UI: http://localhost:5173
echo   • Backend API: http://localhost:8000
echo ======================================================================
echo.

timeout /t 3 /nobreak >nul
start "" "http://localhost:5173"
