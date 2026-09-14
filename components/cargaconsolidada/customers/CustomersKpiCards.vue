<template>
  <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 w-full mb-2">
    <div
      v-for="card in kpiCards"
      :key="card.key"
      class="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-3 border-t-2 border-t-orange-500"
      :class="card.clickable ? 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/60' : ''"
      @click="card.clickable ? emit('filter-nc') : undefined"
    >
      <div class="flex items-center gap-2 text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
        <UIcon :name="card.icon" class="w-4 h-4 text-orange-500" />
        <span>{{ card.label }}</span>
      </div>
      <div class="mt-1 text-2xl font-semibold text-gray-900 dark:text-white">
        {{ card.value }}
      </div>
      <p v-if="card.hint" class="mt-1 text-[11px] text-gray-400">
        {{ card.hint }}
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Header } from '~/types/data-table'

const props = defineProps<{
  headers: Record<string, Header>
}>()

const emit = defineEmits<{
  'filter-nc': []
}>()

const kpiCards = computed(() => {
  const cbm = props.headers.cbm_warehouse
  const customersHeader = props.headers.total_customers
  const suppliers = props.headers.total_suppliers_code
  const nc = props.headers.total_nc
  return [
    {
      key: 'cbm_warehouse',
      label: cbm?.label || 'CBM warehouse',
      value: cbm?.value ?? '0',
      icon: cbm?.icon || 'i-heroicons-cube',
      clickable: false,
    },
    {
      key: 'total_customers',
      label: customersHeader?.label || 'Total customers',
      value: customersHeader?.value ?? 0,
      icon: customersHeader?.icon || 'i-heroicons-users',
      clickable: false,
    },
    {
      key: 'total_suppliers_code',
      label: suppliers?.label || 'Total suppliers code',
      value: suppliers?.value ?? 0,
      icon: suppliers?.icon || 'i-heroicons-tag',
      clickable: false,
    },
    {
      key: 'total_nc',
      label: nc?.label || 'Total NC',
      value: nc?.value ?? 0,
      icon: nc?.icon || 'i-heroicons-exclamation-triangle',
      hint: 'Click to filter NC',
      clickable: true,
    },
  ]
})
</script>
