/**
 * VITE_MAJOR_VERSION 環境変数に応じて対応する Vite を読み込むヘルパー
 * （6 / 7 はエイリアスパッケージ vite6 / vite7 を使用、デフォルトは最新の vite）
 */
export const loadVite = async (): Promise<typeof import('vite')> => {
  const major = process.env.VITE_MAJOR_VERSION
  const specifier = major === '6' ? 'vite6' : major === '7' ? 'vite7' : 'vite'
  return (await import(specifier)) as typeof import('vite')
}
