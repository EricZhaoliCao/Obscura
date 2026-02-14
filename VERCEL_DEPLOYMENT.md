# Obscura - Vercel 部署版本

这是 Obscura 项目的 Vercel Serverless 版本，已移除账号系统和 OAuth 认证，使用 Serverless Functions 架构。

## 主要变更

### 已移除的功能
- ✅ Manus OAuth 认证系统
- ✅ Google OAuth 认证系统
- ✅ Passport.js 认证中间件
- ✅ Express Session 管理
- ✅ MySQL/TiDB 数据库依赖
- ✅ Drizzle ORM 数据库层

### 新增功能
- ✅ 内存数据存储（适合演示和开发）
- ✅ 自动使用默认演示用户
- ✅ 简化的前端路由（无需登录）
- ✅ Vercel Serverless Functions 架构
- ✅ 优化的构建配置

## 架构说明

### Serverless 架构
- **前端**: 静态文件部署到 Vercel CDN
- **后端**: tRPC API 运行在 Vercel Serverless Functions
- **数据**: 内存存储（每个请求独立，适合演示）

### 文件结构
```
obscura/
├── api/
│   └── index.ts          # Vercel Serverless Function 入口
├── client/               # 前端代码
├── server/               # 后端业务逻辑
├── dist/client/          # 构建输出（前端）
└── vercel.json           # Vercel 配置
```

## 部署到 Vercel

### 方式一：通过 GitHub（推荐）

1. **推送代码到 GitHub**
```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/你的用户名/obscura.git
git push -u origin main
```

2. **在 Vercel 中导入**
   - 访问 [Vercel Dashboard](https://vercel.com/dashboard)
   - 点击 "Add New Project"
   - 选择你的 GitHub 仓库
   - Vercel 会自动检测 `vercel.json` 配置
   - 点击 "Deploy"

3. **等待部署完成**
   - 构建时间约 2-3 分钟
   - 部署成功后会获得一个 `.vercel.app` 域名

### 方式二：通过 Vercel CLI

1. **安装 Vercel CLI**
```bash
npm install -g vercel
```

2. **登录 Vercel**
```bash
vercel login
```

3. **部署项目**
```bash
cd Obscura-Vercel
vercel
```

4. **按照提示操作**
   - 选择项目设置
   - 确认部署

### 方式三：拖拽部署

1. 访问 [Vercel Dashboard](https://vercel.com/dashboard)
2. 将项目文件夹拖拽到浏览器
3. Vercel 会自动上传并部署

## 本地开发

### 安装依赖
```bash
pnpm install
```

如果没有安装 pnpm：
```bash
npm install -g pnpm
```

### 启动开发服务器
```bash
pnpm dev
```

访问 http://localhost:3000

### 本地测试 Vercel 环境
```bash
# 安装 Vercel CLI
npm install -g vercel

# 运行本地 Vercel 环境
vercel dev
```

## 构建

### 构建前端
```bash
pnpm build:client
```

### 构建完整项目（本地测试用）
```bash
pnpm build
```

## 环境变量

### 不需要的环境变量
由于已移除数据库和 OAuth，以下变量不再需要：
- ~~DATABASE_URL~~
- ~~OAUTH_SERVER_URL~~
- ~~GOOGLE_CLIENT_ID~~
- ~~GOOGLE_CLIENT_SECRET~~
- ~~COOKIE_SECRET~~

### 可选环境变量
在 Vercel Dashboard > Settings > Environment Variables 中添加：

```bash
# S3 文件存储（可选）
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_REGION=us-east-1
AWS_S3_BUCKET=your_bucket_name

# AI 功能（可选）
OPENAI_API_KEY=your_openai_api_key
```

## 注意事项

### ⚠️ 数据持久化
当前使用内存存储，每个 Serverless Function 调用都是独立的，数据不会持久化。

**生产环境建议：**
1. **Vercel KV (Redis)** - 适合缓存和会话
   ```bash
   npm install @vercel/kv
   ```

2. **Vercel Postgres** - 适合关系型数据
   ```bash
   npm install @vercel/postgres
   ```

3. **第三方数据库**
   - Supabase（PostgreSQL）
   - PlanetScale（MySQL）
   - MongoDB Atlas

### ⚠️ Serverless 限制
- **执行时间**: 最长 10 秒（Hobby）/ 60 秒（Pro）
- **内存**: 1024 MB（Hobby）/ 3008 MB（Pro）
- **冷启动**: 首次请求可能较慢（1-2秒）

### ⚠️ 多用户支持
当前所有访问者共享同一个演示账号。

**如需多用户功能：**
1. 使用 Vercel KV 存储用户会话
2. 集成第三方认证（Auth0、Clerk）
3. 使用 NextAuth.js

## 性能优化

### 已启用的优化
- ✅ Vercel CDN 全球加速
- ✅ 自动 Gzip/Brotli 压缩
- ✅ HTTP/2 和 HTTP/3
- ✅ 智能缓存策略

### 建议的优化
1. **启用 Edge Functions**（更快的响应）
2. **使用 ISR**（增量静态再生成）
3. **配置缓存头**

## 故障排查

### 构建失败

**问题**: `pnpm install` 失败
```bash
# 解决方案：清理并重新安装
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

**问题**: TypeScript 错误
```bash
# 检查类型错误
pnpm check
```

### 运行时错误

**问题**: API 返回 500 错误
- 检查 Vercel 函数日志
- 查看浏览器控制台
- 确认所有依赖已安装

**问题**: 冷启动慢
- 这是 Serverless 的正常现象
- 考虑升级到 Pro 计划
- 或使用 Edge Functions

### 部署失败

**问题**: Vercel 检测不到配置
- 确认 `vercel.json` 存在
- 检查 JSON 语法是否正确

**问题**: 构建超时
- 减少依赖包大小
- 优化构建脚本
- 升级到 Pro 计划

## 监控和日志

### 查看日志
1. 访问 Vercel Dashboard
2. 选择你的项目
3. 点击 "Deployments"
4. 选择一个部署查看日志

### 性能监控
Vercel 自动提供：
- Web Vitals 监控
- 函数执行时间
- 带宽使用情况

## 自定义域名

### 添加域名
1. 在 Vercel Dashboard 中选择项目
2. 点击 "Settings" > "Domains"
3. 添加你的域名
4. 按照提示配置 DNS

### DNS 配置
```
类型: A
名称: @
值: 76.76.21.21

类型: CNAME
名称: www
值: cname.vercel-dns.com
```

## 技术栈

- **前端**: React 19 + TypeScript + Vite + TailwindCSS
- **后端**: Express + tRPC (Serverless)
- **UI 组件**: Radix UI + shadcn/ui
- **数据存储**: 内存（可扩展）
- **部署**: Vercel Serverless Functions

## 项目结构

```
obscura/
├── api/                  # Vercel Serverless Functions
│   ├── index.ts         # API 入口
│   └── tsconfig.json    # API TypeScript 配置
├── client/              # 前端代码
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   └── App.tsx
│   └── index.html
├── server/              # 后端业务逻辑
│   ├── _core/
│   │   └── context.ts
│   ├── db.ts           # 内存数据库
│   └── routers.ts      # tRPC 路由
├── shared/              # 共享类型和常量
├── drizzle/             # 数据库 Schema（类型定义）
├── dist/client/         # 构建输出
├── package.json
├── vercel.json          # Vercel 配置
└── vite.config.ts
```

## 升级建议

### 从演示到生产

1. **添加数据库**
```bash
# 使用 Vercel Postgres
npm install @vercel/postgres
```

2. **添加认证**
```bash
# 使用 NextAuth.js
npm install next-auth
```

3. **添加缓存**
```bash
# 使用 Vercel KV
npm install @vercel/kv
```

## 支持

### 文档资源
- [Vercel 官方文档](https://vercel.com/docs)
- [Serverless Functions](https://vercel.com/docs/functions)
- [tRPC 文档](https://trpc.io)

### 常见问题
- 查看项目 GitHub Issues
- 访问 Vercel 社区论坛
- 联系项目维护者

## License

MIT

---

**部署愉快！** 🚀
