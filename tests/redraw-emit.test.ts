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
  AppButtonDropdown: {
    name: 'AppButtonDropdown',
    emits: ['main-click', 'caret-click'],
    template:
      `<div><button class="main" @click="$emit('main-click')" /><button class="caret" @click="$emit('caret-click')" /><slot name="popover-content" /></div>`,
  },
  AppPopoverPanel: { template: '<div><slot /></div>' },
  AppPopoverRow: { props: ['label'], template: '<div><slot /></div>' },
  AppSegmented: {
    name: 'AppSegmented',
    props: ['modelValue', 'options'],
    emits: ['update:modelValue'],
    template: '<div />',
  },
  AppSwatchPicker: {
    name: 'AppSwatchPicker',
    props: ['modelValue', 'colors'],
    emits: ['update:modelValue'],
    template: '<div />',
  },
}))
vi.mock('@openpen/module-api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@openpen/module-api')>()
  return { ...actual, useModuleContext: () => h.ctx }
})

import { AppSegmented, AppSwatchPicker } from '@openpen/module-api/uikit'
import whiteboard from '../src/index'
import ToggleButton from '../src/WhiteboardToggleButton.vue'
import Options from '../src/WhiteboardOptions.vue'

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
    await wrapper.find('button.main').trigger('click')
    await flushPromises()

    expect(updateSettings).toHaveBeenCalledTimes(1)
    expect(updateSettings).toHaveBeenCalledWith({ enabled: true })
    expect(emit).not.toHaveBeenCalled()
  })

  it('opening the caret turns the backdrop on so edits are visible', async () => {
    const wrapper = mount(ToggleButton)
    await wrapper.find('button.caret').trigger('click')
    await flushPromises()

    expect(updateSettings).toHaveBeenCalledWith({ enabled: true })
  })
})

describe('WhiteboardOptions (caret panel) does not emit', () => {
  it('writes updateSettings on setMode but never emits', async () => {
    const wrapper = mount(Options)
    wrapper.findComponent(AppSegmented).vm.$emit('update:modelValue', 'black')
    await flushPromises()

    expect(updateSettings).toHaveBeenCalledWith({ mode: 'black' })
    expect(emit).not.toHaveBeenCalled()
  })

  it('picking a swatch writes only the colour, no emit', async () => {
    const wrapper = mount(Options)
    wrapper.findComponent(AppSwatchPicker).vm.$emit('update:modelValue', '#60A5FA')
    await flushPromises()

    expect(updateSettings).toHaveBeenCalledWith({ customColor: '#60A5FA' })
    expect(emit).not.toHaveBeenCalled()
  })

  it('shows a pre-upgrade custom colour as the "current" swatch', async () => {
    ctx.getSettings = () => ({ enabled: false, mode: 'custom', customColor: '#123456' })
    const wrapper = mount(Options)
    await flushPromises()
    const colors = wrapper.findComponent(AppSwatchPicker).props('colors') as { value: string; testid: string }[]
    const cur = colors.find((c) => c.testid === 'whiteboard-swatch-current')
    expect(cur?.value).toBe('#123456')
    expect(wrapper.findComponent(AppSwatchPicker).props('modelValue')).toBe('#123456')
    ctx.getSettings = () => ({ enabled: false, mode: 'white', customColor: '#1e1e1e' })
  })
})
