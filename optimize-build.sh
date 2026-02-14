#!/bin/bash

# Obscura 性能优化脚本

echo "🚀 开始优化构建配置..."

# 1. 添加 Vite 构建优化配置
echo "📝 更新 vite.config.ts..."

# 备份原文件
cp vite.config.ts vite.config.ts.backup

# 添加构建优化配置（需要手动编辑 vite.config.ts）
echo "⚠️  请手动编辑 vite.config.ts，添加以下配置："
echo ""
echo "build: {"
echo "  rollupOptions: {"
echo "    output: {"
echo "      manualChunks: {"
echo "        'vendor': ['react', 'react-dom'],"
echo "        'ui': ['@radix-ui/react-accordion', '@radix-ui/react-dialog'],"
echo "      }"
echo "    }"
echo "  },"
echo "  chunkSizeWarningLimit: 1000,"
echo "  minify: 'terser',"
echo "  terserOptions: {"
echo "    compress: {"
echo "      drop_console: true"
echo "    }"
echo "  }"
echo "},"
echo ""

# 2. 分析当前包大小
echo "📊 分析当前构建产物..."
if [ -d "dist/client/assets" ]; then
  echo "最大的文件："
  du -sh dist/client/assets/* | sort -hr | head -10
else
  echo "⚠️  dist/client 目录不存在，请先运行 pnpm build:client"
fi

echo ""
echo "✅ 优化建议已生成，请查看 PERFORMANCE_OPTIMIZATION.md"
echo ""
echo "下一步："
echo "1. 查看 PERFORMANCE_OPTIMIZATION.md 了解详细优化方案"
echo "2. 根据需要修改 vite.config.ts"
echo "3. 运行 pnpm build:client 重新构建"
echo "4. 对比优化前后的包大小"
