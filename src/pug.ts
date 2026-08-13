import path from 'node:path'

import { compileFile } from 'pug'
import type Pug from 'pug'

import { outputLog, pugDependencies, toPosixPath } from './utils.js'

type Watchable = {
  add: (id: string) => unknown
}

type PugModuleLike<T> = {
  file?: string | null
  importers: Set<T>
  importedModules: Set<T>
  transformResult: { code: string; map?: unknown } | null
}

type PugModuleGraphLike<T extends PugModuleLike<T>> = {
  getModuleByUrl: (url: string) => Promise<T | undefined>
  ensureEntryFromUrl: (url: string) => Promise<T>
  getModulesByFile: (file: string) => Iterable<T> | undefined
  invalidateModule: (mod: T) => void
  createFileOnlyEntry?: (file: string) => T
}

const firstModule = <T>(modules: Iterable<T> | undefined): T | undefined => {
  if (!modules) return undefined
  const iterator = modules[Symbol.iterator]()
  return iterator.next().value
}

/**
 * include / extends の依存をモジュールグラフと watcher に登録する
 */
const registerDependencies = async <T extends PugModuleLike<T>>(
  moduleGraph: PugModuleGraphLike<T>,
  compiledModule: T,
  dependencies: readonly string[],
  watcher?: Watchable,
): Promise<void> => {
  await Promise.all(
    dependencies.map(async (dependency) => {
      const normalized = path.normalize(dependency)
      watcher?.add(normalized)

      try {
        let depModule = firstModule(moduleGraph.getModulesByFile(normalized))

        if (!depModule) {
          if (moduleGraph.createFileOnlyEntry) {
            depModule = moduleGraph.createFileOnlyEntry(normalized)
          } else {
            const fsUrl = `/@fs/${toPosixPath(normalized)}`
            depModule = await moduleGraph.ensureEntryFromUrl(fsUrl)
            depModule.file = normalized
          }
        }

        depModule.importers.add(compiledModule)
        compiledModule.importedModules.add(depModule)
      } catch {
        outputLog('warn', 'dependency module processing failed:', normalized)
      }
    }),
  )
}

/**
 * Pugファイルをコンパイルして moduleGraph に HTML を載せる
 */
export const compilePug = async <T extends PugModuleLike<T>>(
  moduleGraph: PugModuleGraphLike<T>,
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
