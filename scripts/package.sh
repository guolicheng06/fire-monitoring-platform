#!/bin/bash

# 商业综合体消防智能监控平台 - 项目打包脚本
# 使用方法: ./scripts/package.sh [输出目录]

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 项目根目录
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_ROOT"

# 默认输出目录
OUTPUT_DIR="${1:-$PROJECT_ROOT/../fire-monitoring-platform-package}"
PACKAGE_NAME="fire-monitoring-platform-$(date +%Y%m%d-%H%M%S)"
PACKAGE_PATH="$OUTPUT_DIR/$PACKAGE_NAME"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  商业综合体消防智能监控平台 - 打包工具${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# 创建输出目录
echo -e "${YELLOW}[1/6]${NC} 创建输出目录..."
mkdir -p "$PACKAGE_PATH"
echo -e "${GREEN}✓${NC} 输出目录: $PACKAGE_PATH"
echo ""

# 复制项目文件
echo -e "${YELLOW}[2/6]${NC} 复制项目文件..."

# 核心源代码和配置
cp -r \
  src \
  public \
  scripts \
  package.json \
  pnpm-lock.yaml \
  tsconfig.json \
  next.config.ts \
  postcss.config.mjs \
  tailwind.config.ts \
  .gitignore \
  .env.example \
  DEPLOYMENT.md \
  AGENTS.md \
  README.md \
  .coze \
  "$PACKAGE_PATH/" 2>/dev/null || true

# 创建必要的空目录
mkdir -p "$PACKAGE_PATH/logs"
mkdir -p "$PACKAGE_PATH/.next"

echo -e "${GREEN}✓${NC} 项目文件复制完成"
echo ""

# 生成快速启动脚本
echo -e "${YELLOW}[3/6]${NC} 生成快速启动脚本..."

# Windows 启动脚本 - 修复版（英文，避免编码问题）
cat > "$PACKAGE_PATH/start.bat" << 'EOF'
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
EOF

# Linux/macOS 启动脚本
cat > "$PACKAGE_PATH/start.sh" << 'EOF'
#!/bin/bash

# 商业综合体消防智能监控平台 - 快速启动脚本
# 使用方法: ./start.sh

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  商业综合体消防智能监控平台${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# 检查 Node.js
echo -e "${YELLOW}[1/4]${NC} 检查 Node.js 和 pnpm..."
if ! command -v node &> /dev/null; then
    echo -e "${RED}[错误]${NC} 未找到 Node.js，请先安装 Node.js 24.x 或更高版本"
    echo "下载地址: https://nodejs.org/"
    exit 1
fi

if ! command -v pnpm &> /dev/null; then
    echo -e "${YELLOW}[提示]${NC} 未找到 pnpm，正在安装..."
    npm install -g pnpm
fi

echo -e "${GREEN}✓${NC} 环境检查通过"
echo ""

# 安装依赖
echo -e "${YELLOW}[2/4]${NC} 安装依赖..."
if [ ! -d "node_modules" ]; then
    pnpm install
else
    echo -e "${YELLOW}[提示]${NC} node_modules 已存在，跳过安装"
fi
echo -e "${GREEN}✓${NC} 依赖安装完成"
echo ""

# 检查环境变量
echo -e "${YELLOW}[3/4]${NC} 检查环境变量..."
if [ ! -f ".env.local" ]; then
    echo -e "${YELLOW}[提示]${NC} 未找到 .env.local，正在从 .env.example 创建..."
    cp .env.example .env.local
    echo ""
    echo -e "${YELLOW}========================================${NC}"
    echo -e "${YELLOW}  重要提示${NC}"
    echo -e "${YELLOW}========================================${NC}"
    echo "  请编辑 .env.local 文件，填入你的配置:"
    echo "  - Supabase URL 和密钥"
    echo "  - 其他必要配置"
    echo ""
    read -p "  配置完成后按回车键继续..."
fi
echo -e "${GREEN}✓${NC} 环境变量检查完成"
echo ""

# 启动服务器
echo -e "${YELLOW}[4/4]${NC} 启动开发服务器..."
echo ""
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  正在启动服务器...${NC}"
echo -e "${BLUE}  访问地址: http://localhost:5000${NC}"
echo -e "${BLUE}  按 Ctrl+C 停止服务器${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

pnpm dev
EOF

chmod +x "$PACKAGE_PATH/start.sh"

echo -e "${GREEN}✓${NC} 快速启动脚本生成完成"
echo ""

# 生成项目信息文件
echo -e "${YELLOW}[4/6]${NC} 生成项目信息文件..."

cat > "$PACKAGE_PATH/PROJECT_INFO.txt" << EOF
商业综合体消防智能监控平台
========================================

项目版本: 1.0.0
打包时间: $(date '+%Y-%m-%d %H:%M:%S')

技术栈
----------------------------------------
- 框架: Next.js 16 (App Router)
- 前端: React 19, TypeScript 5
- UI组件: shadcn/ui, Tailwind CSS 4
- 数据库: Supabase (PostgreSQL)
- 实时通信: WebSocket
- 设备连接: Modbus TCP/RTU, 4G模块
- 图表库: Recharts

目录结构
----------------------------------------
src/
  ├── app/               # Next.js 页面和 API
  ├── components/        # React 组件
  ├── lib/              # 工具库
  └── storage/          # 数据库相关
public/                 # 静态资源
scripts/                # 构建脚本
.env.example           # 环境变量示例
DEPLOYMENT.md          # 部署指南

快速开始
----------------------------------------
1. 解压项目文件
2. 复制环境变量: cp .env.example .env.local
3. 编辑 .env.local 填入配置
4. 安装依赖: pnpm install
5. 启动开发服务器: pnpm dev
6. 访问 http://localhost:5000

或使用快速启动脚本:
- Windows: 双击 start.bat
- Linux/macOS: ./start.sh

测试账号
----------------------------------------
管理员: admin / admin123
物业: property / property123
施工员1: tech1 / tech123 (张明)
施工员2: tech2 / tech123 (李华)
施工员3: tech3 / tech123 (王强)
业主1: owner1 / owner123
业主2: owner2 / owner123

更多信息
----------------------------------------
- 详细部署指南: DEPLOYMENT.md
- 开发规范: AGENTS.md
- 项目说明: README.md
EOF

echo -e "${GREEN}✓${NC} 项目信息文件生成完成"
echo ""

# 创建压缩包
echo -e "${YELLOW}[5/6]${NC} 创建压缩包..."
cd "$OUTPUT_DIR"

# 创建 ZIP 压缩包（跨平台兼容）
if command -v zip &> /dev/null; then
    zip -r "$PACKAGE_NAME.zip" "$PACKAGE_NAME"
    echo -e "${GREEN}✓${NC} ZIP 压缩包创建完成: $PACKAGE_NAME.zip"
else
    echo -e "${YELLOW}[提示]${NC} 未找到 zip 命令，跳过 ZIP 打包"
fi

# 创建 tar.gz 压缩包（Linux/macOS）
if command -v tar &> /dev/null; then
    tar -czf "$PACKAGE_NAME.tar.gz" "$PACKAGE_NAME"
    echo -e "${GREEN}✓${NC} TAR.GZ 压缩包创建完成: $PACKAGE_NAME.tar.gz"
fi

cd "$PROJECT_ROOT"
echo ""

# 完成
echo -e "${YELLOW}[6/6]${NC} 清理临时文件..."
echo ""

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  打包完成！${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "${BLUE}输出目录:${NC} $OUTPUT_DIR"
echo -e "${BLUE}项目目录:${NC} $PACKAGE_PATH"
echo ""
if [ -f "$OUTPUT_DIR/$PACKAGE_NAME.zip" ]; then
    echo -e "${BLUE}压缩包 (ZIP):${NC} $OUTPUT_DIR/$PACKAGE_NAME.zip"
fi
if [ -f "$OUTPUT_DIR/$PACKAGE_NAME.tar.gz" ]; then
    echo -e "${BLUE}压缩包 (TAR.GZ):${NC} $OUTPUT_DIR/$PACKAGE_NAME.tar.gz"
fi
echo ""
echo -e "${YELLOW}下一步:${NC}"
echo "  1. 将压缩包发送给目标用户"
echo "  2. 用户解压后运行快速启动脚本"
echo "  3. 或参考 DEPLOYMENT.md 进行手动部署"
echo ""
