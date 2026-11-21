<script setup lang="ts">
/*
 * WhiteboardToggleButton — whiteboard on/off button + caret + options panel.
 *
 * Same pattern as the host's shape and eraser buttons (and the cursor-highlight
 * plugin): an `AppButtonDropdown` whose main button toggles the backdrop and
 * whose caret opens a popover with the options.
 */
import { computed, inject, onMounted, onUnmounted, ref, watch } from 'vue'
import { MODAL_MANAGER_KEY, SNAP_EDGE_KEY, useModuleContext } from '@openpen/module-api'
import { AppButtonDropdown } from '@openpen/module-api/uikit'
import { MODULE_ID } from './module-id'
import WhiteboardOptions from './WhiteboardOptions.vue'

interface Settings {
  enabled: boolean
}

const POPOVER_ID = 'openpen-whiteboard-options'

const ctx = useModuleContext(MODULE_ID)
const label = computed(() => ctx.t('toggle'))
const optionsLabel = computed(() => ctx.t('options.label'))

const snapEdge = inject(SNAP_EDGE_KEY, undefined)
const modalManager = inject(MODAL_MANAGER_KEY, undefined)
// Anchor coordinates go stale when the bar snaps to another edge.
watch(() => snapEdge?.value, () => { modalManager?.close(POPOVER_ID) })

const enabled = ref(false)
let unsub: (() => void) | null = null

onMounted(() => {
  enabled.value = ctx.getSettings<Settings>().enabled ?? false
  unsub = ctx.onSettingsChange<Settings>((next) => {
    enabled.value = next.enabled
  })
})

onUnmounted(() => unsub?.())

async function toggle() {
  // The repaint is emitted from setup()'s onSettingsChange (overlay window, where
  // the engine lives); emitting here (control-bar window) would never reach it.
  await ctx.updateSettings<Settings>({ enabled: !enabled.value })
}

/** Opening the options also turns the backdrop on, so the adjustments are visible as they are made. */
async function enableIfNeeded() {
  if (!enabled.value) await ctx.updateSettings<Settings>({ enabled: true })
}
</script>

<template>
  <AppButtonDropdown
    :popover-id="POPOVER_ID"
    popover-placement="auto"
    :active="enabled"
    :main-tooltip="label"
    :main-aria-label="label"
    :caret-aria-label="optionsLabel"
    main-testid="controlbar-whiteboard-btn"
    caret-testid="controlbar-whiteboard-caret"
    @main-click="toggle"
    @caret-click="enableIfNeeded"
  >
    <template #main-content>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <rect x="3" y="4" width="18" height="14" rx="1" />
        <line x1="8" y1="21" x2="16" y2="21" />
        <line x1="12" y1="18" x2="12" y2="21" />
      </svg>
    </template>
    <template #popover-content>
      <WhiteboardOptions />
    </template>
  </AppButtonDropdown>
</template>
