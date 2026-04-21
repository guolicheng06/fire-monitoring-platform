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
