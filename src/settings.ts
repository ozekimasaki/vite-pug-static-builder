import type Pug from 'pug'

import type { BuildSettings } from './build.js'
import type { ServeSettings } from './serve.js'
import { outputLog } from './utils.js'

/**
 * プラグイン設定
 */
export interface Settings {
  /** ビルド時の設定 */
  readonly build?: BuildSettings
  /** 開発サーバー時の設定 */
  readonly serve?: ServeSettings
}

/**
 * 旧API（vite_template-general などが使用）
 *
 * @deprecated `build.options` / `serve.reload` を使ってください
 */
export interface LegacySettings {
  /** @deprecated `build.options` と `serve.options` を使ってください */
  readonly buildOptions?: Pug.Options
  /** @deprecated `serve.reload` を使ってください */
  readonly watch?: boolean
}

export type PluginSettings = Settings & LegacySettings

export interface ResolvedSettings {
  readonly build: BuildSettings
  readonly serve: ServeSettings
}

const setIfDefined = <T extends object, K extends keyof T>(
  target: T,
  key: K,
  value: T[K] | undefined,
): void => {
  if (value !== undefined) {
    target[key] = value
  }
}

/**
 * 現行APIと旧APIを正規化する
 */
export const resolveSettings = (
  userSettings?: PluginSettings,
): ResolvedSettings => {
  if (!userSettings) {
    return { build: {}, serve: {} }
  }

  const hasLegacy =
    userSettings.buildOptions !== undefined || userSettings.watch !== undefined

  if (hasLegacy) {
    outputLog(
      'warn',
      'deprecated:',
      '`buildOptions` / `watch` は非推奨です。`build` / `serve` を使ってください',
    )
  }

  const build: BuildSettings = {}
  setIfDefined(
    build,
    'options',
    userSettings.build?.options ?? userSettings.buildOptions,
  )
  setIfDefined(build, 'locals', userSettings.build?.locals)

  const serve: ServeSettings = {}
  setIfDefined(
    serve,
    'options',
    userSettings.serve?.options ?? userSettings.buildOptions,
  )
  setIfDefined(serve, 'locals', userSettings.serve?.locals)
  setIfDefined(serve, 'ignorePattern', userSettings.serve?.ignorePattern)
  setIfDefined(serve, 'reload', userSettings.serve?.reload ?? userSettings.watch)

  return { build, serve }
}
