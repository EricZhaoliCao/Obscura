# 更新说明 - 修复 Vercel 部署问题

## 🔧 修复内容

### 问题
```
Error: Function Runtimes must have a valid version
```

### 原因
`vercel.json` 中的 `functions` 配置格式不正确。

### 解决方案

#### 1. 简化 `vercel.json`
**之前**:
```json
{
  "functions": {
    "api/**/*.ts": {
      "runtime": "nodejs20.x"  // ❌ 格式错误
    }
  }
}
```

**现在**:
```json
{
  "buildCommand": "pnpm build:client",
  "outputDirectory": "dist/client",
  "installCommand": "pnpm install",
  "rewrites": [
    {
      "source": "/api/:path*",
      "destination": "/api"
    }
  ]
}
```

Vercel 会自动检测 `api/` 目录下的文件作为 Serverless Functions。

#### 2. 更新 `api/index.ts`
添加正确的 Vercel Serverless Function 导出格式：

```typescript
import type { VercelRequest, VercelResponse } from '@vercel/node';

// ... Express 应用配置 ...

// Vercel Serverless Function handler
export default async (req: VercelRequest, res: VercelResponse) => {
  return app(req as any, res as any);
};
```

#### 3. 添加依赖
在 `package.json` 中添加：
```json
{
  "dependencies": {
    "@vercel/node": "^3.0.0"
  }
}
```

## 📦 更新后的文件

- ✅ `vercel.json` - 简化配置
- ✅ `api/index.ts` - 正确的 Serverless 导出
- ✅ `package.json` - 添加 `@vercel/node`

## 🚀 重新部署步骤

### 方式一：更新 GitHub 仓库

```bash
# 下载并解压新的 Obscura-Vercel-Fixed.zip

# 进入项目目录
cd Obscura-Vercel

# 更新 Git 仓库
git add .
git commit -m "Fix Vercel deployment configuration"
git push
```

Vercel 会自动检测到更新并重新部署。

### 方式二：重新导入

1. 在 Vercel Dashboard 删除旧项目
2. 重新导入 GitHub 仓库
3. 部署

## ✅ 验证部署

部署成功后，检查：

1. **前端**: 访问 `https://你的项目.vercel.app`
2. **API**: 访问 `https://你的项目.vercel.app/api/health`
   - 应该返回: `{"status":"ok"}`

## 📝 技术说明

### Vercel Serverless Functions

Vercel 自动将 `api/` 目录下的文件转换为 Serverless Functions：

```
api/
  index.ts  →  /api
  hello.ts  →  /api/hello
```

每个文件必须导出一个处理函数：

```typescript
export default async (req: VercelRequest, res: VercelResponse) => {
  // 处理请求
};
```

### 路由配置

`vercel.json` 中的 `rewrites` 配置路由规则：

```json
{
  "rewrites": [
    {
      "source": "/api/:path*",
      "destination": "/api"
    }
  ]
}
```

这样所有 `/api/*` 请求都会被转发到 `api/index.ts`。

## 🔍 故障排查

### 如果仍然失败

1. **检查 pnpm-lock.yaml**
   ```bash
   # 删除并重新生成
   rm pnpm-lock.yaml
   pnpm install
   git add pnpm-lock.yaml
   git commit -m "Update pnpm-lock.yaml"
   git push
   ```

2. **检查 Node.js 版本**
   确认 `package.json` 中：
   ```json
   {
     "engines": {
       "node": "20.x"
     }
   }
   ```

3. **查看 Vercel 日志**
   - 在 Vercel Dashboard 中查看详细的构建日志
   - 检查是否有其他错误

### 常见错误

**错误**: `Cannot find module '@vercel/node'`

**解决**:
```bash
pnpm install @vercel/node
git add package.json pnpm-lock.yaml
git commit -m "Add @vercel/node dependency"
git push
```

**错误**: `Build exceeded maximum duration`

**解决**: 
- 清理不必要的依赖
- 检查是否有大文件
- 考虑升级到 Vercel Pro

## 📚 相关文档

- [Vercel Serverless Functions](https://vercel.com/docs/functions)
- [Vercel Configuration](https://vercel.com/docs/projects/project-configuration)
- [QUICK_START.md](./QUICK_START.md)
- [VERCEL_DEPLOYMENT.md](./VERCEL_DEPLOYMENT.md)

## 💡 提示

- Vercel 会自动检测 `api/` 目录
- 不需要在 `vercel.json` 中显式配置 runtime
- 确保所有 API 文件都正确导出 Vercel Function

---

**现在应该可以成功部署了！** 🎉

如果还有问题，请查看 Vercel 的构建日志获取更多信息。
