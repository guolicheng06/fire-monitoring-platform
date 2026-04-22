@echo off
title Fire Monitoring Platform

echo.
echo ========================================
echo   Fire Monitoring Platform
echo ========================================
echo.

echo [1/4] Checking Node.js...
node --version
if errorlevel 1 (
    echo.
    echo [ERROR] Node.js not found
    echo.
    echo Please install Node.js 24.x or later:
    echo Download: https://nodejs.org/
    echo.
    pause
    exit /b 1
)
echo [OK] Node.js is installed
echo.

echo [2/4] Checking pnpm...
pnpm --version
if errorlevel 1 (
    echo.
    echo [INFO] Installing pnpm...
    npm install -g pnpm
    if errorlevel 1 (
        echo.
        echo [ERROR] pnpm installation failed
        pause
        exit /b 1
    )
)
echo [OK] pnpm is installed
echo.

if not exist "package.json" (
    echo [ERROR] package.json not found
    echo.
    echo Please run this script from the project root directory
    echo Current directory: %cd%
    echo.
    pause
    exit /b 1
)

echo [3/4] Checking environment variables...
if not exist ".env.local" (
    if exist ".env.example" (
        echo [INFO] Creating .env.local file...
        copy .env.example .env.local
        echo.
        echo ========================================
        echo   IMPORTANT: Configure Environment
        echo ========================================
        echo.
        echo Please open .env.local with a text editor
        echo and fill in your Supabase configuration
        echo.
        echo Press any key to continue after configuration...
        pause
    )
)
echo [OK] Environment check complete
echo.

echo [4/4] Checking dependencies...
if not exist "node_modules" (
    echo [INFO] Installing dependencies, please wait...
    pnpm install
    if errorlevel 1 (
        echo.
        echo [ERROR] Dependency installation failed
        pause
        exit /b 1
    )
) else (
    echo [OK] Dependencies already installed
)
echo.

echo ========================================
echo   Starting development server...
echo   Access: http://localhost:5000
echo   Press Ctrl+C to stop
echo ========================================
echo.

pnpm dev

echo.
echo Server stopped
echo.
pause
