@echo off
chcp 65001 >nul
echo ========================================
echo   GitHub 上传设置脚本
echo ========================================
echo.

:: 检查 Git 是否安装
where git >nul 2>&1
if %errorlevel% neq 0 (
    echo [错误] 未检测到 Git，请先安装 Git
    echo 下载地址: https://git-scm.com/download/win
    echo.
    pause
    exit /b 1
)

echo [OK] Git 已安装

:: 检查是否已有 .git 目录
if exist ".git" (
    echo [提示] 已是 Git 仓库，跳过初始化
) else (
    echo.
    echo 正在初始化 Git 仓库...
    git init
    git branch -M main
    echo [OK] Git 仓库初始化完成
)

:: 检查远程仓库是否已配置
git remote get-url origin >nul 2>&1
if %errorlevel% equ 0 (
    echo.
    echo [提示] 远程仓库已配置:
    git remote -v
    echo.
    set /p REPLY=是否要更新远程仓库地址? (y/n):
    if /i "%REPLY%"=="y" (
        echo 请输入你的 GitHub 仓库地址 (例如: https://github.com/用户名/仓库名.git):
        set /p REPO_URL=
        if not "%REPO_URL%"=="" (
            git remote set-url origin %REPO_URL%
            echo [OK] 远程仓库已更新
        )
    )
) else (
    echo.
    echo 请输入你的 GitHub 仓库地址
    echo 格式: https://github.com/用户名/仓库名.git
    echo.
    set /p REPO_URL=
    if not "%REPO_URL%"=="" (
        git remote add origin %REPO_URL%
        echo [OK] 远程仓库已添加
    )
)

:: 显示状态
echo.
echo ========================================
echo   当前 Git 状态
echo ========================================
echo.
git status

:: 询问是否提交并推送
echo.
set /p COMMIT_MSG=请输入提交信息 (直接回车使用默认信息):
if "%COMMIT_MSG%"=="" set COMMIT_MSG=feat: 商业综合体消防智能监控平台

echo.
echo 正在提交代码...
git add .
git commit -m "%COMMIT_MSG%"
echo [OK] 代码已提交

:: 询问是否推送到 GitHub
echo.
set /p PUSH=是否推送到 GitHub? (y/n):
if /i "%PUSH%"=="y" (
    echo.
    echo 正在推送到 GitHub...
    echo.
    echo [提示] 如果是首次推送，可能需要输入 GitHub 用户名和密码
    echo [提示] 密码请使用 Personal Access Token (不是登录密码)
    echo.
    git push -u origin main
    echo.
    if %errorlevel% equ 0 (
        echo ========================================
        echo   上传成功!
        echo ========================================
        echo.
        echo 下一步：在 Vercel 部署
        echo 1. 访问 https://vercel.com
        echo 2. 用 GitHub 登录
        echo 3. 点击 "Import Project"
        echo 4. 选择你的仓库
        echo 5. 配置环境变量
        echo 6. 等待部署完成
    ) else (
        echo [错误] 推送失败，请检查远程仓库地址是否正确
    )
)

echo.
pause
