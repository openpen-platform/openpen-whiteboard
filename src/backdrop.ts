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
