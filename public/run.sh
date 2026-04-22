#!/bin/bash
# 瑶安 YA-K300-S 设备连接快速启动脚本

echo "==========================================="
echo "  瑶安 YA-K300-S 设备连接工具"
echo "==========================================="

# 检查 Node.js 是否安装
if ! command -v node &> /dev/null; then
    echo "错误: Node.js 未安装"
    echo "请访问 https://nodejs.org/ 下载安装"
    exit 1
fi

echo "Node.js 版本: $(node -v)"
echo ""

# 检查依赖是否安装
if [ ! -d "node_modules" ]; then
    echo "正在安装依赖..."
    npm install
    echo ""
fi

# 显示帮助
if [ "$1" == "--help" ] || [ "$1" == "-h" ]; then
    node yak300-standalone.js --help
    exit 0
fi

# RS485 模式
if [ "$1" == "rtu" ]; then
    shift
    node yak300-standalone.js --mode rtu "$@"
    exit $?
fi

# 4G 模式
if [ "$1" == "4g" ]; then
    shift
    node yak300-standalone.js --mode 4g "$@"
    exit $?
fi

# 交互式选择
echo "请选择连接模式:"
echo "  1. RS485 串口连接"
echo "  2. 4G 模块连接"
echo "  3. 显示帮助"
echo ""
read -p "请输入选项 (1/2/3): " choice

case $choice in
    1)
        echo ""
        read -p "请输入串口路径 [/dev/ttyUSB0]: " path
        path=${path:-/dev/ttyUSB0}
        read -p "请输入从机地址 [1]: " unitId
        unitId=${unitId:-1}
        echo ""
        node yak300-standalone.js --mode rtu --path "$path" --unitId "$unitId"
        ;;
    2)
        echo ""
        read -p "请输入设备GUID [D2D19D04AF5E433E9C4BFCC4]: " guid
        guid=${guid:-D2D19D04AF5E433E9C4BFCC4}
        echo ""
        node yak300-standalone.js --mode 4g --guid "$guid"
        ;;
    3)
        node yak300-standalone.js --help
        ;;
    *)
        echo "无效选项"
        exit 1
        ;;
esac
