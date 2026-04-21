# 瑶安 YA-K300-S 设备连接工具

支持通过 RS485 串口、4G 模块和 HTTP 轮询 RS485 连接瑶安 YA-K300-S 可燃气体探测器。

## 快速开始

### 1. 安装依赖

```bash
# 克隆或下载本工具后，进入目录
cd yak300-device-connector

# 安装依赖
npm install
```

### 2. RS485 串口连接 (直接连接)

```bash
# Linux/macOS
node yak300-standalone.js --mode rtu --path /dev/ttyUSB0 --unitId 1

# Windows
node yak300-standalone.js --mode rtu --path COM3 --baudRate 9600
```

### 3. 4G 模块连接

```bash
# 使用模拟数据测试
node yak300-standalone.js --mode 4g --guid D2D19D04AF5E433E9C4BFCC4

# 连接瑶安云平台
node yak300-standalone.js --mode 4g --guid YOUR_GUID --apiUrl https://api.example.com --apiKey YOUR_KEY
```

### 4. HTTP 轮询 RS485 (通过 HTTP API 获取串口数据)

当 RS485 设备通过 RS485 转 WiFi/以太网 模块暴露 HTTP API 时使用：

```bash
# 通过 HTTP API 获取 Modbus RTU 十六进制数据
node yak300-standalone.js --mode http485 --apiUrl http://192.168.1.100:8080/get485

# 直接返回 JSON 格式数据
node yak300-standalone.js --mode http485 --apiUrl http://192.168.1.100:8080/api/gas
```

## 连接模式说明

| 模式 | 说明 | 适用场景 |
|------|------|----------|
| `rtu` | RS485 串口直连 | 电脑直接通过 USB 转 RS485 连接设备 |
| `4g` | 4G 模块连接 | 设备使用 4G 模块，通过瑶安云平台访问 |
| `http485` | HTTP 轮询 RS485 | RS485 设备通过 RS485 转 WiFi/以太网 模块暴露 HTTP API |

## 命令行参数

| 参数 | 说明 | 默认值 |
|------|------|--------|
| `--mode` | 连接模式: `rtu` / `4g` / `http485` | `rtu` |
| `--path` | 串口路径 (RTU 模式) | `/dev/ttyUSB0` |
| `--baudRate` | 波特率 (RTU 模式) | `9600` |
| `--unitId` | 从机地址 (RTU 模式) | `1` |
| `--timeout` | 超时时间(ms) | `5000` |
| `--interval` | 读取间隔(ms, RTU 模式) | `5000` |
| `--guid` | 4G 设备 GUID (4G 模式) | `D2D19D04AF5E433E9C4BFCC4` |
| `--apiUrl` | API 地址 (4G/HTTP485 模式) | 空(模拟数据) |
| `--apiKey` | API 密钥 (4G 模式) | 空 |
| `--pollInterval` | 轮询间隔(ms, 4G/HTTP485 模式) | `30000` / `5000` |

## HTTP API 响应格式 (HTTP 轮询 RS485 模式)

### 格式1: Modbus RTU 十六进制

设备返回原始的 Modbus RTU 响应十六进制字符串：

```json
{
  "hex": "0103001400FA02E8000000000000000000640019003200"
}
```

### 格式2: 直接 JSON

设备直接返回解析后的数据：

```json
{
  "concentration": 15.5,
  "status": 0,
  "alarmStatus": 0,
  "temperature": 25.5,
  "gasType": 1,
  "range": 100,
  "lowAlarm": 25,
  "highAlarm": 50
}
```

## 设备寄存器映射

YA-K300-S Modbus RTU 寄存器映射：

| 地址 | 名称 | 说明 |
|------|------|------|
| 0 | 气体浓度 | 实际值 = 读取值 / 10，单位 %LEL |
| 1 | 设备状态 | 0=正常, 1=报警, 2=故障 |
| 2 | 报警状态 | 0=无报警, 1=低报, 2=高报 |
| 3 | 温度 | 实际值 = 读取值 / 10，单位 ℃ |
| 4 | 气体类型 | 1=甲烷, 2=丙烷, 3=丁烷... |
| 5 | 量程上限 | 默认 100 (100%LEL) |
| 6 | 低报阈值 | 默认 25 (%LEL) |
| 7 | 高报阈值 | 默认 50 (%LEL) |

## 常见问题

### 1. 串口权限问题 (Linux)

```bash
# 添加用户到 dialout 组
sudo usermod -a -G dialout $USER

# 重新登录后生效
```

### 2. 安装串口驱动 (Windows)

下载并安装 CH340/CH341 串口驱动：
- https://www.wch.cn/downloads/CH341SER_EXE.html

### 3. 串口被占用

确保串口没有被其他程序占用，如 Arduino IDE、SecureCRT 等。

### 4. 4G 设备离线

- 检查设备电源
- 检查 4G 信号强度
- 确认设备已正确配置并连接到瑶安云平台

### 5. HTTP 轮询 RS485 失败

- 检查 HTTP API 地址是否正确
- 确认 RS485 转 WiFi/以太网 模块已正确配置
- 检查网络连接是否正常
- 验证 HTTP API 返回的数据格式

## 示例输出

### RS485 串口模式

```
===========================================
  瑶安 YA-K300-S 设备连接工具
===========================================
  连接模式: RS485 串口
===========================================

[RS485] 初始化设备连接...
  串口路径: /dev/ttyUSB0
  波特率: 9600
  从机地址: 1

[RS485] 串口 /dev/ttyUSB0 已打开
[RS485] 开始读取数据 (按 Ctrl+C 退出)...

-------------------------------------------
[2024-01-15T10:30:45.123Z]
  气体浓度: 15.3%LEL
  设备状态: 正常
  报警状态: 无报警
  温度: 25.6℃
  气体类型: 甲烷
  低报阈值: 25%LEL
  高报阈值: 50%LEL
-------------------------------------------
```

### HTTP 轮询 RS485 模式

```
===========================================
  瑶安 YA-K300-S 设备连接工具
===========================================
  连接模式: HTTP 轮询 RS485
===========================================

[HTTP-RS485] 初始化设备连接...
  API地址: http://192.168.1.100:8080/get485
  轮询间隔: 5000ms

[HTTP-RS485] 设备已连接
[HTTP-RS485] 开始轮询数据 (按 Ctrl+C 退出)...

-------------------------------------------
[2024-01-15T10:30:45.123Z]
  气体浓度: 15.3%LEL
  设备状态: 正常
  报警状态: 无报警
  温度: 25.6℃
  气体类型: 甲烷
  低报阈值: 25%LEL
  高报阈值: 50%LEL
-------------------------------------------
```

## 许可证

MIT
