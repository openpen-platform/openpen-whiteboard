import { describe, it, expect } from 'vitest'
import { resolveBackdropColor, WHITE_COLOR, BLACK_COLOR } from '../src/backdrop'

describe('resolveBackdropColor', () => {
  it('maps "white" to #ffffff regardless of customColor', () => {
    expect(resolveBackdropColor('white', '#abcdef')).toBe('#ffffff')
    expect(WHITE_COLOR).toBe('#ffffff')
  })

  it('maps "black" to #1e1e1e regardless of customColor', () => {
    expect(resolveBackdropColor('black', '#abcdef')).toBe('#1e1e1e')
    expect(BLACK_COLOR).toBe('#1e1e1e')
  })

  it('returns the customColor verbatim in "custom" mode', () => {
    expect(resolveBackdropColor('custom', '#123456')).toBe('#123456')
    expect(resolveBackdropColor('custom', '#00ff88')).toBe('#00ff88')
    expect(resolveBackdropColor('custom', 'rgb(1,2,3)')).toBe('rgb(1,2,3)')
  })
})
