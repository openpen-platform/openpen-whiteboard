<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useModuleContext } from '@openpen/module-api'
import { AppSegmented } from '@openpen/module-api/uikit'
import { MODULE_ID } from './module-id'
import type { WhiteboardMode } from './backdrop'

interface Settings {
  mode: WhiteboardMode
  customColor: string
}

const ctx = useModuleContext(MODULE_ID)

const mode = ref<WhiteboardMode>('white')
const customColor = ref('#2e7d32')
let unsub: (() => void) | null = null

onMounted(() => {
  const s = ctx.getSettings<Settings>()
  mode.value = s.mode ?? 'white'
  customColor.value = s.customColor ?? '#2e7d32'
  unsub = ctx.onSettingsChange<Settings>((next) => {
    mode.value = next.mode
    customColor.value = next.customColor
  })
})

onUnmounted(() => unsub?.())

const modeLabel = computed(() => ctx.t('settings.modeLabel'))
const customColorLabel = computed(() => ctx.t('settings.customColor'))
const modeOptions = computed(() => [
  { value: 'white', label: ctx.t('settings.mode.white') },
  { value: 'black', label: ctx.t('settings.mode.black') },
  { value: 'custom', label: ctx.t('settings.mode.custom') },
])
const isCustom = computed(() => mode.value === 'custom')

async function setMode(value: string) {
  mode.value = value as WhiteboardMode
  // Repaint is emitted from setup()'s onSettingsChange (overlay window).
  await ctx.updateSettings<Settings>({ mode: value as WhiteboardMode })
}

async function setCustomColor(value: string) {
  customColor.value = value
  await ctx.updateSettings<Settings>({ customColor: value })
}
</script>

<template>
  <div class="whiteboard-settings">
    <div class="whiteboard-row">
      <div class="whiteboard-row-label">{{ modeLabel }}</div>
      <AppSegmented
        :model-value="mode"
        :options="modeOptions"
        @update:model-value="setMode"
      />
    </div>
    <div v-if="isCustom" class="whiteboard-row">
      <div class="whiteboard-row-label">{{ customColorLabel }}</div>
      <input
        type="color"
        class="whiteboard-color"
        :value="customColor"
        :aria-label="customColorLabel"
        @input="setCustomColor(($event.target as HTMLInputElement).value)"
      />
    </div>
  </div>
</template>

<style scoped>
.whiteboard-settings {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.whiteboard-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.whiteboard-row-label {
  font-size: 13.5px;
  font-weight: 500;
  color: var(--openpen-color-text-primary);
}

.whiteboard-color {
  width: 36px;
  height: 24px;
  padding: 0;
  border: 1px solid var(--openpen-color-border, rgba(255, 255, 255, 0.2));
  border-radius: 4px;
  background: transparent;
  cursor: pointer;
}
</style>
