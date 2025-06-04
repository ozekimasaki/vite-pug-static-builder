import { test, expect, describe } from 'vitest'

import { outputLog } from '../src/utils.js'

describe('utils', () => {
  test('outputLog with all parameters', () => {
    expect(() => outputLog('info', 'green', 'yellow', 'dim')).not.toThrow()
  })

  test('outputLog with partial parameters', () => {
    expect(() => outputLog('info', 'green', '', '')).not.toThrow()
    expect(() => outputLog('warn', '', 'yellow', '')).not.toThrow()
    expect(() => outputLog('error', '', '', 'dim')).not.toThrow()
  })

  test('outputLog with minimal parameters', () => {
    expect(() => outputLog('info')).not.toThrow()
    expect(() => outputLog('warn')).not.toThrow()
    expect(() => outputLog('error')).not.toThrow()
    expect(() => outputLog('warnOnce')).not.toThrow()
  })
})
