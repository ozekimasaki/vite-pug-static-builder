import { access, constants } from 'node:fs/promises'
import path from 'node:path'

import ansis from 'ansis'
import { createLogger } from 'vite'

const logger = createLogger()

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
  return path.posix.format({
    dir: parsed.dir,
    name: parsed.name,
    ext: '.html',
  })
}
