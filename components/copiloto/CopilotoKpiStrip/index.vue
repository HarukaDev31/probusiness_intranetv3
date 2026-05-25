<template>
  <div class="grid grid-cols-2 gap-2 border-b border-default bg-white px-3 py-2 dark:bg-gray-900 sm:grid-cols-4">
    <UCard
      v-for="kpi in metrics"
      :key="kpi.id"
      variant="subtle"
      :ui="{ body: 'flex items-center gap-2 p-2 sm:p-2' }"
    >
      <UIcon :name="kpi.icon" class="size-4 shrink-0" :style="{ color: kpi.accent }" />
      <div class="min-w-0">
        <p class="text-sm font-bold tabular-nums" :style="kpi.accent ? { color: kpi.accent } : undefined">
          {{ kpi.value }}
        </p>
        <p class="truncate text-[10px] text-muted">{{ kpi.shortLabel }}</p>
      </div>
    </UCard>
  </div>
</template>

<script setup lang="ts">
import type { CopilotoKpiMetric } from '~/types/copiloto/lead'

defineProps<{
  metrics: CopilotoKpiMetric[]
}>()
</script>
