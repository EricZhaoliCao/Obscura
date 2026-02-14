# Obscura - 快速开始指南

## 🚀 三步部署到 Vercel

### 第一步：推送到 GitHub

```bash
cd Obscura-Vercel
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/你的用户名/obscura.git
git push -u origin main
```

### 第二步：连接 Vercel

1. 访问 https://vercel.com
2. 使用 GitHub 账号登录
3. 点击 "New Project"
4. 选择你的仓库 `obscura`

### 第三步：部署

1. Vercel 会自动检测配置
2. 点击 "Deploy" 按钮
3. 等待 2-3 分钟
4. 完成！🎉

你会获得一个 `https://你的项目.vercel.app` 域名

---

## 💻 本地开发

### 快速启动

```bash
# 安装依赖
pnpm install

# 启动开发服务器
pnpm dev
```

访问 http://localhost:3000

### 使用 Vercel 本地环境

```bash
# 安装 Vercel CLI
npm install -g vercel

# 运行 Vercel 开发环境
vercel dev
```

---

## 📦 项目架构

### Serverless 架构
```
前端 (静态文件)
    ↓
Vercel CDN
    ↓
后端 API (Serverless Functions)
    ↓
内存数据存储
```

### 关键文件
- `api/index.ts` - Serverless Function 入口
- `vercel.json` - Vercel 配置
- `client/` - React 前端
- `server/` - tRPC 后端逻辑

---

## ⚙️ 配置说明

### vercel.json
```json
{
  "buildCommand": "pnpm build:client",  // 只构建前端
  "outputDirectory": "dist/client",      // 输出目录
  "functions": {
    "api/**/*.ts": {
      "runtime": "nodejs20.x"            // Node.js 20
    }
  }
}
```

### 构建脚本
```json
{
  "build:client": "vite build",          // 构建前端
  "dev": "tsx watch server/_core/index.ts"  // 本地开发
}
```

---

## 🔧 环境变量（可选）

在 Vercel Dashboard > Settings > Environment Variables 添加：

```bash
# S3 存储（如需文件上传）
AWS_ACCESS_KEY_ID=xxx
AWS_SECRET_ACCESS_KEY=xxx
AWS_REGION=us-east-1
AWS_S3_BUCKET=xxx

# AI 功能（如需 AI 聊天）
OPENAI_API_KEY=xxx
```

---

## ⚠️ 重要提示

### 数据存储
- ✅ 当前：内存存储（演示用）
- ⚠️ 限制：数据不持久化
- 💡 生产：使用 Vercel KV 或 Postgres

### Serverless 限制
- 执行时间：10 秒（免费）/ 60 秒（Pro）
- 冷启动：首次请求 1-2 秒
- 内存：1024 MB（免费）

### 多用户
- 当前：所有人共享演示账号
- 建议：集成 Auth0 或 Clerk

---

## 🆘 常见问题

### 构建失败？

```bash
# 清理并重装
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

### API 不工作？

1. 检查 `api/index.ts` 是否存在
2. 查看 Vercel 函数日志
3. 确认 `vercel.json` 配置正确

### TypeScript 错误？

```bash
pnpm check
```

---

## 📊 部署检查清单

- [ ] 代码已推送到 GitHub
- [ ] Vercel 项目已创建
- [ ] 构建成功（绿色勾）
- [ ] 网站可访问
- [ ] API 正常工作
- [ ] 环境变量已配置（如需要）

---

## 🎯 下一步

### 自定义域名
1. 在 Vercel 中添加域名
2. 配置 DNS 记录
3. 等待 SSL 证书生成

### 添加数据库
```bash
# Vercel Postgres
npm install @vercel/postgres

# 或 Supabase
npm install @supabase/supabase-js
```

### 添加认证
```bash
# NextAuth.js
npm install next-auth

# 或 Clerk
npm install @clerk/nextjs
```

---

## 📚 学习资源

- [Vercel 文档](https://vercel.com/docs)
- [Serverless Functions](https://vercel.com/docs/functions)
- [tRPC 指南](https://trpc.io/docs)
- [React 文档](https://react.dev)

---

## 💡 提示

### 查看日志
Vercel Dashboard > 你的项目 > Deployments > 选择部署 > View Function Logs

### 性能优化
- 使用 Edge Functions（更快）
- 启用缓存头
- 压缩图片资源

### 成本控制
- 免费计划：100GB 带宽/月
- 升级到 Pro：1TB 带宽/月
- 监控使用量

---

**祝你部署成功！** 🎊

有问题？查看 `VERCEL_DEPLOYMENT.md` 获取详细文档。
