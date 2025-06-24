import path from 'node:path'
import { fileURLToPath } from 'node:url'

import fse from 'fs-extra'
import { beforeAll, afterAll, describe, test, expect } from 'vitest'
import { build } from 'vite'
import type { UserConfig } from 'vite'

import pugPlugin from '../src/index.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const srcdir = path.resolve(__dirname, 'src')
const distdir = path.resolve(__dirname, 'dist')

const config: UserConfig = {
  root: srcdir,
  build: {
    outDir: distdir,
    emptyOutDir: true,
    rollupOptions: {
      input: {
        home: '__tests__/src/index.pug',
        foo: '__tests__/src/html/index.html',
        bar: '__tests__/src/sample.ts',
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
} as const

beforeAll(async () => {
  await build(config)
})

afterAll(async () => {
  await fse.remove(distdir)
})

describe('build', () => {
  test('get root', async () => {
    const content = await fse.readFile(path.join(distdir, 'index.html'), 'utf-8')
    expect(content).toMatchInlineSnapshot(
      '"<!DOCTYPE html><html><head></head><body><h1>build</h1><p>partial</p></body></html>"',
    )
  })

  test('get subdir', async () => {
    const content = await fse.readFile(path.join(distdir, 'html/index.html'), 'utf-8')
    expect(content).toMatchInlineSnapshot(`
      "<!DOCTYPE html>
      <html>
      <head>
      </head>
      <body>
      <p>html</p>
      </body>
      </html>
      "
    `)
  })

  test('get asset', async () => {
    // 動的に生成されるアセットファイル名を検索
    const assetsDir = path.join(distdir, 'assets')
    const files = await fse.readdir(assetsDir)
    const jsFile = files.find(file => file.startsWith('bar-') && file.endsWith('.js'))
    
    expect(jsFile).toBeDefined()
    
    if (jsFile) {
      const content = await fse.readFile(path.join(assetsDir, jsFile), 'utf-8')
      expect(content).toMatchInlineSnapshot(`
        "console.log("bar");
        "
      `)
    }
  })
})
