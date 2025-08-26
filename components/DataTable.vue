<template>
  <div class="space-y-6">
    
    <!-- Sticky Top Section -->
    <div class="sticky top-0 z-40 bg-[#f0f4f9] dark:bg-gray-800">
      <slot name="filters ">
        <div class="flex flex-wrap items-center justify-end gap-4 p-4">
          <div class="flex items-center">
        </div>
          <!--Title of table-->
          <div v-if="showTitle" class="flex items-center mr-auto">
            <h1 class="text-2xl font-semibold text-gray-900 dark:text-gray-100 flex items-center">
              <UIcon :name="icon" class="text-secondary mr-3 text-2xl" />
              {{ title }}
            </h1>
          </div>
          <div class=" w-250 flex justify-end">
            <!-- Search and Actions -->
            <div class="flex items-center gap-3">
              <div v-if="showPrimarySearch" class="flex items-center gap-2 h-10">
                <label v-if="showPrimarySearchLabel" class="text-sm text-gray-600 dark:text-gray-400">{{ primarySearchLabel }}:</label>
                <UInput :model-value="primarySearchValue || ''" :placeholder="primarySearchPlaceholder" class="flex-1 h-10"
                  :ui="{  base:'h-11'  }"
                  @update:model-value="(value) => emit('update:primarySearch', value)">
                  <template #leading>
                    <UIcon name="i-heroicons-magnifying-glass" class="text-gray-400" />
                  </template>
                </UInput>
              </div>
              <div class="flex items-center gap-2 relative">
                <div ref="filtersButtonRef">
                  <UButton v-if="showFilters" label="Filtros" icon="i-heroicons-funnel" class="h-11 font-normal bg-white text-gray-900 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-100"
                    @click="showFiltersPanel = !showFiltersPanel" />
                </div>
                <div ref="filtersPanelRef" v-if="showFiltersPanel && showFilters"
                  class="absolute top-full right-0 mt-2 w-96 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 p-4"
                  @click.stop>
                  <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div v-for="filter in filterConfig" :key="filter.key" class="field">
                      <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        {{ filter.label }}
                      </label>
                      <!-- Filtro de tipo date -->
                      <UInput v-if="filter.type === 'date'"
                        :model-value="formatDateForInput(filtersValue && filtersValue[filter.key])" type="date"
                        :placeholder="filter.placeholder" class="w-full"
                        @update:model-value="(value) => handleFilterChange(filter.key, value)" @click.stop />
                      <!-- Filtro de tipo select -->
                      <USelect v-else :model-value="(() => {
                          const value = filtersValue && filtersValue[filter.key]
                          console.log('DataTable - Select model-value:', { key: filter.key, value, allFilters: filtersValue })
                          return value
                        })()"
                        :items="filter.options" :placeholder="filter.placeholder" class="w-full"
                        @update:model-value="(value) => {
                          console.log('DataTable - Select cambio:', { key: filter.key, value, currentFiltersValue: filtersValue })
                          handleFilterChange(filter.key, value)
                        }" @click.stop
                        @focus="handleSelectOpen" @blur="handleSelectClose" />
                    </div>
                  </div>
                  <!-- Botón para cerrar filtros -->
                  <div class="flex justify-end mt-4 pt-3 border-t border-gray-200 dark:border-gray-700">
                    <UButton label="Cerrar" color="gray" variant="outline" size="sm" @click="showFiltersPanel = false"
                      @click.stop />
                  </div>
                </div>
              </div>
              <!-- Export Button -->
              <UButton v-if="showExport" label="Exportar" icon="i-heroicons-arrow-up-tray" class="h-11 font-normal bg-white text-gray-900 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-100"
                @click="handleExport" />
              <slot name="actions" />
              <!--Show New Button-->
            <div class="flex">
              <div v-if="showNewButton">
                <UButton
                  :label="newButtonLabel || 'Nuevo'"
                  icon="i-heroicons-plus"
                  color="primary"
                  class="h-11 flex-1 font-normal"
                  @click="onNewButtonClick"
                />
              </div>
            </div>
            </div>
          </div>
        </div>
      </slot>

      <div v-if="showHeaders" class="bg-transparent border-b border-gray-200 dark:border-gray-700">
        <div class="px-6 py-3">
          <div class="flex flex-wrap gap-3">
            <div v-for="header in headers" :key="header.value" class="flex items-center gap-2">
              <span class="text-sm text-gray-600 dark:text-gray-400">
                {{ header.label }}:
              </span>
              <UBadge :label="header.value || 'N/A'" color="neutral" variant="outline" size="md" class="font-medium" />
            </div>
          </div>
        </div>
      </div>
      
      <!-- Body Top Slot -->
      <div class="flex flex-row justify-between px-4 py-2 ">
        <slot name="body-top" />
      </div>
    </div>

    <!-- Table Section -->
    <UCard class="mb-6 ring-0 bg-transparent min-w-auto">
      <div class="overflow-x-auto">
        <UTable :data="filteredData" :sticky="true" :columns="columns" :loading="loading" class="bg-transparent"
          :ui="{
            thead: 'bg-transparent',
            tbody: 'border-separate border-spacing-y-6',
            td: 'bg-white dark:bg-gray-800 dark:text-white p-4',
            th: 'font-normal',
            tr: 'border-b border-10 border-[#f0f4f9] dark:border-gray-900'
          }"
          style="width: calc(100vw - 450px);min-height: 200px!important; height: 100%; max-width: 100%;">

          <template #loading>
            <div class="flex items-center justify-center py-8">
              <UIcon name="i-heroicons-arrow-path" class="animate-spin w-6 h-6 mr-2" />
              <span>Cargando...</span>
            </div>
          </template>

          <template #empty>
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

    <!-- Sticky Bottom Section - Pagination -->
    <div class="sticky bottom-0 z-40 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 shadow-sm">
      <div class="flex items-center justify-between p-4">
        <div class="text-sm text-gray-700 dark:text-gray-300">
          Mostrando {{ ((currentPage || 1) - 1) * (itemsPerPage || 100) + 1 }} a {{ Math.min((currentPage || 1) *
            (itemsPerPage || 100), totalRecords) }}
          de {{ totalRecords }} resultados
        </div>
        <div class="flex items-center gap-4">
          <div class="flex items-center gap-2">
            <label class="text-sm text-gray-600 dark:text-gray-400">Mostrar:</label>
            <USelect :model-value="itemsPerPage" :items="PAGINATION_OPTIONS" placeholder="10" class="w-20"
              @update:model-value="(value: any) => onItemsPerPageChange(Number(value))" />
            <span class="text-sm text-gray-600 dark:text-gray-400">registros</span>
          </div>
          <UPagination v-if="totalRecords > 0" v-model:page="currentPageModel" :total="totalRecords"
            :items-per-page="itemsPerPage" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { h, resolveComponent, computed } from 'vue'
import type { DataTableProps, DataTableEmits } from '../types/data-table'
import { useDataTable } from '../composables/useDataTable'
import { DATA_TABLE_DEFAULTS, PAGINATION_OPTIONS } from '../constants/data-table'
import { formatDateForInput } from '../utils/data-table'
const UButton = resolveComponent('UButton')

// Props
const props = withDefaults(defineProps<DataTableProps>(), DATA_TABLE_DEFAULTS)

// Emits
const emit = defineEmits<DataTableEmits>()

// Computed writable para v-model:page
const currentPageModel = computed({
  get: () => props.currentPage,
  set: (value) => onPageChange(value)
})

// Composable
const {
  showFiltersPanel,
  filtersPanelRef,
  filtersButtonRef,
  isSelectOpen,
  filteredData,
  handleFilterChange,
  handleSelectOpen,
  handleSelectClose,
  handleExport,
  onPageChange,
  onItemsPerPageChange
} = useDataTable(props, emit)
</script>
<style scoped>
tr.absolute.z-\[1\].left-0.w-full.h-px.bg-\(--ui-border-accented\){
  display: none;
}
</style>