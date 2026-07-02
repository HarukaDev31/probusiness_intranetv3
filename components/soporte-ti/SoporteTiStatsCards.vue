<template>
  <div class="grid grid-cols-2 gap-3 sm:grid-cols-4 w-3/4 mx-auto pt-4">
    <UCard
      v-for="item in items"
      :key="item.key"
    
    >
      <p class="mb-1 text-[10px] text-gray-500 dark:text-gray-400">
        {{ item.label }}
      </p>
      <p class="text-[20px] font-semibold" :class="item.valueClass">
        {{ item.value }}
      </p>
    </UCard>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  stats: { total: number; pendientes: number; enProgreso: number; operativas: number }
}>()

const items = computed(() => [
  { key: 'total', label: 'Total', value: props.stats.total, valueClass: '' },
  {
    key: 'pendientes',
    label: 'Pendientes',
    value: props.stats.pendientes,
    valueClass: 'text-amber-600 dark:text-amber-400'
  },
  {
    key: 'enProgreso',
    label: 'En progreso',
    value: props.stats.enProgreso,
    valueClass: 'text-blue-600 dark:text-blue-400'
  },
  {
    key: 'operativas',
    label: 'Completadas',
    value: props.stats.operativas,
    valueClass: 'text-green-600 dark:text-green-400'
  }
])
</script>
