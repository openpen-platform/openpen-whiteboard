<script setup lang="ts">
/*
 * WhiteboardOptions — the two rows shown in the control-bar caret panel:
 * mode (white / black / custom) and the custom colour as one-click swatches.
 *
 * Swatches rather than the native colour dialog: that dialog opens its own
 * window, outside the popover's outside-click handling and possibly behind the
 * always-on-top overlay. A colour saved before the upgrade that is not a preset
 * stays as one swatch labelled "current custom colour". The swatch row is
 * disabled unless the mode is custom.
 *
 * Every change is written to this plugin's settings; the repaint is emitted by
 * setup()'s onSettingsChange (overlay window).
 */
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useModuleContext } from '@openpen/module-api'
import { AppPopoverPanel, AppPopoverRow, AppSegmented, AppSwatchPicker } from '@openpen/module-api/uikit'
import { MODULE_ID } from './module-id'
import { CUSTOM_DEFAULT, buildSwatches, type WhiteboardMode } from './backdrop'

interface Settings {
  mode: WhiteboardMode
  customColor: string
}

const ctx = useModuleContext(MODULE_ID)

const mode = ref<WhiteboardMode>('white')
const customColor = ref(CUSTOM_DEFAULT)
let unsub: (() => void) | null = null

function apply(s: Partial<Settings>) {
  mode.value = s.mode ?? 'white'
  customColor.value = s.customColor || CUSTOM_DEFAULT
}

onMounted(() => {
  apply(ctx.getSettings<Settings>())
  unsub = ctx.onSettingsChange<Settings>(apply)
})
onUnmounted(() => unsub?.())

const modeLabel = computed(() => ctx.t('settings.modeLabel'))
const colorLabel = computed(() => ctx.t('settings.customColor'))
const modeOptions = computed(() => [
  { value: 'white', label: ctx.t('settings.mode.white') },
  { value: 'black', label: ctx.t('settings.mode.black') },
  { value: 'custom', label: ctx.t('settings.mode.custom') },
])
const swatches = computed(() =>
  buildSwatches(customColor.value).map((s) => ({
    value: s.value,
    label: ctx.t(`colors.${s.key}`),
    testid: `whiteboard-swatch-${s.key}`,
  })),
)

async function setMode(value: string) {
  mode.value = value as WhiteboardMode
  await ctx.updateSettings<Settings>({ mode: value as WhiteboardMode })
}

async function setColor(value: string) {
  customColor.value = value
  await ctx.updateSettings<Settings>({ customColor: value })
}
</script>

<template>
  <AppPopoverPanel data-testid="controlbar-whiteboard-popover">
    <AppPopoverRow :label="modeLabel">
      <AppSegmented
        :model-value="mode"
        :options="modeOptions"
        :ariaLabel="modeLabel"
        data-testid="whiteboard-mode"
        @update:model-value="setMode"
      />
    </AppPopoverRow>
    <AppPopoverRow :label="colorLabel">
      <AppSwatchPicker
        :model-value="customColor"
        :colors="swatches"
        :ariaLabel="colorLabel"
        :disabled="mode !== 'custom'"
        @update:model-value="setColor"
      />
    </AppPopoverRow>
  </AppPopoverPanel>
</template>
