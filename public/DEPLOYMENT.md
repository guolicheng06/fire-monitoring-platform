# 商业综合体消防智能监控平台 - 本地部署指南

## 项目概述

这是一个基于 Next.js 16 + React 19 + TypeScript + Supabase 的商业综合体消防智能监控平台。

## 技术栈

- **框架**: Next.js 16 (App Router)
- **前端**: React 19, TypeScript 5
- **UI组件**: shadcn/ui, Tailwind CSS 4
- **数据库**: Supabase (PostgreSQL)
- **实时通信**: WebSocket
- **设备连接**: Modbus TCP/RTU, 4G模块
- **图表库**: Recharts

## 前置要求

### 1. 环境要求

- Node.js 24.x 或更高版本
- pnpm 9.0.0 或更高版本
- Git (可选，用于版本控制)

### 2. 数据库要求

- Supabase 账户 或 本地 PostgreSQL 数据库

## 快速开始

### 第一步：解压项目文件

将收到的项目压缩包解压到目标目录：

```bash
# Windows
解压到 C:\Projects\fire-monitoring-platform

# Linux/macOS
unzip fire-monitoring-platform.zip -d ~/projects/fire-monitoring-platform
cd ~/projects/fire-monitoring-platform
```

### 第二步：安装依赖

使用 pnpm 安装项目依赖：

```bash
# 进入项目目录
cd fire-monitoring-platform

# 安装依赖
pnpm install
```

**注意**: 如果安装过程中遇到问题，特别是 serialport 相关模块，可能需要编译原生模块：

```bash
# 如果 postinstall 脚本没有自动执行
node scripts/postinstall.js
```

### 第三步：配置环境变量

复制环境变量示例文件：

```bash
# 复制环境变量模板
cp .env.example .env.local
```

编辑 `.env.local` 文件，填入你的配置：

```env
# Supabase 配置
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# 其他配置
COZE_API_KEY=your-coze-api-key (可选)
```

### 第四步：初始化数据库

#### 方式一：使用 Supabase

1. 在 Supabase 创建新项目
2. 运行数据库初始化脚本（参考项目中的数据库 schema）
3. 访问初始化 API 创建测试数据：

```bash
# 启动开发服务器后访问
curl -X POST http://localhost:5000/api/seed
curl -X POST http://localhost:5000/api/auth/init?force=true
```

#### 方式二：使用本地 PostgreSQL

1. 安装 PostgreSQL
2. 创建数据库
3. 运行 SQL 初始化脚本
4. 更新 .env.local 中的数据库连接信息

### 第五步：启动开发服务器

```bash
# 启动开发服务器
pnpm dev

# 服务器将在 http://localhost:5000 启动
```

访问 http://localhost:5000 查看应用。

## 测试账号

项目包含以下测试账号：

| 角色 | 用户名 | 密码 | 说明 |
|------|--------|------|------|
| 管理员 | admin | admin123 | 系统管理员，拥有所有权限 |
| 物业管理员 | property | property123 | 物业管理人员 |
| 施工员1 | tech1 | tech123 | 施工员张明 |
| 施工员2 | tech2 | tech123 | 施工员李华 |
| 施工员3 | tech3 | tech123 | 施工员王强 |
| 业主(老街火锅) | owner1 | owner123 | 商户业主 |
| 业主(川味小馆) | owner2 | owner123 | 商户业主 |

## 项目结构

```
fire-monitoring-platform/
├── public/                 # 静态资源
│   ├── drivers/           # 设备驱动程序
│   └── yak300-standalone.js # 独立设备连接工具
├── src/
│   ├── app/               # Next.js App Router 页面
│   │   ├── api/          # API 路由
│   │   ├── page.tsx      # 首页
│   │   └── ...
│   ├── components/        # React 组件
│   │   ├── ui/           # shadcn/ui 组件库
│   │   ├── app-shell.tsx # 应用外壳
│   │   └── ...
│   ├── lib/              # 工具库
│   │   ├── safety-knowledge.ts # 消防安全知识库
│   │   ├── db-operations.ts    # 数据库操作
│   │   └── ...
│   └── storage/          # 数据库相关
├── scripts/              # 构建和部署脚本
├── .coze/               # Coze 配置文件
├── .env.example         # 环境变量示例
├── package.json         # 项目依赖
├── tsconfig.json        # TypeScript 配置
└── next.config.ts       # Next.js 配置
```

## 生产部署

### 构建生产版本

```bash
# 构建生产版本
pnpm build

# 启动生产服务器
pnpm start
```

### 使用 PM2 管理进程（推荐）

```bash
# 安装 PM2
npm install -g pm2

# 使用 PM2 启动
pm2 start "pnpm start" --name fire-monitoring

# 查看状态
pm2 status

# 查看日志
pm2 logs fire-monitoring

# 设置开机自启
pm2 startup
pm2 save
```

## 常见问题

### 1. pnpm 未找到

```bash
# 安装 pnpm
npm install -g pnpm
```

### 2. 依赖安装失败

```bash
# 清除缓存后重试
pnpm store prune
rm -rf node_modules
pnpm install
```

### 3. 串口模块编译失败

```bash
# 安装编译工具
# Windows: 安装 Visual Studio Build Tools
# Linux: sudo apt-get install build-essential
# macOS: xcode-select --install

# 重新编译
node scripts/postinstall.js
```

### 4. 数据库连接失败

- 检查 .env.local 中的数据库配置是否正确
- 确认 Supabase 项目已启动
- 检查网络连接和防火墙设置

### 5. 端口被占用

修改端口或关闭占用端口的程序：

```bash
# 修改 next.config.ts 或使用环境变量
# 或查找并关闭占用 5000 端口的进程
# Windows: netstat -ano | findstr :5000
# Linux/macOS: lsof -i :5000
```

## 功能模块说明

### 1. 消防安全意识模块
- 知识库：60+条消防安全知识
- 逃生指南：8个场景的逃生指导
- 案例警示：17个真实火灾案例
- 隐患自查：24项安全检查
- 每日提示：60条日常安全提醒

### 2. 设备管理
- 燃气设备监控
- 火灾报警设备
- 设备接入配置
- 真实设备连接（Modbus/RS485/4G）

### 3. 任务管理
- 任务创建和分配
- 施工员任务接收和处理
- 任务状态跟踪
- 操作记录

### 4. AI智能助手
- 消防安全知识问答
- 报警处理指导
- 设备维护建议

## 技术支持

如有问题，请查看：
1. 项目 README.md
2. AGENTS.md（开发规范）
3. 日志文件：logs/ 目录

## 更新日志

### v1.0.0
- 初始版本发布
- 完整的消防监控平台功能
- 消防安全意识模块
- 三个施工员账号支持
