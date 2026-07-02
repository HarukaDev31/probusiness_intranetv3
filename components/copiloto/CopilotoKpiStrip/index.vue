<template>
  <div class="grid grid-cols-2 gap-2 border-b border-default bg-white px-3 py-2 dark:bg-gray-900 sm:grid-cols-4">
    <UCard
      v-for="kpi in metrics"
      :key="kpi.id"
      variant="subtle"
      :ui="{ body: 'flex items-center gap-2 p-2 sm:p-2' }"
    >
      <template v-if="loading">
        <USkeleton class="size-4 shrink-0 rounded" />
        <div class="min-w-0 flex-1 space-y-1">
          <USkeleton class="h-4 w-12" />
          <USkeleton class="h-3 w-16" />
        </div>
      </template>
      <template v-else>
        <UIcon :name="kpi.icon" class="size-4 shrink-0" :style="{ color: kpi.accent }" />
        <div class="min-w-0">
          <p class="text-sm font-bold tabular-nums" :style="kpi.accent ? { color: kpi.accent } : undefined">
            {{ kpi.value }}
          </p>
          <p class="truncate text-[10px] text-muted">{{ kpi.shortLabel }}</p>
        </div>
      </template>
    </UCard>
  </div>
</template>

<script setup lang="ts">
import type { CopilotoKpiMetric } from '~/types/copiloto/lead'

withDefaults(
  defineProps<{
    metrics: CopilotoKpiMetric[]
    loading?: boolean
  }>(),
  { loading: false }
)
</script>
