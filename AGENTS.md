# 项目上下文

### 版本技术栈

- **Framework**: Next.js 16 (App Router)
- **Core**: React 19
- **Language**: TypeScript 5
- **UI 组件**: shadcn/ui (基于 Radix UI)
- **Styling**: Tailwind CSS 4
- **数据库**: Supabase (PostgreSQL)
- **实时通信**: WebSocket

## 目录结构

```
├── public/                 # 静态资源
├── scripts/                # 构建与启动脚本
│   ├── build.sh            # 构建脚本
│   ├── dev.sh              # 开发环境启动脚本
│   ├── prepare.sh          # 预处理脚本
│   ├── postinstall.js      # 安装后脚本（编译bindings-cpp）
│   └── start.sh            # 生产环境启动脚本
├── src/
│   ├── app/                # 页面路由与布局
│   │   ├── api/            # API路由
│   │   │   ├── customers/  # 商户API
│   │   │   ├── devices/    # 设备API
│   │   │   ├── alarms/     # 报警API
│   │   │   └── seed/        # 数据初始化API
│   │   ├── page.tsx        # 主监控页面
│   │   └── safety-awareness/ # 消防安全意识模块
│   ├── components/
│   │   ├── ui/            # Shadcn UI 组件库
│   │   └── ai-assistant/   # AI智能助手组件
│   ├── hooks/              # 自定义 Hooks
│   ├── lib/                # 工具库
│   │   ├── utils.ts        # 通用工具函数 (cn)
│   │   ├── db-operations.ts # 数据库操作
│   │   ├── device-manager.ts # 设备管理器
│   │   ├── ws-client.ts    # WebSocket客户端
│   │   └── safety-knowledge.ts # 消防安全知识库
│   ├── ws-handlers/        # WebSocket处理器
│   │   └── alarm.ts        # 报警WebSocket处理
│   └── server.ts           # 自定义服务端入口
├── next.config.ts          # Next.js 配置
├── package.json            # 项目依赖管理
└── tsconfig.json           # TypeScript 配置
```

## 核心功能

### 1. 消防安全意识提升模块 (safety-awareness)

为提升用户消防安全意识，平台提供了综合性的安全教育功能。

#### 功能页面: `/safety-awareness`

**主要功能**:

1. **首页**
   - 今日消防安全提示（每日自动更新）
   - 功能入口快捷导航
   - 重要防火知识展示
   - 逃生指南预览

2. **知识库** (`/safety-awareness` - 知识库Tab)
   - 分类浏览：火灾预防、灭火器使用、逃生知识、用电安全、燃气安全、日常防火等10个分类
   - 搜索功能：支持按标题、内容、标签搜索
   - 知识详情弹窗：展示完整内容和标签
   - 重要知识标记：高重要性知识有特殊标识

3. **逃生指南** (`/safety-awareness` - 逃生指南Tab)
   - 多种场景指南：家庭火灾、公共场所、高楼、地下建筑、车辆火灾
   - 详细步骤说明：清晰的逃生步骤指引
   - 注意事项提示：逃生过程中的关键提醒

4. **案例警示** (`/safety-awareness` - 案例警示Tab)
   - 真实火灾案例展示：哈尔滨酒店、北京长峰医院、浙江厂房等案例
   - 伤亡和损失统计
   - 事故原因分析
   - 教训启示总结

5. **隐患自查** (`/safety-awareness` - 隐患自查Tab)
   - 互动式隐患排查清单：12个常见隐患检查项
   - 分类：用电安全、燃气安全、消防设施、日常生活、逃生准备
   - 评分反馈：每个选项都有具体改进建议
   - 总分评估：根据回答计算安全得分（优秀/良好/一般/较差）

6. **每日提示** (`/safety-awareness` - 每日提示Tab)
   - 31条消防安全提示，每天自动更新
   - 涵盖：出门断电、厨房防火、燃气检查、通道畅通等日常安全知识

**知识数据文件**: `src/lib/safety-knowledge.ts`
- 包含30+条消防安全知识
- 5个逃生指南场景
- 6个真实火灾案例
- 12项隐患自查清单
- 31条每日提示

### 2. 设备接入服务 (device-manager.ts)
- **MockModbusDevice**: 模拟Modbus TCP协议设备
- **DeviceManager**: 设备管理器，负责轮询设备状态
- 支持设备类型：
  - `gas_detector`: 可燃气体探测器
  - `temperature_detector`: 温度探测器
  - `smoke_detector`: 烟雾探测器
  - `fire_alarm`: 火灾报警器

### 2. 真实设备接入

#### 瑶安 YA-K300-S 可燃气体探测器

**TCP连接模式**:
- **协议**: Modbus TCP
- **文件**: `src/lib/yak300.ts`
- **配置项**:
  - 气体浓度寄存器地址: 0 (实际值 = 读取值 / 10, 单位 %LEL)
  - 设备状态寄存器地址: 1 (0=正常, 1=报警, 2=故障)
  - 报警状态寄存器地址: 2 (0=无报警, 1=低报, 2=高报)
  - 温度寄存器地址: 3
- **连接配置**: IP地址、端口(默认502)、从机地址(Unit ID)、超时时间

**RS485串口连接模式**:
- **协议**: Modbus RTU (RS485转USB)
- **文件**: `src/lib/yak300-rtu.ts`
- **配置项**:
  - 串口参数: 波特率(默认9600)、数据位(8)、停止位(1)、校验位(无)
  - 从机地址: 1
  - 寄存器映射同TCP模式
- **连接配置**: 串口路径(COM3或/dev/ttyUSB0)、超时时间
- **驱动程序**: 
  - 文件: `public/drivers/CH341SER.EXE`
  - 下载地址: `/drivers/CH341SER.EXE`
  - 用途: CH340/CH341 RS485转USB接口驱动程序
- **寄存器映射**:
  - 地址0: 气体浓度 (实际值=读取值/10, 单位%LEL)
  - 地址1: 设备状态 (0=正常, 1=报警, 2=故障)
  - 地址2: 报警状态 (0=无报警, 1=低报, 2=高报)
  - 地址3: 温度值 (实际值=读取值/10, 单位℃)
  - 地址4: 气体类型 (1=甲烷, 2=丙烷, 等)
  - 地址5: 量程上限 (默认100)
  - 地址6: 低报阈值 (默认25)
  - 地址7: 高报阈值 (默认50)

**4G模块连接模式**:
- **协议**: HTTP API轮询
- **文件**: `src/lib/yak300-4g.ts`
- **配置项**:
  - 设备GUID (如 D2D19D04AF5E433E9C4BFCC4)
  - API服务器地址（瑶安云平台）
  - API密钥
  - 轮询间隔(默认30000ms)
  - 超时时间(默认10000ms)
  - 设备类型: gas(气体)/temperature(温度)/smoke(烟雾)/multi(复合)
- **数据获取方式**:
  - HTTP API轮询瑶安云平台
  - 直接HTTP请求到4G模块本地API
  - 无API配置时使用模拟数据
- **返回数据**:
  - guid: 设备GUID
  - deviceCode: 设备编码
  - deviceType: 设备类型
  - status: 设备状态 (0=正常, 1=报警, 2=故障)
  - alarmStatus: 报警状态 (0=无报警, 1=低报, 2=高报)
  - concentration: 气体浓度 (%LEL)
  - temperature: 温度值 (℃)
  - humidity: 湿度值 (%)
  - signalStrength: 4G信号强度 (0-31)
  - batteryVoltage: 电池电压 (V)
  - lastUpdate: 最后更新时间

#### 海湾 GST 火灾报警控制器
- **协议**: Modbus TCP
- **文件**: `src/lib/gst-fire-alarm.ts`
- **支持型号**:
  - JB-QB-GST200 小型火灾报警控制器
  - JB-QG-GST5000 火灾报警控制器(琴台)
  - JB-M-GST100 火灾报警控制器(壁挂)
  - GST-NT9280 网络火灾报警控制器
- **配置项**:
  - 控制器状态寄存器地址: 0
  - 报警数量寄存器地址: 1
  - 故障数量寄存器地址: 2
  - 回路数寄存器地址: 3
- **连接配置**: IP地址、端口(默认502)、从机地址(Unit ID)、超时时间

#### 设备接入页面 (`/device-connect`)
- 支持添加/编辑设备
- 支持测试连接功能
- 支持设备验收功能(基于GB国家标准)
- 统计展示：设备总数、瑶安设备、海湾GST、其他Modbus、已启用设备

### 3. WebSocket实时通信
- **/ws/alarm**: 报警推送通道
  - 新报警: `alarm:new`
  - 报警列表: `alarm:list`
  - 确认报警: `alarm:acknowledge`
  - 处理报警: `alarm:resolve`
- **/ws/device**: 设备数据通道

### 4. 数据库表结构
- **customers**: 商户表
- **devices**: 设备表
- **alarm_records**: 报警记录表
- **maintenance_records**: 维护记录表

### 5. AI智能助手
- **智能体ID**: `7620784551534739507`
- **接入方式**: Coze Web SDK iframe嵌入
- **组件位置**: `src/components/ai-assistant/`
- **功能**:
  - 消防安全知识问答
  - 报警处理指导
  - 设备维护建议
  - 安全隐患排查

## 本地设备连接工具

### 独立运行脚本 (yak300-standalone.js)

为方便本地直接连接真实设备，创建了独立的设备连接工具：

**文件位置**: `public/yak300-standalone.js`

**支持功能**:
- RS485 串口连接 (Modbus RTU)
- 4G 模块连接 (HTTP API)
- HTTP 轮询 RS485 (通过 HTTP API 获取 Modbus RTU 数据)
- 模拟数据测试模式

**使用方法**:

```bash
# RS485 连接 (Linux/macOS)
node yak300-standalone.js --mode rtu --path /dev/ttyUSB0 --unitId 1

# RS485 连接 (Windows)
node yak300-standalone.js --mode rtu --path COM3 --baudRate 9600

# 4G 模块连接 (模拟数据)
node yak300-standalone.js --mode 4g --guid D2D19D04AF5E433E9C4BFCC4

# 4G 模块连接 (瑶安云API)
node yak300-standalone.js --mode 4g --guid YOUR_GUID --apiUrl https://api.example.com --apiKey YOUR_KEY

# HTTP 轮询 RS485 (通过 HTTP API 获取 Modbus RTU 十六进制数据)
node yak300-standalone.js --mode http485 --apiUrl http://192.168.1.100:8080/get485

# HTTP 轮询 RS485 (直接返回 JSON 格式数据)
node yak300-standalone.js --mode http485 --apiUrl http://192.168.1.100:8080/api/gas
```

**HTTP API 响应格式 (HTTP 轮询 RS485 模式)**:
- 格式1: Modbus RTU 十六进制字符串 - `{"hex": "0103001400FA02E8..."}`
- 格式2: 直接 JSON - `{"concentration": 15.5, "status": 0, "alarmStatus": 0, "temperature": 25.5}`

**快速启动脚本**:
- Linux/macOS: `public/run.sh`
- Windows: `public/run.bat`

**相关文件**:
- `public/yak300-standalone.js` - 独立连接脚本
- `public/package.json` - 依赖配置
- `public/README.md` - 使用说明
- `public/run.sh` / `public/run.bat` - 快速启动脚本

## 初始化数据

首次部署后访问 `/api/seed` 初始化示例数据：
```bash
curl -X POST http://localhost:5000/api/seed
```

## 开发规范

### Hydration 问题防范

1. 严禁在 JSX 渲染逻辑中直接使用 typeof window、Date.now()、Math.random() 等动态数据。**必须使用 'use client' 并配合 useEffect + useState 确保动态内容仅在客户端挂载后渲染**；同时严禁非法 HTML 嵌套（如 <p> 嵌套 <div>）。
2. **禁止使用 head 标签**，优先使用 metadata，详见文档：https://nextjs.org/docs/app/api-reference/functions/generate-metadata
   1. 三方 CSS、字体等资源可在 `globals.css` 中顶部通过 `@import` 引入或使用 next/font
   2. preload, preconnect, dns-prefetch 通过 ReactDOM 的 preload、preconnect、dns-prefetch 方法引入
   3. json-ld 可阅读 https://nextjs.org/docs/app/guides/json-ld

## 串口模块 (bindings-cpp) 兼容性问题修复

### 问题描述
`@serialport/bindings-cpp@13.0.1` 的预编译二进制文件不包含 Node.js 24.x (abi=137) 版本，导致 RS485 串口设备连接测试失败，错误消息为 "No native build was found"。

### 解决方案
1. 使用 `npm rebuild` 重新编译 @serialport/bindings-cpp 模块
2. 将编译后的 `.node` 文件复制到 `/ROOT/node_modules/` 目录
3. 在 `package.json` 中添加 `postinstall` 脚本自动执行这些操作

### 关键决策

- 添加 pnpm overrides 强制使用 @serialport/bindings-cpp@13.0.1 版本以兼容 Node.js 24.x
- 修复串口模块 bindings-cpp 与 pnpm 路径兼容性问题，通过创建目录并复制编译后的 .node 文件
- RS485 串口测试支持模拟模式（路径为空或'MOCK'时使用模拟数据）
- 4G 模块测试支持模拟模式（GUID为空时使用默认GUID）
- 修改构建脚本，将串口相关模块（modbus-serial、@serialport/bindings-cpp等）标记为 external，避免打包进 bundle
- 新增 HTTP 轮询 RS485 连接模式 (http485)，支持通过 HTTP API 获取 Modbus RTU 数据
- 独立脚本支持自动安装依赖，首次运行自动检测并安装 serialport 模块

### 核心文件修改
- edit: package.json (添加 postinstall、rebuild-serialport、setup-root-modules 脚本)
- edit: src/lib/yak300-rtu.ts (添加模拟测试支持，优化错误处理)
- edit: src/app/api/devices/test-connection/route.ts (支持空路径和空GUID的模拟测试)
- edit: src/app/device-connect/page.tsx (移除测试按钮的必填验证)
- edit: scripts/build.sh (添加 external 配置)
- create: public/drivers/CH341SER.EXE (CH341串口驱动)
- edit: public/yak300-standalone.js (添加 HTTP 轮询 RS485 模式、自动安装依赖)
- edit: public/package.json (添加 @serialport/parser-byte-length 依赖、http485 脚本)
- edit: public/README.md (添加 HTTP 轮询 RS485 模式说明)

### 问题修复记录
- 问题: RS485 串口测试连接失败，显示"串口模块未找到兼容版本"
  - 解决方案: 
    1. 安装node-gyp和node-addon-api依赖
    2. 使用node-gyp rebuild重新编译@serialport/bindings-cpp模块
    3. 创建scripts/postinstall.js脚本，自动将编译后的bindings复制到/ROOT/node_modules/目录
    4. 添加node-gyp-build依赖
    5. 验证模拟模式和真实设备连接模式都能正常工作
- 问题: RS485 串口测试连接失败，显示"串口模块未安装或需要重新编译"
  - 解决方案: 添加 postinstall 脚本重新编译 bindings-cpp 模块，并复制到 /ROOT 目录
- 问题: 独立脚本 yak300-standalone.js 无法直接连接 Modbus RTU 设备
  - 解决方案: 添加自动安装依赖逻辑，首次运行自动检测并安装 serialport 模块；添加 HTTP 轮询 RS485 模式作为替代方案
- 问题: 独立脚本需要额外配置才能使用
  - 解决方案: 添加 @serialport/parser-byte-length 依赖，更新 package.json scripts

## 任务管理功能

### 数据库表结构

**tasks 表**：存储任务信息
- `id`: UUID，主键
- `task_code`: VARCHAR(50)，唯一任务编号，如 TASK-0001
- `title`: VARCHAR(255)，任务标题
- `description`: TEXT，任务描述
- `location`: VARCHAR(255)，任务地点
- `priority`: VARCHAR(20)，优先级 (high/medium/low)
- `status`: VARCHAR(20)，状态 (pending/received/processing/completed/cancelled)
- `assignee_id`: UUID，执行人ID
- `assignee_name`: VARCHAR(100)，执行人姓名
- `creator_id`: UUID，创建人ID
- `creator_name`: VARCHAR(100)，创建人姓名
- `deadline`: TIMESTAMP，截止时间
- `customer_id`: UUID，关联商户ID
- `device_id`: UUID，关联设备ID

**task_records 表**：记录任务的所有操作历史
- `id`: UUID，主键
- `task_id`: UUID，关联任务ID
- `action`: VARCHAR(50)，操作类型 (created/assigned/received/started/completed/cancelled)
- `operator_id`: UUID，操作人ID
- `operator_name`: VARCHAR(100)，操作人姓名
- `operator_role`: VARCHAR(50)，操作人角色
- `content`: TEXT，操作说明/备注
- `old_status`: VARCHAR(20)，变更前的状态
- `new_status`: VARCHAR(20)，变更后的状态
- `created_at`: TIMESTAMP，创建时间

### 任务状态流转

```
pending → received → processing → completed
                 ↘ cancelled
```

- **pending (待接收)**：任务已创建，等待执行人接收
- **received (已接收)**：执行人已接收任务
- **processing (处理中)**：执行人正在处理任务
- **completed (已完成)**：任务已完成
- **cancelled (已取消)**：任务被取消

### API 接口

| 接口 | 方法 | 说明 |
|------|------|------|
| `/api/tasks` | GET | 获取任务列表 |
| `/api/tasks` | POST | 创建新任务 |
| `/api/tasks/receive` | POST | 施工员接收任务 |
| `/api/tasks/update` | PUT | 更新任务状态 |
| `/api/tasks/records` | GET | 获取任务操作记录 |

### 功能特点

1. **多端可见**：所有用户都能看到所有任务，施工员只能接收和处理分配给自己的任务
2. **操作记录**：每次任务状态变更都会记录到 task_records 表
3. **实时更新**：施工员接收任务后，其他端（如管理员）可以立即看到任务状态变化

## TODO
- [x] 修复RS485串口连接功能，使bindings-cpp模块能在Node.js 24.x环境下正常工作
  - 完成: 安装node-gyp和node-addon-api依赖
  - 完成: 使用node-gyp rebuild编译@serialport/bindings-cpp模块
  - 完成: 创建postinstall.js脚本，自动将编译后的bindings复制到/ROOT/node_modules/目录
  - 完成: 添加node-gyp-build依赖以支持node-gyp-build查找预编译二进制文件
  - 完成: 测试验证RS485模拟模式和真实设备连接模式都能正常工作
- [x] 验证导出的独立连接脚本是否支持直接连接 MODBUS RTU 设备
  - 完成: 添加了自动安装依赖逻辑，首次运行自动检测并安装 serialport 模块
  - 完成: 添加了 HTTP 轮询 RS485 模式 (http485)，作为 RS485 直连的替代方案
  - 完成: 更新了 package.json 和 README.md，添加了详细的使用说明
- [x] 添加消防安全意识提升功能模块
  - 完成: 创建 `/safety-awareness` 页面
  - 完成: 实现知识库、逃生指南、案例警示、隐患自查、每日提示等功能
  - 完成: 添加导航入口
