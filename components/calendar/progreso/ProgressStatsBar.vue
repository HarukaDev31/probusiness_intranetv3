<template>
  <div class="flex flex-wrap items-center gap-3 p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
    <UIcon :name="icon" class="w-5 h-5" :class="iconClass" />
    <span class="text-sm font-medium text-gray-700 dark:text-gray-300">{{ title }}</span>
    <div class="flex flex-wrap items-center gap-4 ml-4">
      <div v-for="item in items" :key="item.label" class="flex items-center gap-2 px-3 py-1.5 rounded-lg" :class="item.boxClass">
        <span class="text-xs" :class="item.labelClass">{{ item.label }}</span>
        <span class="text-lg font-bold" :class="item.valueClass">{{ item.value }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { CalendarProgressStats } from '~/types/calendar'

const props = defineProps<{
  title: string
  icon: string
  iconClass: string
  stats: CalendarProgressStats | null
}>()

const items = computed(() => {
  const s = props.stats ?? { total: 0, completadas: 0, en_progreso: 0, pendientes: 0 }
  return [
    { label: 'Total', value: s.total, boxClass: 'bg-gray-100 dark:bg-gray-700', labelClass: 'text-gray-500 dark:text-gray-400', valueClass: 'text-gray-900 dark:text-white' },
    { label: 'Completadas', value: s.completadas, boxClass: 'bg-success-50 dark:bg-success-900/20 border border-success-200 dark:border-success-800', labelClass: 'text-success-600 dark:text-success-400', valueClass: 'text-success-700 dark:text-success-400' },
    { label: 'En progreso', value: s.en_progreso, boxClass: 'bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800', labelClass: 'text-orange-600 dark:text-orange-400', valueClass: 'text-orange-700 dark:text-orange-400' },
    { label: 'Pendientes', value: s.pendientes, boxClass: 'bg-warning-50 dark:bg-warning-900/20 border border-warning-200 dark:border-warning-800', labelClass: 'text-warning-600 dark:text-warning-400', valueClass: 'text-warning-700 dark:text-warning-400' }
  ]
})
</script>
