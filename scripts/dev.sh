#!/bin/bash
set -Eeuo pipefail


PORT=5000
COZE_WORKSPACE_PATH="${COZE_WORKSPACE_PATH:-$(pwd)}"
DEPLOY_RUN_PORT=5000


cd "${COZE_WORKSPACE_PATH}"

kill_port_if_listening() {
    local pids
    pids=$(ss -H -lntp 2>/dev/null | awk -v port="${DEPLOY_RUN_PORT}" '$4 ~ ":"port"$"' | grep -o 'pid=[0-9]*' | cut -d= -f2 | paste -sd' ' - || true)
    if [[ -z "${pids}" ]]; then
      echo "Port ${DEPLOY_RUN_PORT} is free."
      return
    fi
    echo "Port ${DEPLOY_RUN_PORT} in use by PIDs: ${pids} (SIGKILL)"
    echo "${pids}" | xargs -I {} kill -9 {}
    sleep 1
    pids=$(ss -H -lntp 2>/dev/null | awk -v port="${DEPLOY_RUN_PORT}" '$4 ~ ":"port"$"' | grep -o 'pid=[0-9]*' | cut -d= -f2 | paste -sd' ' - || true)
    if [[ -n "${pids}" ]]; then
      echo "Warning: port ${DEPLOY_RUN_PORT} still busy after SIGKILL, PIDs: ${pids}"
    else
      echo "Port ${DEPLOY_RUN_PORT} cleared."
    fi
}

# 修复串口模块路径问题 - pnpm使用/ROOT作为workspace路径前缀
fix_serialport_bindings() {
    if [[ -d "/ROOT" ]]; then
        return 0
    fi
    
    echo "Creating /ROOT symlink for pnpm compatibility..."
    mkdir -p /ROOT
    
    # 复制串口bindings到/ROOT目录
    if [[ -d "${COZE_WORKSPACE_PATH}/node_modules/.pnpm/@serialport+bindings-cpp@13.0.1/node_modules/@serialport/bindings-cpp/build/Release" ]]; then
        mkdir -p "/ROOT/workspace/projects/node_modules/.pnpm/@serialport+bindings-cpp@13.0.1/node_modules/@serialport/bindings-cpp/build/Release"
        cp -f "${COZE_WORKSPACE_PATH}/node_modules/.pnpm/@serialport+bindings-cpp@13.0.1/node_modules/@serialport/bindings-cpp/build/Release/bindings.node" \
              "/ROOT/workspace/projects/node_modules/.pnpm/@serialport+bindings-cpp@13.0.1/node_modules/@serialport/bindings-cpp/build/Release/" 2>/dev/null || true
        echo "SerialPort bindings copied to /ROOT"
    fi
}

echo "Clearing port ${PORT} before start."
kill_port_if_listening
fix_serialport_bindings
echo "Starting HTTP service on port ${PORT} for dev..."

PORT=$PORT pnpm tsx watch src/server.ts
