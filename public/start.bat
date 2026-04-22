@echo off
title 商业综合体消防智能监控平台

echo.
echo ========================================
echo   商业综合体消防智能监控平台
echo ========================================
echo.

echo [1/4] 检查 Node.js 和 pnpm...
node --version >nul 2>&1
if errorlevel 1 (
    echo.
    echo [错误] 未找到 Node.js，请先安装 Node.js 24.x 或更高版本
    echo 下载地址: https://nodejs.org/
    echo.
    pause
    exit /b 1
)

pnpm --version >nul 2>&1
if errorlevel 1 (
    echo [提示] 未找到 pnpm，正在安装...
    npm install -g pnpm
)

echo [OK] 环境检查完成
echo.

echo [2/4] 安装依赖...
if not exist "node_modules" (
    pnpm install
) else (
    echo [提示] node_modules 已存在，跳过安装
)
echo [OK] 依赖检查完成
echo.

echo [3/4] 检查环境变量...
if not exist ".env.local" (
    if exist ".env.example" (
        echo [提示] 未找到 .env.local，正在从 .env.example 创建...
        copy .env.example .env.local
        echo.
        echo ========================================
        echo   重要提示
        echo ========================================
        echo   请编辑 .env.local 文件，填入你的配置:
        echo   - Supabase URL 和密钥
        echo   - 其他必要配置
        echo.
        echo   配置完成后按任意键继续...
        pause
    )
)
echo [OK] 环境变量检查完成
echo.

echo [4/4] 启动开发服务器...
echo.
echo ========================================
echo   正在启动服务器...
echo   访问地址: http://localhost:5000
echo   按 Ctrl+C 停止服务器
echo ========================================
echo.

pnpm dev

echo.
echo 服务器已停止
pause
