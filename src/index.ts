import { vitePluginPugBuild } from './build.js'
import { vitePluginPugServe } from './serve.js'
import { resolveSettings, type PluginSettings } from './settings.js'

export type { BuildSettings } from './build.js'
export type { ServeSettings } from './serve.js'
export type {
  LegacySettings,
  PluginSettings,
  ResolvedSettings,
  Settings,
} from './settings.js'

/**
 * Vite Pug静的サイトプラグイン
 * @param userSettings - ユーザー設定
 * @returns Viteプラグイン配列
 */
const vitePluginPugStatic = (userSettings?: PluginSettings) => {
  const settings = resolveSettings(userSettings)
  return [vitePluginPugBuild(settings.build), vitePluginPugServe(settings.serve)]
}

export default vitePluginPugStatic
