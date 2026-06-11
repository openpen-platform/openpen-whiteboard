<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useModuleContext } from '@openpen/module-api'
import { AppButton } from '@openpen/module-api/uikit'
import { MODULE_ID } from './module-id'

interface Settings {
  enabled: boolean
}

const ctx = useModuleContext(MODULE_ID)
const label = computed(() => ctx.t('toggle'))

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
  const next = !enabled.value
  enabled.value = next
  // The repaint is emitted from setup()'s onSettingsChange (overlay window, where
  // the engine lives); emitting here (control-bar window) would never reach it.
  await ctx.updateSettings<Settings>({ enabled: next })
}
</script>

<template>
  <AppButton
    :active="enabled"
    :tooltip="label"
    :aria-label="label"
    data-testid="controlbar-whiteboard-btn"
    @click="toggle"
  >
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <rect x="3" y="4" width="18" height="14" rx="1" />
      <line x1="8" y1="21" x2="16" y2="21" />
      <line x1="12" y1="18" x2="12" y2="21" />
    </svg>
  </AppButton>
</template>
