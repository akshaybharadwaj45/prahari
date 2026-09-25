@echo off
setlocal enabledelayedexpansion

:: 1. Force working directory to the directory where this script is located
cd /d "%~dp0"
title Prahari Mission Control Launcher

echo ======================================================================
echo   PRAHARI MISSION CONTROL - SYSTEM LAUNCHER
echo ======================================================================
echo.

:: 2. Check Python
where python >nul 2>nul
if %ERRORLEVEL% neq 0 (
    where py >nul 2>nul
    if %ERRORLEVEL% neq 0 (
        echo [ERROR] Python is not found in PATH!
        echo Please install Python 3.10+ and ensure 'Add Python to PATH' is checked.
        pause
        exit /b 1
    )
)

:: 3. Check Python Dependencies
python -c "import fastapi, uvicorn, xgboost, pandas, sklearn" >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo First-time setup detected: Installing Python dependencies...
    python -m pip install -r "%~dp0requirements.txt"
)

:: 4. Check Node.js and npm
where npm >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Node.js and npm are not found in PATH!
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

echo [1/3] Starting FastAPI Backend on Port 8000...
start "Prahari Backend API" cmd /k "cd /d ""%~dp0backend"" && title Prahari Backend API && python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload"

echo.
echo [2/3] Checking and Starting Frontend UI on Port 5173...
if not exist "frontend\node_modules" (
    echo First-time setup detected: Installing frontend npm packages...
    cd /d "%~dp0frontend"
    call npm install
    cd /d "%~dp0"
)

start "Prahari Frontend UI" cmd /k "cd /d ""%~dp0frontend"" && title Prahari Frontend UI && npm run dev"

echo.
echo [3/3] Opening Mission Control Dashboard in Web Browser...
ping 127.0.0.1 -n 4 >nul
start "" "http://localhost:5173"

echo.
echo ======================================================================
echo   [SUCCESS] Prahari Mission Control is up and running!
echo   * Frontend UI: http://localhost:5173
echo   * Backend API: http://localhost:8000 (Docs: http://localhost:8000/docs)
echo ======================================================================
echo.
echo (You can minimize this window. Close the Backend/Frontend windows to stop.)
echo.
pause
