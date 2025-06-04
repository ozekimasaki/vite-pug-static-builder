import fs from 'node:fs'
import path from 'node:path'

import type Pug from 'pug'
import { compileFile } from 'pug'
import type { Plugin } from 'vite'

import { outputLog } from './utils.js'

/**
 * Pugビルド設定
 */
interface BuildSettings {
  /** Pugコンパイルオプション */
  readonly options?: Pug.Options
  /** Pugローカル変数オブジェクト */
  readonly locals?: Pug.LocalsObject
}

/**
 * Vite用Pugビルドプラグイン
 * @param settings - ビルド設定
 * @returns Viteプラグイン
 */
export const vitePluginPugBuild = (settings: BuildSettings): Plugin => {
  const { options, locals } = settings
  const pathMap = new Map<string, string>()

  return {
    name: 'vite-plugin-pug-build',
    enforce: 'pre',
    apply: 'build',
    
    resolveId(source: string): string | null {
      const parsedPath = path.parse(source)
      
      if (parsedPath.ext !== '.pug') {
        return null
      }

      const pathAsHtml = path.format({
        dir: parsedPath.dir,
        name: parsedPath.name,
        ext: '.html',
      })
      
      pathMap.set(pathAsHtml, source)
      return pathAsHtml
    },

    load(id: string): string | null {
      if (path.extname(id) !== '.html') {
        return null
      }

      try {
        // PugファイルのHTMLへの変換
        if (pathMap.has(id)) {
          const pugPath = pathMap.get(id)!
          const compiledTemplate = compileFile(pugPath, options)
          const html = compiledTemplate(locals)
          
          outputLog(
            'info',
            'compiled:',
            path.relative(process.cwd(), pugPath),
          )
          
          return html
        }

        // 既存のHTMLファイルの読み込み
        if (fs.existsSync(id)) {
          return fs.readFileSync(id, 'utf-8')
        }
      } catch (error) {
        // エラーログの出力
        const errorMessage = error instanceof Error ? error.message : String(error)
        outputLog('error', 'compilation failed:', id, errorMessage)
        throw error
      }

      return null
    },
  }
}
