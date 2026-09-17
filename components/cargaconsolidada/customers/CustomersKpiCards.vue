<template>
  <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-[18px] w-full min-w-0">
    <article
      v-for="card in kpiCards"
      :key="card.key"
      class="relative flex items-center gap-4 min-h-[108px] px-5 py-[22px] rounded-xl bg-white dark:bg-gray-800 shadow-[0_6px_20px_rgba(23,35,58,0.1)] border-l-[3px] border-[#f26522]"
      :class="card.clickable ? 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/60' : ''"
      @click="card.clickable ? emit('filter-nc') : undefined"
    >
      <div class="w-[46px] h-[46px] shrink-0 grid place-items-center text-[#f26522]" aria-hidden="true">
        <UIcon :name="card.icon" class="w-9 h-9" />
      </div>
      <div class="min-w-0">
        <p class="m-0 text-[11px] tracking-[0.8px] uppercase text-[#8494b0]">
          {{ card.label }}
        </p>
        <p class="mt-1 mb-0 text-[2rem] font-bold leading-none text-[#17233a] dark:text-white">
          {{ card.value }}
        </p>
        <p v-if="card.hint" class="mt-1 text-[11px] text-gray-400">
          {{ card.hint }}
        </p>
      </div>
    </article>
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
      label: cbm?.label || 'CBM Warehouse',
      value: cbm?.value ?? '0',
      icon: 'fluent:box-32-filled',
      clickable: false,
    },
    {
      key: 'total_customers',
      label: customersHeader?.label || 'Total customers',
      value: customersHeader?.value ?? 0,
      icon: 'flowbite:users-group-solid',
      clickable: false,
    },
    {
      key: 'total_suppliers_code',
      label: suppliers?.label || 'Total suppliers code',
      value: suppliers?.value ?? 0,
      icon: 'heroicons:arrows-up-down',
      clickable: false,
    },
    {
      key: 'total_nc',
      label: nc?.label || 'Total NC',
      value: nc?.value ?? 0,
      icon: 'heroicons:exclamation-triangle',
      hint: 'Click to filter NC',
      clickable: true,
    },
  ]
})
</script>
