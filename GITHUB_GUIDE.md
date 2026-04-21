# GitHub 上传指南

## 前置准备

1. **注册 GitHub 账号**
   - 访问 https://github.com
   - 点击 "Sign up" 注册账号

2. **安装 Git（如果还没安装）**
   - Windows: https://git-scm.com/download/win
   - macOS: `brew install git`（需要 Homebrew）
   - Linux: `sudo apt install git`

3. **在 GitHub 创建仓库**
   - 登录 GitHub
   - 点击右上角 "+" → "New repository"
   - Repository name: `fire-monitoring-platform`
   - 选择 "Public" 或 "Private"
   - 点击 "Create repository"
   - **重要**：不要勾选 "Initialize this repository with a README"

---

## 上传代码

### 方法一：使用脚本（推荐）

下载并运行我们生成的脚本：

```bash
# Windows
run-github-setup.bat

# Linux/macOS
chmod +x run-github-setup.sh
./run-github-setup.sh
```

### 方法二：手动上传

打开终端，进入项目目录，执行以下命令：

```bash
# 1. 初始化 Git 仓库
git init

# 2. 添加所有文件
git add .

# 3. 提交代码
git commit -m "Initial commit: 商业综合体消防智能监控平台"

# 4. 添加远程仓库（替换为你的仓库地址）
git remote add origin https://github.com/你的用户名/fire-monitoring-platform.git

# 5. 推送到 GitHub
git push -u origin main
```

**注意**：
- 如果提示 "src refspec main does not match"，说明默认分支不是 main，执行：
  ```bash
  git branch -M main
  ```

- 如果提示 "remote origin already exists"，说明已经添加过，执行：
  ```bash
  git remote set-url origin https://github.com/你的用户名/fire-monitoring-platform.git
  ```

---

## 在 Vercel 部署

代码上传到 GitHub 后：

1. 访问 https://vercel.com
2. 用 GitHub 账号登录
3. 点击 "Import Project"
4. 选择你的仓库 `fire-monitoring-platform`
5. 配置环境变量：
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
6. 点击 "Deploy"
7. 等待部署完成，获取公网访问地址

---

## 常见问题

### Q: 推送时提示需要登录 GitHub
**A**: 在终端执行 `git credential-osxkeychain erase` 清除缓存，然后重新推送，会提示输入用户名和密码（或 Personal Access Token）。

### Q: 如何生成 Personal Access Token？
1. GitHub → Settings → Developer settings → Personal access tokens
2. 点击 "Generate new token"
3. 勾选 `repo` 权限
4. 生成后复制 Token（只显示一次）
5. 推送时用户名输入 GitHub 用户名，密码输入 Token

### Q: 不想公开代码怎么办？
**A**: 创建仓库时选择 "Private"，只有你自己能看到代码。

---

## 项目信息

**项目名称**：商业综合体消防智能监控平台
**技术栈**：Next.js 16 + React 19 + TypeScript + Supabase
**功能**：设备监控、报警管理、任务派发、AI助手
