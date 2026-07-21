import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'

import fse from 'fs-extra'
import { afterAll, beforeAll, describe, expect, test } from 'vitest'
import type { InlineConfig, ViteDevServer } from 'vite'

import vitePluginPugStatic from '../src/index.js'
import { loadVite } from './vite.js'

const fixtureRoot = path.resolve(__dirname, 'fixtures/src')
const distDir = path.resolve(__dirname, 'fixtures/dist')

const toPosix = (p: string): string => p.split(path.sep).join('/')

const buildConfig = (): InlineConfig => ({
  root: fixtureRoot,
  logLevel: 'silent',
  plugins: [
    vitePluginPugStatic({
      build: { locals: { pageTitle: 'Build Title' } },
      serve: {
        locals: { pageTitle: 'Serve Title' },
        ignorePattern: '**/ignored.html',
      },
    }),
  ],
  build: {
    outDir: distDir,
    emptyOutDir: true,
    rollupOptions: {
      input: {
        home: toPosix(path.resolve(fixtureRoot, 'index.pug')),
        page: toPosix(path.resolve(fixtureRoot, 'subdir/page.pug')),
      },
    },
  },
})

describe(`build (VITE_MAJOR_VERSION=${process.env.VITE_MAJOR_VERSION ?? 'latest'})`, () => {
  afterAll(async () => {
    await fse.remove(distDir)
  })

  test('PugファイルをHTMLとしてビルドできる', async () => {
    const { build } = await loadVite()
    await build(buildConfig())

    expect(existsSync(path.resolve(distDir, 'index.html'))).toBe(true)
    expect(existsSync(path.resolve(distDir, 'subdir/page.html'))).toBe(true)

    const indexHtml = readFileSync(path.resolve(distDir, 'index.html'), 'utf-8')
    expect(indexHtml).toContain('Hello from index')
    expect(indexHtml).toContain('Greeting for index')
    expect(indexHtml).toContain('<title>Build Title</title>')

    const pageHtml = readFileSync(path.resolve(distDir, 'subdir/page.html'), 'utf-8')
    expect(pageHtml).toContain('Hello from subdir')
  })

  test('既存のHTMLファイルも入力にできる', async () => {
    const { build } = await loadVite()
    const config = buildConfig()
    config.build!.rollupOptions = {
      input: { static: toPosix(path.resolve(fixtureRoot, 'static.html')) },
    }
    await build(config)
    const staticHtml = readFileSync(path.resolve(distDir, 'static.html'), 'utf-8')
    expect(staticHtml).toContain('Existing static HTML')
  })

  test('壊れたPugファイルはビルドエラーになる', async () => {
    const { build } = await loadVite()
    const config = buildConfig()
    config.build!.rollupOptions = {
      input: { broken: toPosix(path.resolve(fixtureRoot, 'broken.pug')) },
    }
    await expect(build(config)).rejects.toThrow()
  })
})

describe(`serve (VITE_MAJOR_VERSION=${process.env.VITE_MAJOR_VERSION ?? 'latest'})`, () => {
  let server: ViteDevServer
  let baseUrl: string

  beforeAll(async () => {
    const { createServer } = await loadVite()
    server = await createServer({
      ...buildConfig(),
      server: { host: '127.0.0.1', port: 0 },
    })
    await server.listen()
    const address = server.httpServer?.address()
    if (!address || typeof address === 'string') {
      throw new Error('Failed to get dev server address')
    }
    baseUrl = `http://127.0.0.1:${address.port}`
  })

  afterAll(async () => {
    await server?.close()
  })

  test('PugファイルをHTMLとして配信できる', async () => {
    const res = await fetch(`${baseUrl}/index.html`)
    expect(res.status).toBe(200)
    const html = await res.text()
    expect(html).toContain('Hello from index')
    expect(html).toContain('Greeting for index')
    expect(html).toContain('<title>Serve Title</title>')
  })

  test('ディレクトリアクセスでindex.pugが配信される', async () => {
    const res = await fetch(`${baseUrl}/`)
    expect(res.status).toBe(200)
    const html = await res.text()
    expect(html).toContain('Hello from index')
  })

  test('サブディレクトリのPugファイルも配信できる', async () => {
    const res = await fetch(`${baseUrl}/subdir/page.html`)
    expect(res.status).toBe(200)
    expect(await res.text()).toContain('Hello from subdir')
  })

  test('既存のHTMLファイルはそのまま配信される', async () => {
    const res = await fetch(`${baseUrl}/static.html`)
    expect(res.status).toBe(200)
    expect(await res.text()).toContain('Existing static HTML')
  })

  test('存在しないHTMLは404を返す', async () => {
    const res = await fetch(`${baseUrl}/nonexistent.html`)
    expect(await res.text()).toContain('404 Not Found')
  })

  test('ignorePatternにマッチするURLはPug変換されない', async () => {
    const res = await fetch(`${baseUrl}/ignored.html`)
    const body = await res.text()
    expect(body).not.toContain('Should be ignored')
  })

  test('HTML以外のリクエストはスキップされる', async () => {
    const res = await fetch(`${baseUrl}/@vite/client`)
    expect(res.status).toBe(200)
  })

  test('壊れたPugファイルはエラーレスポンスになる', async () => {
    const res = await fetch(`${baseUrl}/broken.html`)
    expect(res.status).toBe(500)
  })

  test('Pugファイル変更時も配信内容が更新される', async () => {
    const partialPath = path.resolve(fixtureRoot, '_partial.pug')
    const original = readFileSync(partialPath, 'utf-8')
    try {
      await fse.writeFile(
        partialPath,
        original.replace('Greeting for', 'Updated greeting for'),
      )
      await expect
        .poll(async () => {
          const res = await fetch(`${baseUrl}/index.html`)
          return res.text()
        }, { timeout: 10000 })
        .toContain('Updated greeting for index')
    } finally {
      await fse.writeFile(partialPath, original)
    }
  })
})
