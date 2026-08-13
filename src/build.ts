import { readFile } from 'node:fs/promises'
import path from 'node:path'

import { compileFile } from 'pug'
import type Pug from 'pug'
import type { Plugin } from 'vite'

import {
  isClientEnvironment,
  outputLog,
  pathExists,
  pugDependencies,
  replaceExtPosix,
  setPluginLogger,
  stripQueryAndHash,
  toPosixPath,
} from './utils.js'

/**
 * Pugビルド設定
 */
export interface BuildSettings {
  /** Pugコンパイルオプション */
  readonly options?: Pug.Options
  /** Pugローカル変数オブジェクト */
  readonly locals?: Pug.LocalsObject
}

/**
 * Vite用Pugビルドプラグイン
 */
export const vitePluginPugBuild = (settings?: BuildSettings): Plugin => {
  const { options, locals } = settings ?? {}
  const pathMap = new Map<string, string>()
  const templateCache = new Map<string, ReturnType<typeof compileFile>>()
  let root = ''

  const forgetTemplate = (file: string): void => {
    const normalized = toPosixPath(file)
    templateCache.delete(normalized)
    for (const [pugPath, compiled] of templateCache) {
      if (pugDependencies(compiled).some((dep) => toPosixPath(dep) === normalized)) {
        templateCache.delete(pugPath)
      }
    }
  }

  return {
    name: 'vite-plugin-pug-build',
    enforce: 'pre',
    apply: 'build',

    applyToEnvironment(environment) {
      return isClientEnvironment(environment)
    },

    configResolved(config) {
      root = config.root
      setPluginLogger(config.logger)
    },

    watchChange(id) {
      if (toPosixPath(id).endsWith('.pug')) {
        forgetTemplate(id)
      }
    },

    resolveId(source: string): string | null {
      const pugPath = toPosixPath(stripQueryAndHash(source))
      const parsedPath = path.posix.parse(pugPath)

      if (parsedPath.ext !== '.pug') {
        return null
      }

      const pathAsHtml = replaceExtPosix(pugPath, '.html')
      pathMap.set(pathAsHtml, pugPath)
      return pathAsHtml
    },

    async load(id: string): Promise<string | null> {
      const cleanId = toPosixPath(stripQueryAndHash(id))
      if (path.posix.extname(cleanId) !== '.html') {
        return null
      }

      try {
        const pugPath = pathMap.get(cleanId)
        if (pugPath) {
          const cacheKey = toPosixPath(pugPath)
          let compiledTemplate = templateCache.get(cacheKey)
          if (!compiledTemplate) {
            compiledTemplate = compileFile(pugPath, options)
            templateCache.set(cacheKey, compiledTemplate)
          }
          this.addWatchFile(pugPath)
          for (const dependency of pugDependencies(compiledTemplate)) {
            this.addWatchFile(dependency)
          }

          outputLog('info', 'compiled:', path.relative(root, pugPath))
          return compiledTemplate(locals)
        }

        if (await pathExists(cleanId)) {
          return await readFile(cleanId, 'utf-8')
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : String(error)
        outputLog('error', 'compilation failed:', cleanId, errorMessage)
        throw error
      }

      return null
    },
  }
}
