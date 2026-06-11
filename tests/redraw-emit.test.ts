import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import type { ModuleSetupContext } from '@openpen/module-api'

// Hoisted so the vi.mock factories (themselves hoisted) can reference them.
const h = vi.hoisted(() => {
  const emit = vi.fn()
  const updateSettings = vi.fn().mockResolvedValue(undefined)
  const ctx = {
    moduleId: '@openpen/whiteboard',
    locale: 'en',
    getSettings: () => ({ enabled: false, mode: 'white', customColor: '#1e1e1e' }),
    updateSettings,
    onSettingsChange: () => () => {},
    onDispose: () => {},
    t: (k: string) => k,
  }
  return { emit, updateSettings, ctx }
})
const { emit, updateSettings, ctx } = h

vi.mock('@openpen/module-api/host', () => ({ emit: h.emit, on: vi.fn() }))
vi.mock('@openpen/module-api/uikit', () => ({
  // Functional stubs that preserve the click / model-value contract the
  // components rely on, so the toggle / setMode handlers actually fire.
  AppButton: {
    name: 'AppButton',
    emits: ['click'],
    template: '<button @click="$emit(\'click\')"><slot /></button>',
  },
  AppSegmented: {
    name: 'AppSegmented',
    props: ['modelValue', 'options'],
    emits: ['update:modelValue'],
    template: '<div />',
  },
}))
vi.mock('@openpen/module-api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@openpen/module-api')>()
  return { ...actual, useModuleContext: () => h.ctx }
})

import { AppSegmented } from '@openpen/module-api/uikit'
import whiteboard from '../src/index'
import ToggleButton from '../src/WhiteboardToggleButton.vue'
import SettingsPanel from '../src/WhiteboardSettingsPanel.vue'

beforeEach(() => {
  emit.mockClear()
  updateSettings.mockClear()
})

// The redraw fix lives in setup()'s onSettingsChange, which runs in the overlay
// window alongside the canvas engine — the only window whose renderer event bus
// the engine listens on. These tests pin that emit to setup, and assert the
// control-bar components stay emit-free (an emit from the control-bar window
// would never reach the engine).
describe('setup() onSettingsChange emit (overlay window)', () => {
  /** Drives setup() and returns the registered settings-change callback. */
  async function runSetup() {
    let changeCb: ((s: unknown) => void) | undefined
    const setupCtx = {
      moduleId: '@openpen/whiteboard',
      locale: 'en',
      getSettings: <T>() => ({ enabled: false, mode: 'white', customColor: '#1e1e1e' }) as unknown as T,
      onSettingsChange: <T>(cb: (s: T) => void) => {
        changeCb = cb as (s: unknown) => void
        return () => {}
      },
      onDispose: () => {},
    } as unknown as ModuleSetupContext
    await whiteboard.setup!(setupCtx)
    return changeCb!
  }

  it('does NOT emit on initial hydrate (getSettings), only on change', async () => {
    await runSetup()
    expect(emit).not.toHaveBeenCalled()
  })

  it('emits canvas-redraw-requested when settings change', async () => {
    const changeCb = await runSetup()
    expect(emit).not.toHaveBeenCalled()

    changeCb({ enabled: true, mode: 'white', customColor: '#1e1e1e' })

    expect(emit).toHaveBeenCalledTimes(1)
    expect(emit).toHaveBeenCalledWith('canvas-redraw-requested')
  })

  it('emits again on each subsequent change (mode flip)', async () => {
    const changeCb = await runSetup()
    changeCb({ enabled: true, mode: 'white', customColor: '#1e1e1e' })
    changeCb({ enabled: true, mode: 'black', customColor: '#1e1e1e' })

    expect(emit).toHaveBeenCalledTimes(2)
    expect(emit).toHaveBeenNthCalledWith(1, 'canvas-redraw-requested')
    expect(emit).toHaveBeenNthCalledWith(2, 'canvas-redraw-requested')
  })
})

// The components moved the emit out: the control-bar window cannot reach the
// overlay engine, so emitting there is dead code. They MUST only write settings.
describe('WhiteboardToggleButton does not emit', () => {
  it('writes updateSettings on toggle but never emits', async () => {
    const wrapper = mount(ToggleButton)
    await wrapper.find('button').trigger('click')
    await flushPromises()

    expect(updateSettings).toHaveBeenCalledTimes(1)
    expect(updateSettings).toHaveBeenCalledWith({ enabled: true })
    expect(emit).not.toHaveBeenCalled()
  })
})

describe('WhiteboardSettingsPanel does not emit', () => {
  it('writes updateSettings on setMode but never emits', async () => {
    const wrapper = mount(SettingsPanel)
    const seg = wrapper.findComponent(AppSegmented)
    seg.vm.$emit('update:modelValue', 'black')
    await flushPromises()

    expect(updateSettings).toHaveBeenCalledWith({ mode: 'black' })
    expect(emit).not.toHaveBeenCalled()
  })

  it('writes updateSettings on setCustomColor but never emits', async () => {
    ctx.getSettings = () => ({ enabled: false, mode: 'custom', customColor: '#1e1e1e' })
    const wrapper = mount(SettingsPanel)
    await flushPromises()
    const input = wrapper.find('input[type="color"]')
    expect(input.exists()).toBe(true)
    ;(input.element as HTMLInputElement).value = '#abcdef'
    await input.trigger('input')
    await flushPromises()

    expect(updateSettings).toHaveBeenCalledWith({ customColor: '#abcdef' })
    expect(emit).not.toHaveBeenCalled()
    ctx.getSettings = () => ({ enabled: false, mode: 'white', customColor: '#1e1e1e' })
  })
})
