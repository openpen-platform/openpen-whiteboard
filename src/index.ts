/**
 * @openpen/whiteboard — opaque whiteboard / blackboard backdrop.
 *
 * Contributes:
 *   - A background layer to `canvas.layers.background` (key `backgroundLayers`).
 *     The host calls `render(ctx)` during `redrawAllInternal` BEFORE strokes are
 *     painted, so the fill lands beneath existing ink (Epic Pen semantics:
 *     toggling the backdrop never wipes strokes).
 *   - A toggle button in the control bar 'tools' group, with a caret that opens a
 *     panel for the mode and the custom colour (no settings-page section).
 *
 * `enabled` / `mode` / `customColor` are config (not transient state), so they
 * live in a module-scoped holder hydrated from settings in setup(); the layer
 * renderer reads them at paint time. Toggling `enabled` does not by itself
 * repaint the canvas — a background-layer `render` only runs on host redraw —
 * so a settings change must emit `canvas-redraw-requested`. That emit MUST come
 * from setup()'s onSettingsChange, not from the toggle button: the button runs in
 * the control-bar window, but the canvas engine (and this background layer) render
 * in the overlay window, and the renderer event bus is per-process — an emit from
 * the button's window never reaches the overlay engine. setup() runs in the overlay
 * (it loads there to render the layer), so emitting there repaints immediately.
 */
import { defineModule, z } from '@openpen/module-api'
import { emit } from '@openpen/module-api/host'
export { MODULE_ID } from './module-id'
import { MODULE_ID } from './module-id'
import { resolveBackdropColor, type WhiteboardSettings } from './backdrop'
import WhiteboardToggleButton from './WhiteboardToggleButton.vue'
import en from './locales/en.json'
import zhHant from './locales/zh-Hant.json'
import zhHans from './locales/zh-Hans.json'
import ja from './locales/ja.json'

const settingsSchema = z.object({
  enabled: z.boolean().default(false),
  mode: z.enum(['white', 'black', 'custom']).default('white'),
  customColor: z.string().default('#2e7d32'),
})
type Settings = z.infer<typeof settingsSchema>

const liveSettings: Settings = { enabled: false, mode: 'white', customColor: '#2e7d32' }

function renderBackdrop(ctx: CanvasRenderingContext2D): void {
  if (!liveSettings.enabled) return
  const color = resolveBackdropColor(liveSettings.mode, liveSettings.customColor)
  ctx.save()
  ctx.fillStyle = color
  ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height)
  ctx.restore()
}

export default defineModule({
  id: MODULE_ID,
  version: '1.0.1',
  settingsSchema,

  setup(ctx) {
    const apply = (s: WhiteboardSettings & { enabled: boolean }) => {
      liveSettings.enabled = s.enabled
      liveSettings.mode = s.mode
      liveSettings.customColor = s.customColor
    }
    apply(ctx.getSettings<Settings>())
    const stop = ctx.onSettingsChange<Settings>((s) => {
      apply(s)
      // Repaint so the backdrop appears/disappears immediately. Effective only in
      // the overlay window (where the engine lives); a no-op in other windows.
      emit('canvas-redraw-requested')
    })
    ctx.onDispose(stop)
  },

  contributes: {
    backgroundLayers: [
      {
        id: 'whiteboard',
        order: 0,
        render: renderBackdrop,
      },
    ],
    controlBar: [
      {
        id: 'whiteboard',
        component: WhiteboardToggleButton,
        defaultGroup: 'tools',
        groupHint: { separator: 'auto' },
      },
    ],
    locales: {
      en,
      'zh-Hant': zhHant,
      'zh-Hans': zhHans,
      ja,
    },
  },
})
