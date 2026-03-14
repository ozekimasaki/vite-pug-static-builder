# vite-pug-static-builder

[![MIT](https://img.shields.io/badge/License-MIT-green.svg?style=flat-square)](./LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178c6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-646cff?style=flat-square&logo=Vite&logoColor=white)](https://vitejs.dev/)
[![Pug](https://img.shields.io/badge/Pug-a86454?style=flat-square&logo=pug&logoColor=white)](https://pugjs.org/)
[![Vitest](https://img.shields.io/badge/Vitest-6E9F18?style=flat-square&logo=vitest&logoColor=white)](https://vitest.dev/)

**[English](./README.md)** | **[日本語](./README.ja.md)**

**兼容 Vite 6 / 7 / 8** — 基于 Vite + Pug 的高性能静态站点构建器

一个现代化的 Vite 插件，可以高效地将多个 Pug 文件构建为静态 HTML 文件。
支持 Vite 6、7 和 8。

## ✨ 特性

- 🚀 **快速构建**：基于 Vite 构建系统的高速开发体验
- 📝 **Pug 支持**：使用 Pug 模板引擎高效编写 HTML
- 🔄 **实时更新**：开发时支持 HMR（热模块替换）
- 📱 **静态站点生成**：生成面向生产环境优化的静态 HTML 文件
- 🎨 **高度可定制**：丰富的配置选项，适配各种项目需求
- 🛡️ **类型安全**：完整的 TypeScript 支持，提前发现开发错误

## 安装

```bash
# npm
npm install vite-pug-static-builder

# yarn
yarn add vite-pug-static-builder

# pnpm
pnpm add vite-pug-static-builder
```

## 环境要求

- **Node.js**：18.0.0 或更高版本
- **Vite**：^6.0.0 || ^7.0.0 || ^8.0.0
- **Pug**：^3.0.0

## 基本用法

### 1. Vite 配置文件

```typescript
// vite.config.ts
import { defineConfig } from 'vite'
import pugPlugin from 'vite-pug-static-builder'

export default defineConfig({
  plugins: [
    pugPlugin({
      build: {
        options: {
          basedir: './src'
        },
        locals: {
          title: 'My Website',
          env: 'production'
        }
      },
      serve: {
        options: {
          basedir: './src'
        },
        locals: {
          title: 'My Website (Dev)',
          env: 'development'
        }
      }
    })
  ]
})
```

### 2. 项目结构示例

```
src/
├── index.pug          # → dist/index.html
├── about/
│   └── index.pug      # → dist/about/index.html
├── blog/
│   ├── index.pug      # → dist/blog/index.html
│   └── post1.pug      # → dist/blog/post1.html
├── _layouts/
│   └── base.pug       # 布局模板
├── _includes/
│   └── header.pug     # 局部模板
└── assets/
    ├── style.css
    └── script.js
```

### 3. Pug 文件示例

```pug
//- src/index.pug
extends _layouts/base

block content
  main
    h1= title
    p 欢迎来到 #{title}！
    
    if env === 'development'
      .dev-info 正在开发模式下运行
    
    include _includes/header
```

## 配置选项

### 插件配置

```typescript
interface Settings {
  // 构建设置
  build?: {
    // Pug 编译选项
    options?: Pug.Options
    // Pug 局部变量
    locals?: Pug.LocalsObject
  }

  // 开发服务器设置
  serve?: {
    // Pug 编译选项
    options?: Pug.Options
    // Pug 局部变量
    locals?: Pug.LocalsObject
    // 忽略模式（glob 格式）
    ignorePattern?: string | string[]
    // 热重载（默认：true）
    reload?: boolean
  }
}
```

### Pug 选项默认值

`build.options` 和 `serve.options` 应用以下默认设置：

- **`pretty`**：默认为 `true`（在 Pug 3.x 中已弃用）

用户在 `options` 中指定的值会覆盖默认值。

### 高级配置

```typescript
pugPlugin({
  build: {
    options: {
      basedir: './src',
      compileDebug: false,
      cache: true,
      inlineRuntimeFunctions: false
    },
    locals: {
      title: 'Production Site',
      version: process.env.npm_package_version,
      buildTime: new Date().toISOString(),
      author: 'Your Name',
      description: 'A modern static site built with Vite and Pug'
    }
  },
  serve: {
    options: {
      basedir: './src',
      compileDebug: true,
      cache: false
    },
    locals: {
      title: 'Development Site',
      version: 'dev',
      buildTime: 'dev-mode'
    },
    ignorePattern: [
      '/_*/**',            // 忽略以下划线开头的目录
      '/admin/**',         // 忽略 admin 目录
      '/**/*.draft.pug'    // 忽略 .draft.pug 文件
    ],
    reload: true
  }
})
```

## 开发命令

```bash
# 启动开发服务器
npm run dev

# 生产构建
npm run build

# 预览构建
npm run preview

# 类型检查
npm run type-check

# 运行测试（Vite 8 环境）
npm test

# 在 Vite 6 / 7 环境下运行测试
npm run test:vite6
npm run test:vite7

# 带覆盖率的测试
npm run coverage

# 监听模式
npm run test:watch
```

## TypeScript 集成

完整的 TypeScript 支持确保配置文件和 Pug 模板的类型安全：

```typescript
// types/pug.d.ts
declare module '*.pug' {
  const content: string
  export default content
}

// vite-env.d.ts
/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_APP_TITLE: string
  readonly VITE_API_URL: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
```

## 性能优化

```typescript
pugPlugin({
  build: {
    options: {
      cache: true,                   // 启用缓存
      inlineRuntimeFunctions: false, // 外部化运行时函数
      compileDebug: false            // 移除调试信息
    }
  },
  serve: {
    options: {
      cache: false,        // 开发时禁用缓存
      compileDebug: true   // 开发时启用调试
    }
  }
})
```

## 故障排除

### 常见问题

**Q：Pug 文件更新后浏览器没有刷新**
```typescript
pugPlugin({
  serve: {
    reload: true
  }
})
```

**Q：构建时 Pug 依赖关系未正确解析**
```typescript
pugPlugin({
  build: {
    options: {
      basedir: path.resolve(__dirname, 'src')
    }
  }
})
```

**Q：开发服务器中的错误处理**
```pug
//- 检查变量是否存在以防止错误
if typeof title !== 'undefined'
  h1= title
else
  h1 Default Title
```

## 迁移指南

### 从其他 Pug 插件迁移

```diff
- import { createPugPlugin } from 'vite-plugin-pug'
+ import pugPlugin from 'vite-pug-static-builder'

- createPugPlugin({
-   pugOptions: { basedir: './src' }
- })
+ pugPlugin({
+   build: {
+     options: { basedir: './src' }
+   },
+   serve: {
+     options: { basedir: './src' }
+   }
+ })
```

## 许可证

[MIT](./LICENSE) © 2025 maigo999

## 贡献

欢迎提交 Pull Request 和 Issue！

1. Fork 本仓库
2. 创建功能分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'Add amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 创建 Pull Request

## 更新日志

### v1.1.5 (2026-03-13)
- 🌐 添加多语言 README（英语、日语、中文）

### v1.1.4 (2026-03-13)
- 📝 修正 README 使其与实际 API 实现一致

### v1.1.3 (2026-03-13)
- 🚀 支持 Vite 8
- 📦 将 `@types/node` 添加到 devDependencies

### v1.1.2
- 🚀 支持 Vite 7 稳定版
- 🧪 支持 Vitest 3.2

### v1.0.0
- 🚀 首次发布
- ✨ 支持 Environment API
- 🛡️ 完整的 TypeScript 支持

## 相关链接

- [Vite](https://vitejs.dev/)
- [Pug](https://pugjs.org/)
- [GitHub Repository](https://github.com/ozekimasaki/vite-pug-static-builder)
