<template>
  <button type="button" class="cc cc-stage-cell" @click.stop="emit('open')">
    <span class="flex items-baseline justify-between gap-2 text-xs">
      <span class="cc-cut font-semibold" :class="locked ? 'text-(--cc-muted)' : container.progress.complete ? 'cc-t-green' : 'text-(--cc-orange-ink)'">{{ label }}</span>
      <span v-if="!locked" class="text-[13px] font-bold">{{ container.progress.percent }}%</span>
    </span>
    <span class="cc-segs"><span v-for="stage in container.progress.stages" :key="stage.number" :style="{ flex: stage.total }"><span :class="stage.done >= stage.total ? 'bg-(--cc-green)' : 'bg-(--cc-orange)'" :style="{ width: `${Math.round(stage.done / stage.total * 100)}%` }" /></span></span>
  </button>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { CHINA_STAGE_SHORT } from '~/constants/chinaCaja'
import type { ChinaContainer } from '~/types/china-caja'

const props = defineProps<{ container: ChinaContainer }>()
const emit = defineEmits<{ open: [] }>()
const locked = computed(() => !!props.container.progress.stages[0]?.locked && !props.container.closed)
const label = computed(() => {
  if (locked.value) return `Abre a 60 CBM · ${props.container.cbm.toFixed(1)}`
  if (props.container.progress.complete) return 'Completado'
  const next = props.container.progress.current ?? props.container.progress.stages.find((stage) => stage.done < stage.total)?.number ?? 1
  return CHINA_STAGE_SHORT[next] || ''
})
</script>
