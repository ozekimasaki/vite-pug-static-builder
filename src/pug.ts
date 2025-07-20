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
 * 依存関係をモジュールグラフに登録
 * @param moduleGraph - モジュールグラフ
 * @param compiledModule - HTMLにコンパイルされるPugモジュール
 * @param dependencies - compiledModuleの依存ファイルパス配列
 */
const registerDependencies = (
  moduleGraph: ModuleGraph,
  compiledModule: ModuleNode,
  dependencies: readonly string[],
): void => {
  // モジュールマップに祖先を追加
  for (const dependency of dependencies) {
    try {
      const depModules = moduleGraph.getModulesByFile(dependency)
      let depModule: ModuleNode | undefined
      
      if (depModules && depModules.size > 0) {
        depModule = [...depModules][0]
      } else {
        // Vite 7では createFileOnlyEntry の代わりに ensureEntryFromUrl を使用
        const depUrl = dependency.replace(process.cwd(), '').replace(/\\/g, '/')
        depModule = moduleGraph.getModuleById(depUrl) || undefined
      }
      
      if (depModule) {
        depModule.importers.add(compiledModule) // TODO: 依存関係から削除された場合の処理
        compiledModule.importedModules.add(depModule) // オプション
      }
    } catch (error) {
      // 祖先モジュールの処理に失敗した場合はログを出力して続行
      outputLog('warn', 'dependency module processing failed:', dependency)
    }
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
      // Vite 7では直接fileToModulesMapを操作できないため、
      // モジュールの無効化を通じてファイルパスを更新
      if (compiledModule.file) {
        moduleGraph.invalidateModule(compiledModule)
      }
      compiledModule.file = pugPath
      // Vite 7ではModuleGraphが自動的にfileToModulesMapを管理
    }

    // 開発モードではtransformResultの有無に関わらず常に最新のコンパイルを実行
    // これによりファイル変更時の内容更新を確実にする
    // （本番ビルド時はこの関数は使用されないため性能に影響しない）

    // コンパイル開始
    const map = null

    const compiledTemplate = compileFile(
      pugPath,
      options,
    ) as CompiledTemplateWithDeps

    // Pugコンパイラから祖先情報を取得
    const dependencies = compiledTemplate.dependencies
    if (dependencies.length > 0) {
      registerDependencies(moduleGraph, compiledModule, dependencies)
    }

    // HTML生成
    const code = compiledTemplate(locals)

    outputLog('info', 'compiled:', path.relative(process.cwd(), pugPath))

    compiledModule.transformResult = { code, map }
    
    return true
  } catch (error: unknown) {
    outputLog('error', 'compilation failed:', pugPath, String(error))
    
    return error instanceof Error ? error : new Error(String(error))
  }
}
