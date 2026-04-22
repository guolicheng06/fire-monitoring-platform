@echo off
title Fire Monitoring Platform - Debug

echo ========================================
echo   Fire Monitoring Platform - Debug
echo ========================================
echo.

echo [1/5] Checking Node.js...
node --version
if errorlevel 1 (
    echo [ERROR] Node.js not found
    echo Please install Node.js 24.x or later
    echo Download: https://nodejs.org/
    pause
    exit /b 1
)
echo [OK] Node.js check passed
echo.
pause

echo [2/5] Checking pnpm...
pnpm --version
if errorlevel 1 (
    echo [INFO] pnpm not found, installing...
    npm install -g pnpm
    if errorlevel 1 (
        echo [ERROR] pnpm installation failed
        pause
        exit /b 1
    )
)
echo [OK] pnpm check passed
echo.
pause

echo [3/5] Checking project files...
if not exist "package.json" (
    echo [ERROR] package.json not found
    echo Please run this script in correct directory
    echo Current directory: %cd%
    pause
    exit /b 1
)
echo [OK] Project files check passed
echo.
pause

echo [4/5] Checking environment variables...
if not exist ".env.local" (
    if exist ".env.example" (
        echo [INFO] Creating .env.local from .env.example...
        copy .env.example .env.local
        echo.
        echo ========================================
        echo   IMPORTANT
        echo ========================================
        echo.
        echo Please edit .env.local file
        echo Fill in your Supabase configuration
        echo.
        echo Press any key to continue after configuration...
        pause
    )
) else (
    echo [OK] .env.local exists
)
echo.
pause

echo [5/5] Starting development server...
echo.
echo ========================================
echo   Starting server...
echo   Access: http://localhost:5000
echo   Press Ctrl+C to stop
echo ========================================
echo.

pnpm dev

if errorlevel 1 (
    echo.
    echo [ERROR] Server failed to start, error code: %errorlevel%
    echo.
)

echo.
echo Press any key to exit...
pause
