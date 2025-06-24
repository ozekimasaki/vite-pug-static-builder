import { vitePluginPugBuild, type BuildSettings } from './build.js'
import { vitePluginPugServe, type ServeSettings } from './serve.js'

/**
 * プラグイン設定
 */
interface Settings {
  /** ビルド時の設定 */
  readonly build?: BuildSettings
  /** 開発サーバー時の設定 */
  readonly serve?: ServeSettings
}

const defaultSettings: Settings = {}

/**
 * Vite Pug静的サイトプラグイン
 * @param userSettings - ユーザー設定
 * @returns Viteプラグイン配列
 */
const vitePluginPugStatic = (userSettings?: Settings) => {
  const settings: Settings = {
    ...defaultSettings,
    ...userSettings,
  }

  return [vitePluginPugBuild(settings.build), vitePluginPugServe(settings.serve)]
}

export default vitePluginPugStatic
