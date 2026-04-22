@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

REM 商业综合体消防智能监控平台 - 项目打包脚本 (Windows版本)
REM 使用方法: scripts\package.bat [输出目录]

echo ========================================
echo   商业综合体消防智能监控平台 - 打包工具
echo ========================================
echo.

REM 设置项目根目录
set "PROJECT_ROOT=%~dp0.."
cd /d "%PROJECT_ROOT%"

REM 默认输出目录
if "%~1"=="" (
    set "OUTPUT_DIR=%PROJECT_ROOT%\..\fire-monitoring-platform-package"
) else (
    set "OUTPUT_DIR=%~1"
)

REM 获取时间戳
for /f "tokens=2 delims==" %%I in ('wmic os get localdatetime /value') do set "dt=%%I"
set "PACKAGE_NAME=fire-monitoring-platform-%dt:~0,8%-%dt:~8,6%"
set "PACKAGE_PATH=%OUTPUT_DIR%\%PACKAGE_NAME%"

echo [1/6] 创建输出目录...
if not exist "%PACKAGE_PATH%" mkdir "%PACKAGE_PATH%"
echo     输出目录: %PACKAGE_PATH%
echo.

echo [2/6] 复制项目文件...

REM 复制核心目录和文件
xcopy /E /I /Y src "%PACKAGE_PATH%\src" >nul
xcopy /E /I /Y public "%PACKAGE_PATH%\public" >nul
xcopy /E /I /Y scripts "%PACKAGE_PATH%\scripts" >nul
if exist .coze xcopy /E /I /Y .coze "%PACKAGE_PATH%\.coze" >nul

REM 复制配置文件
copy /Y package.json "%PACKAGE_PATH%\" >nul
copy /Y pnpm-lock.yaml "%PACKAGE_PATH%\" >nul 2>nul
copy /Y tsconfig.json "%PACKAGE_PATH%\" >nul
copy /Y next.config.ts "%PACKAGE_PATH%\" >nul
copy /Y postcss.config.mjs "%PACKAGE_PATH%\" >nul 2>nul
copy /Y tailwind.config.ts "%PACKAGE_PATH%\" >nul 2>nul
copy /Y .gitignore "%PACKAGE_PATH%\" >nul
copy /Y .env.example "%PACKAGE_PATH%\" >nul
copy /Y DEPLOYMENT.md "%PACKAGE_PATH%\" >nul
copy /Y AGENTS.md "%PACKAGE_PATH%\" >nul 2>nul
copy /Y README.md "%PACKAGE_PATH%\" >nul 2>nul

REM 创建必要的目录
if not exist "%PACKAGE_PATH%\logs" mkdir "%PACKAGE_PATH%\logs"
if not exist "%PACKAGE_PATH%\.next" mkdir "%PACKAGE_PATH%\.next"

echo     项目文件复制完成
echo.

echo [3/6] 生成快速启动脚本...

REM Windows 启动脚本
(
echo @echo off
echo chcp 65001 ^>nul
echo echo ========================================
echo echo   商业综合体消防智能监控平台
echo echo ========================================
echo echo.
echo.
echo echo [1/4] 检查 Node.js 和 pnpm...
echo node --version ^>nul 2^>^&1
echo if %%errorlevel%% neq 0 ^(
echo     echo [错误] 未找到 Node.js，请先安装 Node.js 24.x 或更高版本
echo     echo 下载地址: https://nodejs.org/
echo     pause
echo     exit /b 1
echo ^)
echo.
echo pnpm --version ^>nul 2^>^&1
echo if %%errorlevel%% neq 0 ^(
echo     echo [提示] 未找到 pnpm，正在安装...
echo     npm install -g pnpm
echo ^)
echo.
echo echo [2/4] 安装依赖...
echo if not exist "node_modules" ^(
echo     call pnpm install
echo ^) else ^(
echo     echo [提示] node_modules 已存在，跳过安装
echo ^)
echo.
echo echo [3/4] 检查环境变量...
echo if not exist ".env.local" ^(
echo     echo [提示] 未找到 .env.local，正在从 .env.example 创建...
echo     copy .env.example .env.local
echo     echo.
echo     echo ========================================
echo     echo   重要提示
echo     echo ========================================
echo     echo   请编辑 .env.local 文件，填入你的配置:
echo     echo   - Supabase URL 和密钥
echo     echo   - 其他必要配置
echo     echo.
echo     echo   配置完成后按任意键继续...
echo     pause ^>nul
echo ^)
echo.
echo echo [4/4] 启动开发服务器...
echo echo.
echo echo ========================================
echo echo   正在启动服务器...
echo echo   访问地址: http://localhost:5000
echo echo   按 Ctrl+C 停止服务器
echo echo ========================================
echo echo.
echo.
echo call pnpm dev
echo.
echo pause
) > "%PACKAGE_PATH%\start.bat"

REM Linux/macOS 启动脚本
(
echo #!/bin/bash
echo.
echo # 商业综合体消防智能监控平台 - 快速启动脚本
echo # 使用方法: ./start.sh
echo.
echo set -e
echo.
echo # 颜色定义
echo RED='\033[0;31m'
echo GREEN='\033[0;32m'
echo YELLOW='\033[1;33m'
echo BLUE='\033[0;34m'
echo NC='\033[0m'
echo.
echo echo -e "${BLUE}========================================${NC}"
echo echo -e "${BLUE}  商业综合体消防智能监控平台${NC}"
echo echo -e "${BLUE}========================================${NC}"
echo echo ""
echo.
echo # 检查 Node.js
echo echo -e "${YELLOW}[1/4]${NC} 检查 Node.js 和 pnpm..."
echo if ! command -v node ^&^> /dev/null; then
echo     echo -e "${RED}[错误]${NC} 未找到 Node.js，请先安装 Node.js 24.x 或更高版本"
echo     echo "下载地址: https://nodejs.org/"
echo     exit 1
echo fi
echo.
echo if ! command -v pnpm ^&^> /dev/null; then
echo     echo -e "${YELLOW}[提示]${NC} 未找到 pnpm，正在安装..."
echo     npm install -g pnpm
echo fi
echo.
echo echo -e "${GREEN}✓${NC} 环境检查通过"
echo echo ""
echo.
echo # 安装依赖
echo echo -e "${YELLOW}[2/4]${NC} 安装依赖..."
echo if [ ! -d "node_modules" ]; then
echo     pnpm install
echo else
echo     echo -e "${YELLOW}[提示]${NC} node_modules 已存在，跳过安装"
echo fi
echo echo -e "${GREEN}✓${NC} 依赖安装完成"
echo echo ""
echo.
echo # 检查环境变量
echo echo -e "${YELLOW}[3/4]${NC} 检查环境变量..."
echo if [ ! -f ".env.local" ]; then
echo     echo -e "${YELLOW}[提示]${NC} 未找到 .env.local，正在从 .env.example 创建..."
echo     cp .env.example .env.local
echo     echo ""
echo     echo -e "${YELLOW}========================================${NC}"
echo     echo -e "${YELLOW}  重要提示${NC}"
echo     echo -e "${YELLOW}========================================${NC}"
echo     echo "  请编辑 .env.local 文件，填入你的配置:"
echo     echo "  - Supabase URL 和密钥"
echo     echo "  - 其他必要配置"
echo     echo ""
echo     read -p "  配置完成后按回车键继续..."
echo fi
echo echo -e "${GREEN}✓${NC} 环境变量检查完成"
echo echo ""
echo.
echo # 启动服务器
echo echo -e "${YELLOW}[4/4]${NC} 启动开发服务器..."
echo echo ""
echo echo -e "${BLUE}========================================${NC}"
echo echo -e "${BLUE}  正在启动服务器...${NC}"
echo echo -e "${BLUE}  访问地址: http://localhost:5000${NC}"
echo echo -e "${BLUE}  按 Ctrl+C 停止服务器${NC}"
echo echo -e "${BLUE}========================================${NC}"
echo echo ""
echo.
echo pnpm dev
) > "%PACKAGE_PATH%\start.sh"

echo     快速启动脚本生成完成
echo.

echo [4/6] 生成项目信息文件...
(
echo 商业综合体消防智能监控平台
echo ========================================
echo.
echo 项目版本: 1.0.0
echo 打包时间: %date% %time%
echo.
echo 技术栈
echo ----------------------------------------
echo - 框架: Next.js 16 ^(App Router^)
echo - 前端: React 19, TypeScript 5
echo - UI组件: shadcn/ui, Tailwind CSS 4
echo - 数据库: Supabase ^(PostgreSQL^)
echo - 实时通信: WebSocket
echo - 设备连接: Modbus TCP/RTU, 4G模块
echo - 图表库: Recharts
echo.
echo 目录结构
echo ----------------------------------------
echo src/
echo   ^ ^ ^<^- app/               # Next.js 页面和 API
echo   ^ ^ ^<^- components/        # React 组件
echo   ^ ^ ^<^- lib/              # 工具库
echo   ^ ^ ^<^- storage/          # 数据库相关
echo public/                 # 静态资源
echo scripts/                # 构建脚本
echo .env.example           # 环境变量示例
echo DEPLOYMENT.md          # 部署指南
echo.
echo 快速开始
echo ----------------------------------------
echo 1. 解压项目文件
echo 2. 复制环境变量: copy .env.example .env.local
echo 3. 编辑 .env.local 填入配置
echo 4. 安装依赖: pnpm install
echo 5. 启动开发服务器: pnpm dev
echo 6. 访问 http://localhost:5000
echo.
echo 或使用快速启动脚本:
echo - Windows: 双击 start.bat
echo - Linux/macOS: ./start.sh
echo.
echo 测试账号
echo ----------------------------------------
echo 管理员: admin / admin123
echo 物业: property / property123
echo 施工员1: tech1 / tech123 ^(张明^)
echo 施工员2: tech2 / tech123 ^(李华^)
echo 施工员3: tech3 / tech123 ^(王强^)
echo 业主1: owner1 / owner123
echo 业主2: owner2 / owner123
echo.
echo 更多信息
echo ----------------------------------------
echo - 详细部署指南: DEPLOYMENT.md
echo - 开发规范: AGENTS.md
echo - 项目说明: README.md
) > "%PACKAGE_PATH%\PROJECT_INFO.txt"

echo     项目信息文件生成完成
echo.

echo [5/6] 创建压缩包...
cd /d "%OUTPUT_DIR%"

REM 使用 PowerShell 创建 ZIP 压缩包
where powershell >nul 2>nul
if %errorlevel% equ 0 (
    powershell -Command "Compress-Archive -Path '%PACKAGE_NAME%' -DestinationPath '%PACKAGE_NAME%.zip' -Force"
    echo     ZIP 压缩包创建完成: %PACKAGE_NAME%.zip
) else (
    echo     [提示] 未找到 PowerShell，跳过 ZIP 打包
)

cd /d "%PROJECT_ROOT%"
echo.

echo [6/6] 打包完成！
echo.
echo ========================================
echo   打包完成！
echo ========================================
echo.
echo 输出目录: %OUTPUT_DIR%
echo 项目目录: %PACKAGE_PATH%
echo.
if exist "%OUTPUT_DIR%\%PACKAGE_NAME%.zip" (
    echo 压缩包 (ZIP): %OUTPUT_DIR%\%PACKAGE_NAME%.zip
)
echo.
echo 下一步:
echo   1. 将压缩包发送给目标用户
echo   2. 用户解压后运行快速启动脚本
echo   3. 或参考 DEPLOYMENT.md 进行手动部署
echo.
pause
