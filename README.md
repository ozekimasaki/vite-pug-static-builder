# vite-pug-static-builder

[![MIT](https://img.shields.io/badge/License-MIT-green.svg?style=flat-square)](./LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178c6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-646cff?style=flat-square&logo=Vite&logoColor=white)](https://vitejs.dev/)
[![Pug](https://img.shields.io/badge/Pug-a86454?style=flat-square&logo=pug&logoColor=white)](https://pugjs.org/)
[![Vitest](https://img.shields.io/badge/Vitest-6E9F18?style=flat-square&logo=vitest&logoColor=white)](https://vitest.dev/)

**Vite 7 & Vitest 3.2対応版** - Vite + Pugを使用した高性能静的サイトビルダー

複数のPugファイルを効率的に静的HTMLファイルとしてビルドできる、最新のViteプラグインです。

## ✨ 新機能（v1.0.0）

### 🚀 Vite 7対応
- **Environment API**: 新しいVite 7のEnvironment APIに完全対応
- **最新型システム**: TypeScript 5.6の最新機能を活用した型安全性の向上
- **パフォーマンス向上**: Vite 7の高速化されたビルドシステムを活用

### 🧪 Vitest 3.2対応
- **Projects API**: workspace → projectsへの移行完了
- **Enhanced Coverage**: v8カバレッジプロバイダーによる詳細なテストカバレッジ
- **型チェック**: TypeScriptの型チェックを統合したテスト実行
- **並列実行**: マルチスレッドによる高速テスト実行

## 特徴

- 🚀 **超高速ビルド**: Vite 7の最新ビルドシステムによる極速開発体験
- 📝 **Pugサポート**: Pugテンプレートエンジンで効率的なHTML作成
- 🔄 **開発時リアルタイム更新**: HMR (Hot Module Replacement) 対応
- 📱 **静的サイト生成**: 本番環境向けに最適化された静的HTMLファイルを生成
- 🎨 **高度なカスタマイズ**: 豊富な設定オプションでプロジェクトに合わせた細かな調整
- 🛡️ **型安全**: TypeScript完全対応による開発時エラーの早期発見
- 🧪 **テスト統合**: Vitest 3.2による包括的なテストサポート

## インストール

```bash
# npm
npm install vite-pug-static-builder

# yarn
yarn add vite-pug-static-builder

# pnpm
pnpm add vite-pug-static-builder
```

## 必要環境

- **Node.js**: 18.0.0以上
- **Vite**: 7.0.0-beta.0以上
- **Pug**: 3.0.0以上

## 基本的な使用方法

### 1. Vite設定ファイル

```typescript
// vite.config.ts
import { defineConfig } from 'vite'
import pugPlugin from 'vite-pug-static-builder'

export default defineConfig({
  plugins: [
    pugPlugin({
      buildOptions: {
        basedir: './src',
        pretty: true
      },
      buildLocals: {
        title: 'My Website',
        env: 'production'
      },
      serveOptions: {
        basedir: './src',
        pretty: true
      },
      serveLocals: {
        title: 'My Website (Dev)',
        env: 'development'
      }
    })
  ]
})
```

### 2. プロジェクト構造例

```
src/
├── index.pug          # → dist/index.html
├── about/
│   └── index.pug      # → dist/about/index.html
├── blog/
│   ├── index.pug      # → dist/blog/index.html
│   └── post1.pug      # → dist/blog/post1.html
├── _layouts/
│   └── base.pug       # レイアウトテンプレート
├── _includes/
│   └── header.pug     # 部分テンプレート
└── assets/
    ├── style.css
    └── script.js
```

### 3. Pugファイル例

```pug
//- src/index.pug
extends _layouts/base

block content
  main
    h1= title
    p ようこそ、#{title}へ！
    
    if env === 'development'
      .dev-info 開発モードで実行中
    
    include _includes/header
```

## 詳細設定オプション

### プラグイン設定

```typescript
interface Settings {
  // ビルド時のPugコンパイルオプション
  buildOptions?: Pug.Options
  
  // ビルド時のPugローカル変数
  buildLocals?: Pug.LocalsObject
  
  // 開発サーバー時のPugコンパイルオプション
  serveOptions?: Pug.Options
  
  // 開発サーバー時のPugローカル変数
  serveLocals?: Pug.LocalsObject
  
  // 無視パターン（glob形式）
  ignorePattern?: string | string[]
  
  // ホットリロード設定
  reload?: boolean
}
```

### 高度な設定例

```typescript
// プラグインの詳細設定
pugPlugin({
  buildOptions: {
    basedir: './src',
    pretty: false,  // 本番環境では圧縮
    compileDebug: false,
    cache: true,
    inlineRuntimeFunctions: false
  },
  buildLocals: {
    title: 'Production Site',
    version: process.env.npm_package_version,
    buildTime: new Date().toISOString(),
    author: 'Your Name',
    description: 'A modern static site built with Vite and Pug'
  },
  serveOptions: {
    basedir: './src',
    pretty: true,  // 開発時は読みやすく
    compileDebug: true,
    cache: false   // 開発時はキャッシュ無効
  },
  serveLocals: {
    title: 'Development Site',
    version: 'dev',
    buildTime: 'dev-mode'
  },
  ignorePattern: [
    '/_*/**',      // アンダースコアで始まるディレクトリを無視
    '/admin/**',   // adminディレクトリを無視
    '/**/*.draft.pug' // .draft.pugファイルを無視
  ],
  reload: true
})
```

## 開発コマンド

```bash
# 開発サーバー起動
npm run dev

# 本番ビルド
npm run build

# ビルドのプレビュー
npm run preview

# 型チェック
npm run type-check

# テスト実行（Vitest 3.2）
npm test

# カバレッジ付きテスト
npm run coverage

# ウォッチモードでテスト
npm run test:watch
```

## TypeScript統合

完全なTypeScript対応により、設定ファイルやPugテンプレート内でも型安全性を確保できます：

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

## パフォーマンス最適化

Vite 7の新機能と組み合わせて、プラグインの設定を最適化できます：

```typescript
// より高速なビルドのための設定
pugPlugin({
  buildOptions: {
    cache: true,           // キャッシュ有効化
    inlineRuntimeFunctions: false,  // ランタイム関数の外部化
    compileDebug: false    // デバッグ情報削除
  },
  serveOptions: {
    cache: false,          // 開発時はキャッシュ無効
    compileDebug: true     // 開発時はデバッグ有効
  }
})
```

## トラブルシューティング

### よくある問題と解決法

**Q: Pugファイルが更新されてもブラウザが更新されない**
```typescript
// reload: true を設定してください
pugPlugin({
  reload: true
})
```

**Q: ビルド時にPugの依存関係が正しく解決されない**
```typescript
// basedirを正しく設定してください
pugPlugin({
  buildOptions: {
    basedir: path.resolve(__dirname, 'src')
  }
})
```

**Q: 開発サーバーでのエラーハンドリング**
```pug
//- エラーを防ぐため、変数の存在チェックを行う
if typeof title !== 'undefined'
  h1= title
else
  h1 Default Title
```

## マイグレーションガイド

### 他のPugプラグインからの移行

```diff
- import { createPugPlugin } from 'vite-plugin-pug'
+ import pugPlugin from 'vite-pug-static-builder'

- createPugPlugin({
-   pugOptions: { basedir: './src' }
- })
+ pugPlugin({
+   buildOptions: { basedir: './src' },
+   serveOptions: { basedir: './src' }
+ })
```

## ライセンス

[MIT](./LICENSE) © 2025 ozekimasaki

## 貢献

プルリクエストや Issue の報告を歓迎します！

1. このリポジトリをフォーク
2. フィーチャーブランチを作成 (`git checkout -b feature/amazing-feature`)
3. 変更をコミット (`git commit -m 'Add amazing feature'`)
4. ブランチにプッシュ (`git push origin feature/amazing-feature`)
5. プルリクエストを作成

## 変更履歴

### v1.0.0 (2025-01-XX)
- 🚀 Vite 7 (ベータ版) 対応
- 🧪 Vitest 3.2 対応  
- 🛡️ TypeScript 5.6 完全対応
- ✨ Environment API 対応
- 🎯 型安全性の大幅向上
- 📦 依存関係の最新化
- 🧹 コードベースの全面リファクタリング

---

**注意**: 現在Vite 7はベータ版のため、本番環境での使用は安定版リリース後を推奨します。

## 関連リンク

- [Vite](https://vitejs.dev/)
- [Pug](https://pugjs.org/)
- [GitHub Repository](https://github.com/ozekimasaki/vite-pug-static-builder)
