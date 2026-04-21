@echo off
echo.
echo Starting Fire Monitoring Platform...
echo.

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
)

if not exist ".env.local" (
    if exist ".env.example" (
        echo Creating .env.local...
        copy .env.example .env.local
        echo.
        echo Please edit .env.local and fill in your configuration
        echo.
        pause
    )
)

echo.
echo Starting server...
echo Access: http://localhost:5000
echo.

pnpm dev

echo.
echo Server stopped
echo.
pause
