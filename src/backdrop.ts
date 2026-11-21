/**
 * Pure backdrop-colour resolution — no canvas, no DOM. Kept side-effect free
 * so the mode → colour mapping can be unit-tested in isolation.
 */

/** Backdrop modes. `white` / `black` are fixed; `custom` uses `customColor`. */
export type WhiteboardMode = 'white' | 'black' | 'custom'

/** Fixed backdrop colour for the `white` mode. */
export const WHITE_COLOR = '#ffffff'

/** Fixed backdrop colour for the `black` mode (soft black, easier on the eyes than #000). */
export const BLACK_COLOR = '#1e1e1e'

export interface WhiteboardSettings {
  mode: WhiteboardMode
  customColor: string
}

/**
 * Resolve the effective backdrop fill colour for the given mode.
 * `white` / `black` ignore `customColor`; `custom` returns it verbatim.
 */
export function resolveBackdropColor(mode: WhiteboardMode, customColor: string): string {
  switch (mode) {
    case 'white':
      return WHITE_COLOR
    case 'black':
      return BLACK_COLOR
    case 'custom':
      return customColor
  }
}

/** Default custom backdrop colour (a chalkboard green). */
export const CUSTOM_DEFAULT = '#2e7d32'

/** One-click custom colours offered by the control-bar panel (the control bar's pen palette, minus white). */
export const COLOR_PRESETS: readonly string[] = [
  '#F87171',
  '#FB923C',
  '#FBBF24',
  '#34D399',
  '#60A5FA',
  '#818CF8',
  '#F472B6',
]

export interface Swatch {
  value: string
  /** Preset hex without `#` (used for label/testid keys), or `current` for a colour that is not a preset. */
  key: string
}

/**
 * Swatches for the panel: the presets, preceded by the saved custom colour as
 * one "current" swatch when it is not a preset (a pre-upgrade colour, or the
 * default chalkboard green), so the panel always shows the stored value.
 */
export function buildSwatches(customColor: string): Swatch[] {
  const list: Swatch[] = COLOR_PRESETS.map((hex) => ({ value: hex, key: hex.slice(1).toLowerCase() }))
  const saved = typeof customColor === 'string' && customColor.trim() ? customColor : CUSTOM_DEFAULT
  if (!COLOR_PRESETS.some((hex) => hex.toLowerCase() === saved.toLowerCase())) {
    list.unshift({ value: saved, key: 'current' })
  }
  return list
}
