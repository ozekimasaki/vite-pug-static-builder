import { access, constants } from 'node:fs/promises'
import path from 'node:path'

import ansis from 'ansis'
import { createLogger } from 'vite'
import type { Logger } from 'vite'

let logger: Logger = createLogger()

export function setPluginLogger(next: Logger): void {
  logger = next
}

export function isClientEnvironment(environment: {
  name: string
  consumer?: string
}): boolean {
  return environment.consumer === 'client' || environment.name === 'client'
}

/** リクエスト URL を root 上の HTML パスへ解決する（Windows でも path.resolve） */
export function resolveHtmlRequestPath(root: string, urlPath: string): string {
  const withIndex = urlPath.endsWith('/') ? `${urlPath}index.html` : urlPath
  const relative = withIndex.startsWith('/') ? withIndex.slice(1) : withIndex
  return path.resolve(root, relative)
}

export function outputLog(
  type: 'info' | 'warn' | 'warnOnce' | 'error',
  green?: string,
  yellow?: string,
  dim?: string,
): void {
  logger[type](
    ansis.cyanBright('[pug-static]') +
      (green ? ansis.green(` ${green}`) : '') +
      (yellow ? ansis.yellow(` ${yellow}`) : '') +
      (dim ? ansis.dim(` ${dim}`) : ''),
  )
}

export async function pathExists(filePath: string): Promise<boolean> {
  try {
    await access(filePath, constants.F_OK)
    return true
  } catch {
    return false
  }
}

export function stripQueryAndHash(id: string): string {
  const hashIndex = id.indexOf('#')
  const withoutHash = hashIndex === -1 ? id : id.slice(0, hashIndex)
  const queryIndex = withoutHash.indexOf('?')
  return queryIndex === -1 ? withoutHash : withoutHash.slice(0, queryIndex)
}

export function toPosixPath(filePath: string): string {
  return filePath.replace(/\\/g, '/')
}

/** Vite のモジュール ID 用に拡張子だけ差し替える（セパレータは POSIX） */
export function replaceExtPosix(filePath: string, ext: string): string {
  const posixPath = toPosixPath(filePath)
  const parsed = path.posix.parse(posixPath)
  const dir = parsed.dir === '/' ? '/' : parsed.dir
  return path.posix.join(dir, `${parsed.name}${ext}`)
}

export function pugDependencies(template: object): readonly string[] {
  if (!('dependencies' in template) || !Array.isArray(template.dependencies)) {
    return []
  }
  return template.dependencies.filter(
    (item): item is string => typeof item === 'string',
  )
}

export function pugFileToHtmlUrl(file: string, root: string): string {
  const relative = toPosixPath(path.relative(root, file))
  const parsed = path.posix.parse(`/${relative}`)
  const dir = parsed.dir === '/' ? '/' : parsed.dir
  return path.posix.join(dir, `${parsed.name}.html`)
}
