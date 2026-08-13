import path from 'node:path'
import { win32 } from 'node:path'
import { describe, expect, test } from 'vitest'

import {
  pugFileToHtmlUrl,
  replaceExtPosix,
  resolveHtmlRequestPath,
  toPosixPath,
} from '../src/utils.js'

describe('クロスプラットフォームのパス処理', () => {
  test('toPosixPath は Windows の区切りを / にする', () => {
    expect(toPosixPath('src\\pages\\index.pug')).toBe('src/pages/index.pug')
    expect(toPosixPath('C:\\site\\index.pug')).toBe('C:/site/index.pug')
    expect(toPosixPath('/site/index.pug')).toBe('/site/index.pug')
  })

  test('replaceExtPosix は区切りを崩さず拡張子だけ変える', () => {
    expect(replaceExtPosix('C:\\site\\src\\index.pug', '.html')).toBe(
      'C:/site/src/index.html',
    )
    expect(replaceExtPosix('/site/src/index.pug', '.html')).toBe(
      '/site/src/index.html',
    )
  })

  test('resolveHtmlRequestPath は URL を root 配下の HTML にする', () => {
    const root = path.resolve('/site')
    expect(resolveHtmlRequestPath(root, '/index.html')).toBe(
      path.resolve(root, 'index.html'),
    )
    expect(resolveHtmlRequestPath(root, '/blog/')).toBe(
      path.resolve(root, 'blog/index.html'),
    )
    expect(resolveHtmlRequestPath(root, '/subdir/page.html')).toBe(
      path.resolve(root, 'subdir/page.html'),
    )
  })

  test('pugFileToHtmlUrl はルートからの相対を /foo.html にする', () => {
    expect(pugFileToHtmlUrl('/site/src/about.pug', '/site')).toBe(
      '/src/about.html',
    )
    expect(pugFileToHtmlUrl('/site/index.pug', '/site')).toBe('/index.html')
  })

  test('win32.relative の結果も HTML URL にできる', () => {
    const relative = win32.relative(
      'C:\\site',
      'C:\\site\\src\\about.pug',
    )
    expect(toPosixPath(relative)).toBe('src/about.pug')
    const parsed = path.posix.parse(`/${toPosixPath(relative)}`)
    expect(
      path.posix.join(
        parsed.dir === '/' ? '/' : parsed.dir,
        `${parsed.name}.html`,
      ),
    ).toBe('/src/about.html')
  })
})
