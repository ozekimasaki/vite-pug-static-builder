# vite-pug-static-builder

[![MIT](https://img.shields.io/badge/License-MIT-green.svg?style=flat-square)](./LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178c6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-646cff?style=flat-square&logo=Vite&logoColor=white)](https://vitejs.dev/)
[![Pug](https://img.shields.io/badge/Pug-a86454?style=flat-square&logo=pug&logoColor=white)](https://pugjs.org/)
[![Vitest](https://img.shields.io/badge/Vitest-6E9F18?style=flat-square&logo=vitest&logoColor=white)](https://vitest.dev/)

**[日本語](./README.ja.md)** | **[中文](./README.zh-CN.md)**

**Vite 6 / 7 / 8 compatible** — A high-performance static site builder using Vite + Pug.

A modern Vite plugin that efficiently builds multiple Pug files into static HTML files.
Supports Vite 6, 7, and 8.

## ✨ Features

- 🚀 **Fast builds**: Powered by Vite's build system
- 📝 **Pug support**: Write HTML efficiently with the Pug template engine
- 🔄 **Live reload**: HMR (Hot Module Replacement) during development
- 📱 **Static site generation**: Produces optimized static HTML for production
- 🎨 **Highly customizable**: Rich configuration options to fit your project
- 🛡️ **Type-safe**: Full TypeScript support for early error detection

## Installation

```bash
# npm
npm install vite-pug-static-builder

# yarn
yarn add vite-pug-static-builder

# pnpm
pnpm add vite-pug-static-builder
```

## Requirements

- **Node.js**: 20.19.0 or later (or 22.12.0+)
- **Vite**: ^6.0.0 || ^7.0.0 || ^8.0.0
- **Pug**: ^3.0.0

## Basic Usage

### 1. Vite Configuration

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

### 2. Project Structure Example

```
src/
├── index.pug          # → dist/index.html
├── about/
│   └── index.pug      # → dist/about/index.html
├── blog/
│   ├── index.pug      # → dist/blog/index.html
│   └── post1.pug      # → dist/blog/post1.html
├── _layouts/
│   └── base.pug       # Layout template
├── _includes/
│   └── header.pug     # Partial template
└── assets/
    ├── style.css
    └── script.js
```

### 3. Pug File Example

```pug
//- src/index.pug
extends _layouts/base

block content
  main
    h1= title
    p Welcome to #{title}!
    
    if env === 'development'
      .dev-info Running in development mode
    
    include _includes/header
```

## Configuration

### Plugin Options

```typescript
interface Settings {
  // Build settings
  build?: {
    // Pug compile options
    options?: Pug.Options
    // Pug local variables
    locals?: Pug.LocalsObject
  }

  // Dev server settings
  serve?: {
    // Pug compile options
    options?: Pug.Options
    // Pug local variables
    locals?: Pug.LocalsObject
    // Ignore pattern (glob format)
    ignorePattern?: string | string[]
    // Hot reload (default: true)
    reload?: boolean
  }
}
```

### HTML formatting

Pug 3 removed the `pretty` option. This plugin does not re-indent compiled HTML.
Format `dist/**/*.html` in the project if you need readable output.

`buildOptions` and `watch` still work as aliases for `build.options` / `serve.options` and `serve.reload`, but they log a deprecation warning.

### Advanced Configuration

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
      '/_*/**',            // Ignore directories starting with underscore
      '/admin/**',         // Ignore admin directory
      '/**/*.draft.pug'    // Ignore .draft.pug files
    ],
    reload: true
  }
})
```

## Development Commands

```bash
# Start dev server
npm run dev

# Production build
npm run build

# Preview build
npm run preview

# Type check
npm run type-check

# Run tests (Vite 8)
npm test

# Run tests with Vite 6 / 7
npm run test:vite6
npm run test:vite7

# Run tests with coverage
npm run coverage

# Watch mode
npm run test:watch
```

## TypeScript Integration

Full TypeScript support ensures type safety across your configuration and Pug templates:

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

## Performance Optimization

```typescript
pugPlugin({
  build: {
    options: {
      cache: true,                   // Enable caching
      inlineRuntimeFunctions: false, // Externalize runtime functions
      compileDebug: false            // Remove debug info
    }
  },
  serve: {
    options: {
      cache: false,        // Disable cache in development
      compileDebug: true   // Enable debug in development
    }
  }
})
```

## Troubleshooting

### Common Issues

**Q: Browser doesn't update when Pug files change**
```typescript
pugPlugin({
  serve: {
    reload: true
  }
})
```

**Q: Pug dependencies aren't resolved correctly during build**
```typescript
pugPlugin({
  build: {
    options: {
      basedir: path.resolve(__dirname, 'src')
    }
  }
})
```

**Q: Error handling in the dev server**
```pug
//- Check for variable existence to prevent errors
if typeof title !== 'undefined'
  h1= title
else
  h1 Default Title
```

## Migration Guide

### Migrating from Other Pug Plugins

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

## License

[MIT](./LICENSE) © 2025 maigo999

## Contributing

Pull requests and issues are welcome!

1. Fork this repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Changelog

### v1.2.0
- Stopped applying Pug 2's `pretty: true` default (removed in Pug 3)
- Dev 404 responses now use HTTP 404 instead of 200
- Full reload runs only when a Pug file or its includes change (CSS/JS HMR is left to Vite)
- Build watches Pug `include` / `extends` dependencies
- `buildOptions` / `watch` remain as deprecated aliases
- Updated `pug` to 3.0.4 and aligned Vite 8 / picomatch types

### v1.1.5 (2026-03-13)
- 🌐 Added multilingual README (English, Japanese, Chinese)

### v1.1.4 (2026-03-13)
- 📝 Fixed README to match actual API implementation

### v1.1.3 (2026-03-13)
- 🚀 Vite 8 support
- 📦 Added `@types/node` to devDependencies

### v1.1.2
- 🚀 Vite 7 stable support
- 🧪 Vitest 3.2 support

### v1.0.0
- 🚀 Initial release
- ✨ Environment API support
- 🛡️ Full TypeScript support

## Links

- [Vite](https://vitejs.dev/)
- [Pug](https://pugjs.org/)
- [GitHub Repository](https://github.com/ozekimasaki/vite-pug-static-builder)
