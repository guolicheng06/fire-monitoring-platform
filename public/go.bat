@echo off
echo.
echo ========================================
echo   Fire Monitoring Platform
echo ========================================
echo.

echo Step 1: Check if dependencies installed...
if not exist "node_modules" (
    echo Installing dependencies...
    call pnpm install
    if errorlevel 1 (
        echo.
        echo ERROR: Failed to install dependencies
        echo.
        pause
        exit /b 1
    )
    echo Dependencies installed!
) else (
    echo Dependencies already installed
)
echo.

echo Step 2: Check environment variables...
if not exist ".env.local" (
    if exist ".env.example" (
        echo Creating .env.local...
        copy .env.example .env.local
        echo.
        echo ========================================
        echo   IMPORTANT
        echo ========================================
        echo.
        echo Please edit .env.local file
        echo Fill in your Supabase configuration
        echo.
        echo Press any key to continue...
        pause >nul
    )
)
echo Environment check done
echo.

echo Step 3: Starting server...
echo.
echo ========================================
echo   Server starting...
echo   Access: http://localhost:5000
echo   Press Ctrl+C to stop
echo ========================================
echo.

pnpm dev

echo.
echo Server stopped
echo.
pause
