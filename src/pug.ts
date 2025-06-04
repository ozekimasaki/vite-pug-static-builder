import path from 'node:path'

import type Pug from 'pug'
import { compileFile } from 'pug'
import type { ModuleGraph, ModuleNode } from 'vite'

import { outputLog } from './utils.js'

/**
 * 依存関係付きのコンパイル済みテンプレート
 */
interface CompiledTemplateWithDeps extends Pug.compileTemplate {
  readonly dependencies: readonly string[]
}

/**
 * モジュールグラフに祖先モジュールを反映
 * @param moduleGraph - モジュールグラフ
 * @param compiledModule - HTMLにコンパイルされるPugモジュール
 * @param ancestors - compiledModuleの祖先ファイルパス配列
 */
const reflectAncestorsIntoModuleMap = (
  moduleGraph: ModuleGraph,
  compiledModule: ModuleNode,
  ancestors: readonly string[],
): void => {
  // モジュールマップに祖先を追加
  for (const ancestor of ancestors) {
    const ancestorModules = moduleGraph.getModulesByFile(ancestor)
    const ancestorModule =
      (ancestorModules && [...ancestorModules][0]) ||
      moduleGraph.createFileOnlyEntry(ancestor)
    
    ancestorModule.importers.add(compiledModule) // TODO: 依存関係から削除された場合の処理
    compiledModule.importedModules.add(ancestorModule) // オプション
  }
}

/**
 * Pugファイルをコンパイル
 * @param moduleGraph - モジュールグラフ
 * @param url - ルート相対パス
 * @param pugPath - Pugファイルの絶対パス（POSIX形式）
 * @param options - Pugコンパイルオプション
 * @param locals - Pugローカル変数オブジェクト
 * @returns コンパイル結果（成功時はtrue、エラー時はErrorオブジェクト）
 */
export const compilePug = async (
  moduleGraph: ModuleGraph,
  url: string,
  pugPath: string,
  options?: Pug.Options,
  locals?: Pug.LocalsObject,
): Promise<boolean | Error> => {
  try {
    const compiledModule =
      (await moduleGraph.getModuleByUrl(url)) ||
      (await moduleGraph.ensureEntryFromUrl(url))

    // 作成時の初期化
    if (compiledModule.file !== pugPath) {
      if (compiledModule.file) {
        moduleGraph.fileToModulesMap.delete(compiledModule.file)
      }
      compiledModule.file = pugPath
      moduleGraph.fileToModulesMap.set(pugPath, new Set([compiledModule]))
    }

    // モジュールが無効化されていない場合はスキップ
    if (compiledModule.transformResult) {
      return true
    }

    // コンパイル開始
    const map = null

    const compiledTemplate = compileFile(
      pugPath,
      options,
    ) as CompiledTemplateWithDeps

    // Pugコンパイラから祖先情報を取得
    const ancestors = compiledTemplate.dependencies
    if (ancestors.length > 0) {
      reflectAncestorsIntoModuleMap(moduleGraph, compiledModule, ancestors)
    }

    // HTML生成
    const code = compiledTemplate(locals)

    outputLog('info', 'compiled:', path.relative(process.cwd(), pugPath))

    compiledModule.transformResult = { code, map }
    
    return true
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    outputLog('error', 'compilation failed:', pugPath, errorMessage)
    
    if (error instanceof Error) {
      return error
    }
    
    return new Error(`Pug compilation failed: ${errorMessage}`)
  }
}
