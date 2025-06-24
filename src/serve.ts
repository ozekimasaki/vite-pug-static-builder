import fs from 'node:fs'
import path from 'node:path'
import { URL } from 'node:url'
import type http from 'node:http'

import type Pug from 'pug'
import type { Plugin, ViteDevServer, Connect } from 'vite'
import { send } from 'vite'
import type Picomatch from 'picomatch'
import picomatch from 'picomatch'

import { compilePug } from './pug.js'

/**
 * 開発サーバー設定
 */
export interface ServeSettings {
  /** Pugコンパイルオプション */
  readonly options?: Pug.Options
  /** Pugローカル変数オブジェクト */
  readonly locals?: Pug.LocalsObject
  /** 無視パターン（Pugファイル変換の除外用） */
  readonly ignorePattern?: Picomatch.Glob
  /** リロード設定（現在は有効/無効制御のみ） */
  readonly reload?: boolean
}

/**
 * Connectミドルウェア型定義
 */
export type Middleware = (
  req: Connect.IncomingMessage,
  res: http.ServerResponse,
  next: Connect.NextFunction,
) => void | http.ServerResponse | Promise<void | http.ServerResponse>

/**
 * 開発サーバー用ミドルウェア生成
 * @param settings - サーブ設定
 * @param server - Vite開発サーバー
 * @returns Connectミドルウェア
 */
const createMiddleware = (
  settings: ServeSettings,
  server: ViteDevServer,
): Middleware => {
  const { options, locals, ignorePattern } = settings
  const ignoreMatcher = ignorePattern ? picomatch(ignorePattern) : null

  return async (req, res, next) => {
    // 特殊なURLパスをスキップ
    if (
      !req.url ||
      req.url.startsWith('/@') || // @fs @vite @react-refresh etc...
      req.url.startsWith('/__inspect/') // vite-plugin-inspect
    ) {
      return next()
    }

    const url = new URL(req.url, 'relative:///').pathname

    // 無視パターンにマッチする場合はスキップ
    if (ignoreMatcher?.call(null, url)) {
      return next()
    }

    const reqAbsPath = path.posix.join(
      server.config.root,
      url,
      url.endsWith('/') ? 'index.html' : '',
    )

    const parsedReqAbsPath = path.posix.parse(reqAbsPath)

    // HTMLファイル以外はスキップ
    if (parsedReqAbsPath.ext !== '.html') {
      return next()
    }

    // 既存のHTMLファイルがある場合はスキップ
    if (fs.existsSync(reqAbsPath)) {
      return next()
    }

    // 対応するPugファイルのパスを生成
    const pugAbsPath = path.posix.format({
      dir: parsedReqAbsPath.dir,
      name: parsedReqAbsPath.name,
      ext: '.pug',
    })

    // Pugファイルが存在しない場合は404
    if (!fs.existsSync(pugAbsPath)) {
      return send(req, res, '404 Not Found', 'html', {})
    }

    try {
      // Pugファイルをコンパイル
      const compileResult = await compilePug(
        server.moduleGraph,
        url,
        pugAbsPath,
        options,
        locals,
      )

      // Pugコンパイルエラー
      if (compileResult instanceof Error) {
        return next(compileResult)
      }

      // HTMLの変換処理
      const transformResult = await server.transformRequest(url)

      if (transformResult) {
        const html = await server.transformIndexHtml(url, transformResult.code)
        return send(req, res, html, 'html', {})
      }

      // transformResultがnullまたは予期しないエラー
      return next(new Error('An unexpected error has occurred during HTML transformation.'))
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      return next(new Error(`Pug compilation failed: ${errorMessage}`))
    }
  }
}

/**
 * Vite用Pug開発サーバープラグイン
 * @param settings - サーブ設定
 * @returns Viteプラグイン
 */
export const vitePluginPugServe = (settings?: ServeSettings): Plugin => {
  const { reload } = settings ?? {}
  let server: ViteDevServer

  return {
    name: 'vite-plugin-pug-serve',
    enforce: 'pre',
    apply: 'serve',
    
    configureServer(_server: ViteDevServer): void {
      server = _server
      server.middlewares.use(createMiddleware(settings ?? {}, server))
    },

    handleHotUpdate(context): void {
      const fileModules = server.moduleGraph.getModulesByFile(context.file)

      if (fileModules) {
        for (const fileModule of fileModules) {
          for (const importer of fileModule.importers) {
            if (importer.file && path.extname(importer.file) === '.pug') {
              server.moduleGraph.invalidateModule(importer)
            }
          }
        }
      }

      // リロード設定に基づいてフルリロードを実行
      if (reload !== false) {
        context.server.ws.send({ type: 'full-reload' })
      }
    },
  }
}
