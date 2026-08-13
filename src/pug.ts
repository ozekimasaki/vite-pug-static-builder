import path from 'node:path'

import { compileFile } from 'pug'
import type Pug from 'pug'
import type { ModuleGraph, ModuleNode } from 'vite'

import { outputLog, pugDependencies, toPosixPath } from './utils.js'

type Watchable = {
  add: (id: string) => unknown
}

/**
 * include / extends の依存をモジュールグラフと watcher に登録する
 */
const registerDependencies = async (
  moduleGraph: ModuleGraph,
  compiledModule: ModuleNode,
  dependencies: readonly string[],
  watcher?: Watchable,
): Promise<void> => {
  for (const dependency of dependencies) {
    const normalized = path.normalize(dependency)
    watcher?.add(normalized)

    try {
      const existing = moduleGraph.getModulesByFile(normalized)
      let depModule: ModuleNode | undefined =
        existing && existing.size > 0 ? [...existing][0] : undefined

      if (!depModule) {
        const fsUrl = `/@fs/${toPosixPath(normalized)}`
        depModule = await moduleGraph.ensureEntryFromUrl(fsUrl)
        depModule.file = normalized
      }

      depModule.importers.add(compiledModule)
      compiledModule.importedModules.add(depModule)
    } catch {
      outputLog('warn', 'dependency module processing failed:', normalized)
    }
  }
}

/**
 * Pugファイルをコンパイルして moduleGraph に HTML を載せる
 */
export const compilePug = async (
  moduleGraph: ModuleGraph,
  url: string,
  pugPath: string,
  options?: Pug.Options,
  locals?: Pug.LocalsObject,
  watcher?: Watchable,
): Promise<boolean | Error> => {
  try {
    const compiledModule =
      (await moduleGraph.getModuleByUrl(url)) ||
      (await moduleGraph.ensureEntryFromUrl(url))

    if (compiledModule.file !== pugPath) {
      if (compiledModule.file) {
        moduleGraph.invalidateModule(compiledModule)
      }
      compiledModule.file = pugPath
    }

    watcher?.add(pugPath)

    const compiledTemplate = compileFile(pugPath, options)
    const dependencies = pugDependencies(compiledTemplate)
    if (dependencies.length > 0) {
      await registerDependencies(
        moduleGraph,
        compiledModule,
        dependencies,
        watcher,
      )
    }

    const code = compiledTemplate(locals)
    compiledModule.transformResult = { code, map: null }

    outputLog('info', 'compiled:', path.relative(process.cwd(), pugPath))
    return true
  } catch (error: unknown) {
    outputLog('error', 'compilation failed:', pugPath, String(error))
    return error instanceof Error ? error : new Error(String(error))
  }
}
