<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div class="flex items-center">
        <UIcon :name="icon" class="text-2xl mr-3 text-gray-700 dark:text-gray-300" />
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white">{{ title }}</h1>
      </div>
    </div>

    <!-- Controls -->
    <UCard class="mb-6">
      <template #header>
        <div class="flex flex-wrap items-center justify-between gap-4">
          <!-- Search and Actions -->
          <div class="flex items-center gap-3">

            <div v-if="showSecondarySearch" class="flex items-center gap-2">
              <label class="text-sm text-gray-600 dark:text-gray-400">{{ secondarySearchLabel }}:</label>
              <UInput :model-value="secondarySearchValue || ''" :placeholder="secondarySearchPlaceholder" class="w-48"
                @update:model-value="(value) => emit('update:secondarySearch', value)" />
            </div>
            <!-- Export Button -->
            <UButton v-if="showExport" label="Exportar" icon="i-heroicons-arrow-up-tray" variant="outline"
              @click="handleExport" />

            <!-- Filters Button -->
            <UButton v-if="showFilters" label="Filtros" icon="i-heroicons-funnel" variant="outline"
              @click="showFiltersPanel = !showFiltersPanel" />

            <!-- Secondary Search -->

          </div>
        </div>
      </template>

      <!-- Filters Panel -->
      <div v-if="showFiltersPanel && showFilters" class="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div v-for="filter in filterConfig" :key="filter.key" class="field">
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {{ filter.label }}
            </label>
            <USelect :model-value="(filtersValue && filtersValue[filter.key]) || 'todos'" :items="filter.options"
              :placeholder="filter.placeholder" class="w-full"
              @update:model-value="(value) => handleFilterChange(filter.key, value)" />
          </div>
        </div>
      </div>
      <div class="overflow-x-auto">
        <UTable :data="filteredData" :columns="columns" :loading="loading" class="h-100 w-full">
          <template #loading-state>
            <div class="flex items-center justify-center py-8">
              <UIcon name="i-heroicons-arrow-path" class="animate-spin w-6 h-6 mr-2" />
              <span>Cargando...</span>
            </div>
          </template>

          <template #empty-state>
            <div class="text-center py-8">
              <UIcon name="i-heroicons-inbox" class="mx-auto h-12 w-12 text-gray-400" />
              <h3 class="mt-2 text-sm font-semibold text-gray-900">No hay registros</h3>
              <p class="mt-1 text-sm text-gray-500">
                {{ emptyStateMessage }}
              </p>
            </div>
          </template>

          <template #expanded="{ row }">
            <pre>{{ row.original }}</pre>
          </template>
        </UTable>
      </div>

    </UCard>

    <!-- Data Table -->

    <!-- Pagination -->
    <div class="mt-6 flex items-center justify-between">
      <div class="text-sm text-gray-700 dark:text-gray-300">
        Mostrando {{ (currentPage - 1) * itemsPerPage + 1 }} a {{ Math.min(currentPage * itemsPerPage, totalRecords) }}
        de {{ totalRecords }} resultados
      </div>
      <div class="flex items-center gap-4">
        <div class="flex items-center gap-2">
          <label class="text-sm text-gray-600 dark:text-gray-400">Mostrar:</label>
          <USelect :model-value="localItemsPerPage" :items="[5, 10, 25, 50, 100]" placeholder="10" class="w-20"
            @update:model-value="(value: any) => onItemsPerPageChange(Number(value))" />
          <span class="text-sm text-gray-600 dark:text-gray-400">registros</span>
        </div>
        <UPagination v-model="localCurrentPage" :page-count="totalPages" :total="totalRecords"
          @update:page="onPageChange" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, h, resolveComponent } from 'vue'
import type { TableColumn } from '@nuxt/ui'

const UButton = resolveComponent('UButton')

// Props
interface FilterOption {
  label: string
  value: string
}

interface FilterConfig {
  key: string
  label: string
  placeholder: string
  options: FilterOption[]
}

interface Props {
  // Basic props
  title: string
  icon?: string

  // Data props
  data: any[]
  columns: TableColumn<any>[]
  loading?: boolean

  // Search props
  searchPlaceholder?: string
  showSecondarySearch?: boolean
  secondarySearchLabel?: string
  secondarySearchPlaceholder?: string

  // Filter props
  showFilters?: boolean
  filterConfig?: FilterConfig[]

  // Export props
  showExport?: boolean

  // Pagination props
  currentPage?: number
  totalPages?: number
  totalRecords?: number
  itemsPerPage?: number

  // Messages
  emptyStateMessage?: string
}

const props = withDefaults(defineProps<Props>(), {
  icon: 'i-heroicons-document-text',
  loading: false,
  searchPlaceholder: 'Buscar por...',
  showSecondarySearch: false,
  secondarySearchLabel: 'Buscar por',
  secondarySearchPlaceholder: 'Filtro específico...',
  showFilters: false,
  filterConfig: () => [],
  showExport: false,
  currentPage: 1,
  totalPages: 1,
  totalRecords: 0,
  itemsPerPage: 10,
  emptyStateMessage: 'No se encontraron registros que coincidan con los criterios de búsqueda.'
})

// Emits
const emit = defineEmits<{
  'update:searchQuery': [value: string]
  'update:secondarySearch': [value: string]
  'update:filters': [value: Record<string, any>]
  'update:currentPage': [value: number]
  'update:itemsPerPage': [value: number]
  'export': []
  'filter-change': [filterType: string, value: string]
  'page-change': [page: number]
  'items-per-page-change': [limit: number]
}>()

// Local state
const showFiltersPanel = ref(false)
const localCurrentPage = ref(props.currentPage)
const localItemsPerPage = ref(props.itemsPerPage)

// Props para filtros (necesitamos recibir estos valores del padre)
interface Props {
  // Basic props
  title: string
  icon?: string

  // Data props
  data: any[]
  columns: TableColumn<any>[]
  loading?: boolean

  // Search props
  searchPlaceholder?: string
  showSecondarySearch?: boolean
  secondarySearchLabel?: string
  secondarySearchPlaceholder?: string

  // Filter props
  showFilters?: boolean
  filterConfig?: FilterConfig[]

  // Export props
  showExport?: boolean

  // Pagination props
  currentPage?: number
  totalPages?: number
  totalRecords?: number
  itemsPerPage?: number

  // Messages
  emptyStateMessage?: string

  // Values from parent
  searchQueryValue?: string
  secondarySearchValue?: string
  filtersValue?: Record<string, any>
}

// Filtered data (can be overridden by parent)
const filteredData = computed(() => props.data)

// Methods
const handleFilterChange = (filterType: string, value: string) => {
  emit('filter-change', filterType, value)
}

const handleExport = () => {
  emit('export')
}

const onSecondarySearch = () => {
  // Emit event for parent to handle
}

const onPageChange = (page: number) => {
  localCurrentPage.value = page
  emit('update:currentPage', page)
  emit('page-change', page)
}

const onItemsPerPageChange = (limit: number) => {
  localItemsPerPage.value = limit
  emit('update:itemsPerPage', limit)
  emit('items-per-page-change', limit)
}

// Watchers
watch(() => props.currentPage, (newPage) => {
  localCurrentPage.value = newPage
})

watch(() => props.itemsPerPage, (newLimit) => {
  localItemsPerPage.value = newLimit
})
</script>