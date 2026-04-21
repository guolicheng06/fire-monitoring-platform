# 商业综合体消防智能监控平台

基于 Next.js 16 + React 19 + TypeScript 的智能消防监控平台，支持多种设备接入、实时报警、数据可视化、AI 风险评估和多用户权限管理。

## 功能特性

### 核心功能
- **设备监控**：支持 TCP/RS485/4G/云平台等多种设备接入方式
- **实时报警**：WebSocket 实时推送，及时响应火灾和燃气泄漏
- **数据可视化**：历史数据曲线图，设备状态一目了然
- **AI 助手**：智能问答，消防安全知识随时查询
- **任务管理**：工单派发、接收、处理全流程管理
- **安全意识**：消防安全知识库、逃生指南、案例警示

### 支持的设备
- **瑶安 YA-K300-S**：可燃气体探测器（TCP/RS485/4G/云平台）
- **海湾 GST**：火灾报警控制器
- **Modbus TCP**：通用 Modbus TCP 协议设备
- **模拟设备**：测试用虚拟设备

### 用户角色
- 管理员：系统配置、用户管理
- 物业管理员：设备管理、报警处理
- 施工员：设备安装、维护
- 业主：查看设备状态
- 访客：基础浏览

## 技术栈

| 技术 | 说明 |
|------|------|
| Next.js 16 | React 框架（App Router） |
| React 19 | UI 库 |
| TypeScript 5 | 类型安全 |
| Supabase | PostgreSQL 数据库 |
| WebSocket | 实时通信 |
| shadcn/ui | UI 组件库 |
| Tailwind CSS 4 | 样式框架 |
| Coze SDK | AI 智能助手 |

## 快速开始

### 环境要求
- Node.js 18+
- pnpm 8+
- PostgreSQL 数据库（使用 Supabase）

### 安装依赖

```bash
pnpm install
```

### 配置环境变量

```bash
# 复制环境变量示例
cp .env.example .env.local

# 编辑 .env.local，填入你的 Supabase 配置
```

### 启动开发服务器

```bash
pnpm dev
```

打开 http://localhost:5000 查看效果。

### 构建生产版本

```bash
pnpm build
pnpm start
```

## 部署到 Vercel

### 方法一：GitHub 集成（推荐）

1. 将代码推送到 GitHub 仓库
2. 访问 [Vercel](https://vercel.com)
3. 点击 "Import Project"
4. 选择你的 GitHub 仓库
5. 配置环境变量：
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
6. 点击 "Deploy"

### 方法二：命令行部署

```bash
# 安装 Vercel CLI
npm i -g vercel

# 登录
vercel login

# 部署
vercel
```

## 设备接入

### TCP 连接（瑶安 YA-K300-S）
```typescript
{
  type: 'yak300_tcp',
  name: '厨房燃气探测器',
  ip: '192.168.1.100',
  port: 502,
  unitId: 1
}
```

### RS485 连接（Modbus RTU）
```typescript
{
  type: 'yak300_rtu',
  name: '厨房燃气探测器',
  path: '/dev/ttyUSB0',
  baudRate: 9600,
  unitId: 1
}
```

### 4G 模块连接
```typescript
{
  type: 'yak300_4g',
  name: '厨房燃气探测器',
  guid: 'D2D19D04AF5E433E9C4BFCC4',
  apiUrl: 'https://api.yaoankj.com',
  apiKey: 'your_api_key'
}
```

### 云平台连接
```typescript
{
  type: 'yak300_cloud',
  name: '瑶安云平台设备',
  apiUrl: 'https://api.yaoankj.com',
  apiKey: 'your_api_key'
}
```

## 目录结构

```
├── public/                 # 静态资源
├── src/
│   ├── app/                # 页面路由
│   │   ├── api/           # API 接口
│   │   ├── login/         # 登录页面
│   │   ├── page.tsx       # 首页
│   │   └── device-connect/ # 设备接入
│   ├── components/        # React 组件
│   │   └── ui/            # shadcn/ui 组件
│   ├── hooks/             # 自定义 Hooks
│   └── lib/               # 工具库
├── scripts/               # 构建脚本
└── package.json
```

## 数据库

项目使用 Supabase (PostgreSQL)，主要表：

- `customers`：商户信息
- `devices`：设备信息
- `alarm_records`：报警记录
- `users`：用户信息
- `roles`：角色定义
- `tasks`：任务工单
- `task_records`：任务操作记录

初始化数据库后访问 `/api/seed` 导入示例数据。

## 演示账号

| 角色 | 用户名 | 密码 | 姓名 |
|------|--------|------|------|
| 管理员 | admin | admin123 | 系统管理员 |
| 物业 | property | property123 | 物业管理员 |
| 施工员 | tech1 | tech123 | 张工 |
| 施工员 | tech2 | tech123 | 李工 |
| 施工员 | tech3 | tech123 | 王强 |
| 业主 | owner | owner123 | 业主代表 |
| 访客 | guest | guest123 | 访客 |

## License

MIT
