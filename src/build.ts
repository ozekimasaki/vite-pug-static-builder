import { readFile } from 'node:fs/promises'
import path from 'node:path'

import { compileFile } from 'pug'
import type Pug from 'pug'
import type { Plugin } from 'vite'

import { outputLog, pathExists, pugDependencies, stripQueryAndHash } from './utils.js'

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
  let root = ''

  return {
    name: 'vite-plugin-pug-build',
    enforce: 'pre',
    apply: 'build',

    configResolved(config) {
      root = config.root
    },

    resolveId(source: string): string | null {
      const parsedPath = path.parse(stripQueryAndHash(source))

      if (parsedPath.ext !== '.pug') {
        return null
      }

      const pathAsHtml = path.format({
        dir: parsedPath.dir,
        name: parsedPath.name,
        ext: '.html',
      })

      pathMap.set(pathAsHtml, stripQueryAndHash(source))
      return pathAsHtml
    },

    async load(id: string): Promise<string | null> {
      const cleanId = stripQueryAndHash(id)
      if (path.extname(cleanId) !== '.html') {
        return null
      }

      try {
        const pugPath = pathMap.get(cleanId)
        if (pugPath) {
          const compiledTemplate = compileFile(pugPath, options)
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
