@echo off

echo.
echo ========================================
echo   Fire Monitoring Platform
echo ========================================
echo.

echo 1. Checking Node.js...
node --version
if errorlevel 1 (
    echo.
    echo ERROR: Node.js not found
    echo.
    echo Please install Node.js 24.x or later
    echo Download: https://nodejs.org/
    echo.
    pause
    exit /b 1
)
echo OK
echo.

echo 2. Checking pnpm...
pnpm --version
if errorlevel 1 (
    echo.
    echo Installing pnpm...
    npm install -g pnpm
    if errorlevel 1 (
        echo.
        echo ERROR: pnpm install failed
        pause
        exit /b 1
    )
)
echo OK
echo.

if not exist "package.json" (
    echo ERROR: package.json not found
    echo.
    echo Please run this script from project folder
    echo Current folder: %cd%
    echo.
    pause
    exit /b 1
)

echo 3. Checking environment...
if not exist ".env.local" (
    if exist ".env.example" (
        echo Creating .env.local...
        copy .env.example .env.local
        echo.
        echo IMPORTANT: Please edit .env.local
        echo and fill in your Supabase configuration
        echo.
        echo Press any key to continue...
        pause
    )
)
echo OK
echo.

echo 4. Checking dependencies...
if not exist "node_modules" (
    echo Installing dependencies...
    pnpm install
    if errorlevel 1 (
        echo.
        echo ERROR: Install failed
        pause
        exit /b 1
    )
) else (
    echo OK
)
echo.

echo ========================================
echo   Starting server...
echo   Access: http://localhost:5000
echo   Press Ctrl+C to stop
echo ========================================
echo.

pnpm dev

echo.
echo Server stopped
echo.
pause
