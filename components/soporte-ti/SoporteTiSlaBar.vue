<template>
  <div class="flex items-center gap-3">
    <span class="w-14 shrink-0 text-[11px] text-slate-500">{{ transcurridas }}h / {{ sla }}h</span>
    <div class="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-200">
      <div
        class="h-full rounded-full"
        :class="colorBarra"
        :style="{ width: `${Math.min(porciento, 100)}%` }"
      />
    </div>
    <span class="w-8 text-right text-[11px] font-medium" :class="colorTexto">{{ porciento }}%</span>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  sla: number
  transcurridas: number
}>()

const porciento = computed(() =>
  Math.min(Math.round((props.transcurridas / props.sla) * 100), 120)
)

const colorBarra = computed(() => {
  const p = porciento.value
  if (p < 75) return 'bg-green-500'
  if (p <= 100) return 'bg-amber-500'
  return 'bg-red-500'
})

const colorTexto = computed(() => {
  const p = porciento.value
  if (p < 75) return 'text-green-600'
  if (p <= 100) return 'text-amber-600'
  return 'text-red-600'
})
</script>
