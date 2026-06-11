import { describe, it, expect, vi } from 'vitest'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'

vi.mock('@openpen/module-api/host', () => ({ emit: vi.fn(), on: vi.fn() }))
vi.mock('@openpen/module-api/uikit', () => ({ AppButton: {}, AppSegmented: {} }))

import whiteboard, { MODULE_ID } from '../src/index'

describe('defineModule contract', () => {
  it('declares the canonical id and version', () => {
    expect(whiteboard.id).toBe('@openpen/whiteboard')
    expect(MODULE_ID).toBe('@openpen/whiteboard')
    expect(whiteboard.version).toBe('1.0.0')
  })

  it('contributes a backgroundLayer with a render fn', () => {
    const layers = whiteboard.contributes!.backgroundLayers!
    expect(layers).toHaveLength(1)
    expect(typeof layers[0].render).toBe('function')
  })

  it('contributes a control bar button and a settings panel', () => {
    expect(whiteboard.contributes!.controlBar!).toHaveLength(1)
    expect(whiteboard.contributes!.controlBar![0].defaultGroup).toBe('tools')
    expect(whiteboard.contributes!.settingsPanels!).toHaveLength(1)
    expect(whiteboard.contributes!.settingsPanels![0].component).toBeTruthy()
  })

  it('settingsSchema parses defaults: enabled/mode/customColor', () => {
    const parsed = whiteboard.settingsSchema!.parse({}) as Record<string, unknown>
    expect(parsed.enabled).toBe(false)
    expect(parsed.mode).toBe('white')
    expect(parsed.customColor).toBe('#2e7d32')
  })

  it('settingsSchema rejects an invalid mode', () => {
    expect(() => whiteboard.settingsSchema!.parse({ mode: 'rainbow' })).toThrow()
  })
})

function walk(dir: string): string[] {
  const out: string[] = []
  for (const e of readdirSync(dir)) {
    const p = join(dir, e)
    if (statSync(p).isDirectory()) out.push(...walk(p))
    else out.push(p)
  }
  return out
}

describe('import boundary', () => {
  const srcDir = join(__dirname, '..', 'src')
  const sources = walk(srcDir).filter((f) => /\.(ts|vue)$/.test(f))
  const blob = sources.map((f) => readFileSync(f, 'utf8')).join('\n')

  it('never imports host/registry (host-only internal)', () => {
    expect(blob).not.toMatch(/@openpen\/module-api\/host\/registry/)
    expect(blob).not.toMatch(/\/host\/registry/)
  })

  it('never imports vue-i18n directly (i18n goes through ctx.t)', () => {
    expect(blob).not.toMatch(/vue-i18n/)
  })

  it('imports emit only from @openpen/module-api/host', () => {
    // Every file that names emit must source it from the host entrypoint.
    for (const f of sources) {
      const src = readFileSync(f, 'utf8')
      if (/\bemit\b/.test(src)) {
        expect(src).toMatch(/from ['"]@openpen\/module-api\/host['"]/)
      }
    }
  })
})
