import { describe, it, expect } from 'vitest'
import { COLOR_PRESETS, CUSTOM_DEFAULT, buildSwatches } from '../src/backdrop'

describe('buildSwatches', () => {
  it('shows only presets when the saved colour is a preset (case-insensitive)', () => {
    expect(buildSwatches('#F87171').map((s) => s.key)).toEqual(COLOR_PRESETS.map((h) => h.slice(1).toLowerCase()))
  })

  it('puts a non-preset (pre-upgrade or default) colour first as the "current" swatch', () => {
    const list = buildSwatches('#123456')
    expect(list).toHaveLength(COLOR_PRESETS.length + 1)
    expect(list[0]).toEqual({ value: '#123456', key: 'current' })
  })

  it('falls back to the default for an empty value (no current swatch)', () => {
    expect(buildSwatches('')[0]).toEqual({ value: CUSTOM_DEFAULT, key: 'current' })
  })
})
