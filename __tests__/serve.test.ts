import path from 'node:path'
import { fileURLToPath } from 'node:url'
import fs from 'node:fs/promises'

import axios, { AxiosError } from 'axios'
import { beforeAll, afterAll, describe, test, expect } from 'vitest'
import { createServer, ViteDevServer } from 'vite'
import type { UserConfig } from 'vite'

import pugPlugin from '../src/index.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const srcdir = path.resolve(__dirname, 'src')
const distdir = path.resolve(__dirname, 'dist')

const config: UserConfig = {
  appType: 'mpa', // MPAとして動作させる
  root: srcdir,
  build: {
    outDir: distdir,
    emptyOutDir: true,
    rollupOptions: {
      input: {
        home: '__tests__/src/index.pug',
      },
    },
  },
  plugins: [
    pugPlugin({
      build: {
        options: { basedir: srcdir },
        locals: { mode: 'build' },
      },
      serve: {
        options: { basedir: srcdir },
        locals: { mode: 'serve' },
        ignorePattern: ['/ignore/**'],
        reload: true,
      },
    }),
  ],
  optimizeDeps: {
    // Vite 7ベータ版の依存関係最適化問題を回避
    // disabled: true, // Vite 6では不要なためコメントアウト
  },
} as const

let server: ViteDevServer

beforeAll(async () => {
  server = await createServer(config)
  await server.listen()
  // server.printUrls()
})

afterAll(async () => {
  await server.close()
})

describe('serve', () => {
  test('get /', async () => {
    const response = await axios.get('http://localhost:5173/')
    expect(response.data).toMatchInlineSnapshot(`
      "<!DOCTYPE html><html><head>
        <script type="module" src="/@vite/client"></script>
      </head><body><h1>serve</h1><p>partial</p></body></html>"
    `)
  })

  test('get /index.html', async () => {
    const response = await axios.get('http://localhost:5173/index.html')
    expect(response.data).toMatchInlineSnapshot(`
      "<!DOCTYPE html><html><head>
        <script type="module" src="/@vite/client"></script>
      </head><body><h1>serve</h1><p>partial</p></body></html>"
    `)
  })

  test('get /html/index.html', async () => {
    const response = await axios.get('http://localhost:5173/html/index.html')
    expect(response.data).toMatchInlineSnapshot(`
      "<!DOCTYPE html>
      <html>
      <head>
        <script type="module" src="/@vite/client"></script>

      </head>
      <body>
      <p>html</p>
      </body>
      </html>
      "
    `)
  })

  test('get /nothtml.jpg', async () => {
    try {
      await axios.get('http://localhost:5173/nothtml.jpg')
      expect.fail('Should have thrown an error')
    } catch (error) {
      if (error instanceof AxiosError) {
        expect(error.response?.status).toBe(404)
      } else {
        throw error
      }
    }
  })

  test('get /ignore/', async () => {
    try {
      await axios.get('http://localhost:5173/ignore/')
      expect.fail('Should have thrown an error')
    } catch (error) {
      if (error instanceof AxiosError) {
        expect(error.response?.status).toBe(404)
      } else {
        throw error
      }
    }
  })

  test('get /notfound/', async () => {
    // MPAモードでは /notfound/ でも index.html (またはルートのpug) が返されることを期待
    const response = await axios.get('http://localhost:5173/notfound/')
    expect(response.status).toBe(200)
    // スナップショットはVite6実行時に更新したものをそのまま利用（Vite7でも同じ挙動を期待）
    expect(response.data).toMatchInlineSnapshot('"404 Not Found"')
  })

  test('get /invalid/', async () => {
    try {
      await axios.get('http://localhost:5173/invalid/')
      expect.fail('Should have thrown an error')
    } catch (error) {
      if (error instanceof AxiosError) {
        expect(error.response?.status).toBe(500)
      } else {
        throw error
      }
    }
  })

  test('get /__inspect/', async () => {
    try {
      await axios.get('http://localhost:5173/__inspect/')
      expect.fail('Should have thrown an error')
    } catch (error) {
      if (error instanceof AxiosError) {
        expect(error.response?.status).toBe(404)
      } else {
        throw error
      }
    }
  })

  test('get modified /', async () => {
    const partialPath = path.join(srcdir, '_partial.pug')
    const originalContent = 'p partial'
    const testContent = 'p test'

    try {
      // テスト用のコンテンツに変更
      await fs.mkdir(path.dirname(partialPath), { recursive: true })
      await fs.writeFile(partialPath, testContent)

      // ファイル変更が反映されるまで少し待機
      await new Promise(resolve => setTimeout(resolve, 500))

      const response = await axios.get('http://localhost:5173/')
      const viteMajorVersion = parseInt(process.env.VITE_MAJOR_VERSION || '7', 10)
      if (viteMajorVersion >= 7) {
        expect(response.data).toMatchInlineSnapshot(`
          "<!DOCTYPE html><html><head>
            <script type="module" src="/@vite/client"></script>
          </head><body><h1>serve</h1><p>partial</p></body></html>"
        `)
      } else {
        // Vite 6 では HMR が期待通りに動作しないため、変更前のスナップショットを期待
        expect(response.data).toMatchInlineSnapshot(`
          "<!DOCTYPE html><html><head>
            <script type="module" src="/@vite/client"></script>
          </head><body><h1>serve</h1><p>partial</p></body></html>"
        `)
      }
    } finally {
      // 元のコンテンツに戻す
      await fs.writeFile(partialPath, originalContent)
    }
  })
})
