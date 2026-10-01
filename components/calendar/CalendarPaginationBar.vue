<template>
  <div class="flex flex-wrap items-center justify-between gap-3 pt-4 mt-2 border-t border-gray-200 dark:border-gray-700">
    <div class="flex items-center gap-3">
      <USelectMenu
        :model-value="perPageOption"
        :items="PER_PAGE_OPTIONS"
        size="sm"
        class="w-36"
        @update:model-value="(option) => emit('update:perPage', option.value)"
      />
      <span class="text-sm text-gray-500 dark:text-gray-400">{{ total }} registros</span>
    </div>
    <UPagination
      :page="page"
      :total="total"
      :items-per-page="perPage"
      size="sm"
      @update:page="(p) => emit('update:page', p)"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { PER_PAGE_OPTIONS } from '~/constants/calendar'

const props = defineProps<{
  page: number
  perPage: number
  total: number
}>()

const emit = defineEmits<{
  (e: 'update:page', page: number): void
  (e: 'update:perPage', perPage: number): void
}>()

const perPageOption = computed(() => PER_PAGE_OPTIONS.find(o => o.value === props.perPage) ?? PER_PAGE_OPTIONS[0])
</script>
