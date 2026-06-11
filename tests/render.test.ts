import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { ModuleSetupContext } from '@openpen/module-api'

// The .vue components imported by index.ts pull in the host event bus and
// uikit at module-eval time. Neither is exercised by the render path, so stub
// them to keep this test focused on the canvas background layer.
vi.mock('@openpen/module-api/host', () => ({ emit: vi.fn(), on: vi.fn() }))
vi.mock('@openpen/module-api/uikit', () => ({ AppButton: {}, AppSegmented: {} }))

import whiteboard from '../src/index'
import { resolveBackdropColor } from '../src/backdrop'

interface LiveSettings {
  enabled: boolean
  mode: 'white' | 'black' | 'custom'
  customColor: string
}

/** Drives the module's setup() so the layer renderer reads `settings`. */
async function hydrate(settings: LiveSettings) {
  const ctx = {
    moduleId: '@openpen/whiteboard',
    locale: 'en',
    getSettings: <T>() => settings as unknown as T,
    onSettingsChange: () => () => {},
    onDispose: () => {},
  } as unknown as ModuleSetupContext
  await whiteboard.setup!(ctx)
}

/** A canvas context double that records fillStyle assignments + fillRect calls. */
function mockCtx(width = 800, height = 600) {
  const fillStyles: string[] = []
  let _fillStyle = ''
  const ctx = {
    canvas: { width, height },
    save: vi.fn(),
    restore: vi.fn(),
    fillRect: vi.fn(),
    clearRect: vi.fn(),
    drawImage: vi.fn(),
    get fillStyle() {
      return _fillStyle
    },
    set fillStyle(v: string) {
      _fillStyle = v
      fillStyles.push(v)
    },
  }
  return { ctx: ctx as unknown as CanvasRenderingContext2D, raw: ctx, fillStyles }
}

function backgroundRender() {
  const layers = whiteboard.contributes!.backgroundLayers!
  return layers[0].render
}

describe('backgroundLayers render', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('fills the full canvas with the resolved colour when enabled (white)', async () => {
    await hydrate({ enabled: true, mode: 'white', customColor: '#123456' })
    const { ctx, raw, fillStyles } = mockCtx(800, 600)

    backgroundRender()(ctx)

    expect(raw.fillRect).toHaveBeenCalledTimes(1)
    expect(raw.fillRect).toHaveBeenCalledWith(0, 0, 800, 600)
    expect(fillStyles).toContain(resolveBackdropColor('white', '#123456'))
    expect(fillStyles).toContain('#ffffff')
  })

  it('uses the black colour when mode is black', async () => {
    await hydrate({ enabled: true, mode: 'black', customColor: '#123456' })
    const { ctx, raw, fillStyles } = mockCtx()

    backgroundRender()(ctx)

    expect(raw.fillRect).toHaveBeenCalledTimes(1)
    expect(fillStyles).toContain('#1e1e1e')
  })

  it('uses the custom colour when mode is custom', async () => {
    await hydrate({ enabled: true, mode: 'custom', customColor: '#00ff88' })
    const { ctx, raw, fillStyles } = mockCtx()

    backgroundRender()(ctx)

    expect(raw.fillRect).toHaveBeenCalledTimes(1)
    expect(fillStyles).toContain('#00ff88')
  })

  it('does NOT fill the canvas when disabled (no desktop cover-up)', async () => {
    await hydrate({ enabled: false, mode: 'white', customColor: '#123456' })
    const { ctx, raw, fillStyles } = mockCtx()

    backgroundRender()(ctx)

    expect(raw.fillRect).not.toHaveBeenCalled()
    expect(fillStyles).toHaveLength(0)
  })

  it('never clears or redraws strokes — it only fills (stroke preservation)', async () => {
    await hydrate({ enabled: true, mode: 'white', customColor: '#123456' })
    const { ctx, raw } = mockCtx()

    backgroundRender()(ctx)

    // A background layer must not erase the canvas; stroke preservation relies
    // on the host painting strokes AFTER this layer, not on the plugin.
    expect(raw.clearRect).not.toHaveBeenCalled()
    expect(raw.drawImage).not.toHaveBeenCalled()
  })

  it('declares the background layer at order 0 with a render fn', () => {
    const layer = whiteboard.contributes!.backgroundLayers![0]
    expect(layer.id).toBe('whiteboard')
    expect(layer.order).toBe(0)
    expect(typeof layer.render).toBe('function')
  })
})
