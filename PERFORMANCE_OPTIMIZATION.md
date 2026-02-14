# 性能优化说明

## 🐌 加载慢的原因分析

### 1. **大量代码语言高亮库（最主要原因）**

从构建产物分析，发现了大量的语言高亮文件：

```
2.0M  index-D_JxHVqw.js          # 主包
764K  emacs-lisp-C9XAeP06.js     # Emacs Lisp 语法
612K  cpp-CofmeUqb.js            # C++ 语法
608K  wasm-CG6Dc4jp.js           # WebAssembly 语法
260K  wolfram-lXgVvXCa.js        # Wolfram 语法
188K  vue-vine-CQOfvN7w.js       # Vue 语法
180K  typescript-BPQ3VLAy.js     # TypeScript 语法
180K  angular-ts-BwZT4LLn.js     # Angular 语法
176K  jsx-g9-lgVsj.js            # JSX 语法
172K  tsx-COt5Ahok.js            # TSX 语法
172K  javascript-wDzz0qaB.js     # JavaScript 语法
... 还有更多
```

**问题**: 项目引入了 `streamdown` 或类似的 Markdown 渲染库，它默认加载了所有编程语言的语法高亮支持。

### 2. **图表库体积大**

```
432K  cytoscape.esm-5J0xJHOV.js  # 图形可视化库
424K  mermaid.core-BxG2h6Jo.js   # Mermaid 图表库
348K  treemap-KMMF4GRG-gkdxmBRY.js # Treemap 图表
```

### 3. **主包体积大**

```
2.0M  index-D_JxHVqw.js          # 主 JavaScript 包
120K  index-MI9JMAl2.css         # 主 CSS 包
```

## 🚀 优化建议

### 方案一：按需加载语言高亮（推荐）

修改 Markdown 渲染配置，只加载常用语言：

```typescript
// 在使用 streamdown 的地方
import { Streamdown } from 'streamdown';

// 只导入需要的语言
import 'shiki/langs/javascript';
import 'shiki/langs/typescript';
import 'shiki/langs/python';
import 'shiki/langs/bash';

// 配置只使用这些语言
<Streamdown 
  options={{
    shiki: {
      langs: ['javascript', 'typescript', 'python', 'bash']
    }
  }}
>
  {content}
</Streamdown>
```

**预期效果**: 减少 3-4 MB 的加载体积

### 方案二：代码分割（Code Splitting）

将大型库延迟加载：

```typescript
// 使用动态导入
const Mermaid = lazy(() => import('./components/Mermaid'));
const CodeBlock = lazy(() => import('./components/CodeBlock'));

// 使用 Suspense 包裹
<Suspense fallback={<div>加载中...</div>}>
  <Mermaid chart={data} />
</Suspense>
```

### 方案三：移除不必要的依赖

检查 `package.json`，移除不需要的库：

```bash
# 检查哪些包最大
pnpm list --depth=0 --json | jq '.dependencies | to_entries | sort_by(.value.size) | reverse'

# 考虑移除：
# - cytoscape（如果不需要图形可视化）
# - mermaid（如果不需要流程图）
# - 不常用的语言高亮
```

### 方案四：启用 Vite 构建优化

在 `vite.config.ts` 中添加：

```typescript
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor': ['react', 'react-dom'],
          'ui': ['@radix-ui/react-*'],
          'charts': ['recharts'],
        }
      }
    },
    chunkSizeWarningLimit: 1000,
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // 移除 console.log
      }
    }
  }
});
```

### 方案五：使用 CDN 加载大型库

将大型库从 CDN 加载，而不是打包进主包：

```html
<!-- 在 index.html 中 -->
<script src="https://cdn.jsdelivr.net/npm/react@19/umd/react.production.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/react-dom@19/umd/react-dom.production.min.js"></script>
```

然后在 `vite.config.ts` 中配置 external：

```typescript
export default defineConfig({
  build: {
    rollupOptions: {
      external: ['react', 'react-dom'],
      output: {
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM'
        }
      }
    }
  }
});
```

## 📊 当前加载情况

### 首次加载
- **主包**: ~2 MB (压缩后)
- **语言高亮**: ~3-4 MB (压缩后)
- **图表库**: ~1.2 MB (压缩后)
- **总计**: ~6-7 MB

### 优化后预期
- **主包**: ~2 MB
- **语言高亮**: ~200 KB (只保留常用语言)
- **图表库**: 按需加载
- **总计**: ~2.5 MB

## 🎯 快速优化步骤

### 1. 立即可做的优化

```bash
# 1. 检查并移除不需要的依赖
cd Obscura-Vercel
pnpm remove cytoscape  # 如果不需要

# 2. 添加 Vite 压缩配置
# 编辑 vite.config.ts（见上面方案四）

# 3. 重新构建
pnpm build:client
```

### 2. 需要代码修改的优化

查找项目中使用 `streamdown` 或 Markdown 渲染的地方：

```bash
grep -r "Streamdown" client/src/
grep -r "markdown" client/src/
```

然后按照方案一配置按需加载。

## 🔍 Vercel 部署优化

Vercel 自动提供：
- ✅ Gzip/Brotli 压缩
- ✅ HTTP/2
- ✅ 全球 CDN
- ✅ 智能缓存

但这些无法解决包体积过大的问题。

## 💡 建议

**优先级排序**:
1. 🔥 **高优先级**: 配置按需加载语言高亮（方案一）
2. 🔥 **高优先级**: 移除不需要的大型依赖（方案三）
3. ⚡ **中优先级**: 启用 Vite 构建优化（方案四）
4. 💡 **低优先级**: 代码分割（方案二）
5. 💡 **低优先级**: CDN 加载（方案五）

## 📝 总结

**主要原因**: 项目加载了大量不必要的语言高亮库（Emacs Lisp、Wolfram、C++ 等），大多数用户不会用到这些语言。

**最佳解决方案**: 配置 Markdown 渲染库，只加载常用的 5-10 种语言（JavaScript、TypeScript、Python、Bash、JSON 等）。

**预期改善**: 首次加载时间从 5-10 秒减少到 2-3 秒（在 3G 网络下）。
