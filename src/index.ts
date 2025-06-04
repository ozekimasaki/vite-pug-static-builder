import type Pug from 'pug'
import type Picomatch from 'picomatch'

import { vitePluginPugBuild } from './build.js'
import { vitePluginPugServe } from './serve.js'

/**
 * プラグイン設定
 */
interface Settings {
  /** ビルド時のPugコンパイルオプション */
  readonly buildOptions?: Pug.Options
  /** ビルド時のPugローカル変数 */
  readonly buildLocals?: Pug.LocalsObject
  /** 開発サーバー時のPugコンパイルオプション */
  readonly serveOptions?: Pug.Options
  /** 開発サーバー時のPugローカル変数 */
  readonly serveLocals?: Pug.LocalsObject
  /** 無視パターン */
  readonly ignorePattern?: Picomatch.Glob
  /** リロード設定 */
  readonly reload?: boolean
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

  const {
    buildOptions,
    buildLocals,
    serveOptions,
    serveLocals,
    ignorePattern,
    reload,
  } = settings

  return [
    vitePluginPugBuild({
      ...(buildOptions && { options: buildOptions }),
      ...(buildLocals && { locals: buildLocals }),
    }),
    vitePluginPugServe({
      ...(serveOptions && { options: serveOptions }),
      ...(serveLocals && { locals: serveLocals }),
      ...(ignorePattern && { ignorePattern }),
      ...(reload !== undefined && { reload }),
    }),
  ]
}

export default vitePluginPugStatic
