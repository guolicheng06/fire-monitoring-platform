@echo off
color 0A

echo.
echo ==========================================
echo  Fire Monitoring Platform - GitHub Setup
echo ==========================================
echo.

:: Get user input
echo Please enter your information:
echo.
set /p GITHUB_USER="1. GitHub Username: "
set /p GITHUB_REPO="2. Repository Name (fire-monitoring-platform): "

if "%GITHUB_REPO%"=="" set GITHUB_REPO=fire-monitoring-platform

set /p COMMIT_MSG="3. Commit message (press Enter for default): "

if "%COMMIT_MSG%"=="" set COMMIT_MSG=feat: Fire Monitoring Platform

:: Build repo URL
set REPO_URL=https://github.com/%GITHUB_USER%/%GITHUB_REPO%.git

echo.
echo ==========================================
echo Configuration
echo ==========================================
echo GitHub Username: %GITHUB_USER%
echo Repository Name: %GITHUB_REPO%
echo Repository URL:  %REPO_URL%
echo Commit Message:  %COMMIT_MSG%
echo ==========================================
echo.

set /p CONFIRM="Confirm configuration? (y/n): "
if /i not "%CONFIRM%"=="y" (
    echo Cancelled.
    pause
    exit /b
)

:: 1. Check Git
echo [1/5] Checking Git...
where git >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Git not found!
    echo Please install Git first: https://git-scm.com/download/win
    pause
    exit /b 1
)
echo [OK] Git is installed

:: 2. Initialize repo
echo.
echo [2/5] Initializing Git repository...
if exist ".git" (
    echo [SKIP] Already a Git repository
) else (
    git init
    git branch -M main
    echo [OK] Repository initialized
)

:: 3. Configure remote
echo.
echo [3/5] Configuring remote repository...
git remote remove origin >nul 2>&1
git remote add origin %REPO_URL%
echo [OK] Remote repository configured

:: 4. Commit code
echo.
echo [4/5] Committing code...
git add .
git commit -m "%COMMIT_MSG%"
echo [OK] Code committed

:: 5. Push to GitHub
echo.
echo [5/5] Pushing to GitHub...
echo.
echo [INFO] If first push, you will be asked for credentials.
echo [INFO] For password, use Personal Access Token (not login password).
echo [INFO] Get token: https://github.com/settings/tokens
echo.
git push -u origin main --force

if %errorlevel% equ 0 (
    echo.
    echo ==========================================
    echo   SUCCESS!
    echo ==========================================
    echo.
    echo Next: Deploy to Vercel
    echo.
    echo 1. Go to https://vercel.com
    echo 2. Login with GitHub
    echo 3. Click "Import Project"
    echo 4. Select: [%GITHUB_REPO%]
    echo 5. Add environment variables:
    echo    - NEXT_PUBLIC_SUPABASE_URL
    echo    - NEXT_PUBLIC_SUPABASE_ANON_KEY
    echo    - SUPABASE_SERVICE_ROLE_KEY
    echo 6. Click "Deploy"
    echo.
) else (
    echo.
    echo [ERROR] Push failed!
    echo Please check repository URL and permissions.
    echo.
)

echo.
pause
