import path from 'node:path'
import type { ServerResponse } from 'node:http'
import { URL } from 'node:url'

import picomatch from 'picomatch'
import type Picomatch from 'picomatch'
import type Pug from 'pug'
import type {
  Connect,
  HmrContext,
  Plugin,
  ViteDevServer,
} from 'vite'
import { send } from 'vite'

import { compilePug } from './pug.js'
import { pathExists, pugFileToHtmlUrl } from './utils.js'

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

type HotChannel = {
  send: (payload: { type: 'full-reload' }) => void
}

type GraphNode<T> = {
  file?: string | null
  importers: Iterable<T>
}

type GraphLike<T extends GraphNode<T>> = {
  getModuleByUrl: (url: string) => Promise<T | undefined>
  getModulesByFile: (file: string) => Iterable<T> | undefined
  invalidateModule: (
    mod: T,
    seen?: Set<T>,
    timestamp?: number,
    isHmr?: boolean,
  ) => void
}

const SKIP_PREFIXES = ['/@', '/__inspect/', '/node_modules/'] as const

const shouldSkipUrl = (url: string): boolean =>
  SKIP_PREFIXES.some((prefix) => url.startsWith(prefix))

const isHotChannel = (value: unknown): value is HotChannel =>
  typeof value === 'object' &&
  value !== null &&
  'send' in value &&
  typeof value.send === 'function'

const sendFullReload = (
  server: ViteDevServer,
  environmentHot?: HotChannel,
): void => {
  if (environmentHot) {
    environmentHot.send({ type: 'full-reload' })
    return
  }

  const channel = server.hot ?? server.ws
  if (isHotChannel(channel)) {
    channel.send({ type: 'full-reload' })
  }
}

const sendNotFound = (res: ServerResponse): void => {
  res.statusCode = 404
  res.setHeader('Content-Type', 'text/html; charset=utf-8')
  res.end('404 Not Found')
}

/**
 * Pug本体または include / extends 先の変更なら関連モジュールを無効化する
 * @returns Pug配信に影響する変更なら true
 */
const invalidatePugGraph = async <T extends GraphNode<T>>(params: {
  file: string
  timestamp: number
  root: string
  moduleGraph: GraphLike<T>
}): Promise<boolean> => {
  const { file, timestamp, root, moduleGraph } = params
  const ext = path.extname(file)
  let affectsPug = ext === '.pug'

  if (ext === '.pug') {
    const htmlUrl = pugFileToHtmlUrl(file, root)
    const htmlModule = await moduleGraph.getModuleByUrl(htmlUrl)
    if (htmlModule) {
      moduleGraph.invalidateModule(htmlModule, new Set(), timestamp, true)
    }
  }

  const fileModules = moduleGraph.getModulesByFile(file)
  if (fileModules) {
    const seen = new Set<T>()
    for (const fileModule of fileModules) {
      for (const importer of fileModule.importers) {
        if (importer.file && path.extname(importer.file) === '.pug') {
          affectsPug = true
          moduleGraph.invalidateModule(importer, seen, timestamp, true)
        }
      }
    }
  }

  return affectsPug
}

/**
 * 開発サーバー用ミドルウェア生成
 */
const createMiddleware = (
  settings: ServeSettings,
  server: ViteDevServer,
): Connect.NextHandleFunction => {
  const { options, locals, ignorePattern } = settings
  const ignoreMatcher = ignorePattern ? picomatch(ignorePattern) : null

  return async (req, res, next) => {
    if (!req.url || shouldSkipUrl(req.url)) {
      next()
      return
    }

    const url = new URL(req.url, 'http://vite.local').pathname

    if (ignoreMatcher?.(url)) {
      next()
      return
    }

    const reqAbsPath = path.posix.join(
      server.config.root,
      url,
      url.endsWith('/') ? 'index.html' : '',
    )
    const parsedReqAbsPath = path.posix.parse(reqAbsPath)

    if (parsedReqAbsPath.ext !== '.html') {
      next()
      return
    }

    if (await pathExists(reqAbsPath)) {
      next()
      return
    }

    const pugAbsPath = path.posix.format({
      dir: parsedReqAbsPath.dir,
      name: parsedReqAbsPath.name,
      ext: '.pug',
    })

    if (!(await pathExists(pugAbsPath))) {
      sendNotFound(res)
      return
    }

    try {
      const compileResult = await compilePug(
        server.moduleGraph,
        url,
        pugAbsPath,
        options,
        locals,
        server.watcher,
      )

      if (compileResult instanceof Error) {
        next(compileResult)
        return
      }

      const transformResult = await server.transformRequest(url)

      if (transformResult) {
        const html = await server.transformIndexHtml(url, transformResult.code)
        send(req, res, html, 'html', {})
        return
      }

      next(
        new Error(
          'An unexpected error has occurred during HTML transformation.',
        ),
      )
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error)
      next(new Error(`Pug compilation failed: ${errorMessage}`))
    }
  }
}

/**
 * Vite用Pug開発サーバープラグイン
 */
export const vitePluginPugServe = (settings?: ServeSettings): Plugin => {
  const resolved = settings ?? {}
  const { reload } = resolved
  let server: ViteDevServer

  return {
    name: 'vite-plugin-pug-serve',
    enforce: 'pre',
    apply: 'serve',

    configureServer(_server: ViteDevServer): void {
      server = _server
      server.middlewares.use(createMiddleware(resolved, server))
    },

    // Vite 7 / 8
    async hotUpdate(context): Promise<[] | void> {
      const affectsPug = await invalidatePugGraph({
        file: context.file,
        timestamp: context.timestamp,
        root: server.config.root,
        moduleGraph: this.environment.moduleGraph,
      })

      if (affectsPug && reload !== false) {
        sendFullReload(server, this.environment.hot)
        return []
      }
    },

    // Vite 6（hotUpdate が無いランタイム向け）
    async handleHotUpdate(context: HmrContext): Promise<[] | void> {
      const affectsPug = await invalidatePugGraph({
        file: context.file,
        timestamp: context.timestamp,
        root: server.config.root,
        moduleGraph: context.server.moduleGraph,
      })

      if (affectsPug && reload !== false) {
        sendFullReload(context.server)
        return []
      }
    },
  }
}
