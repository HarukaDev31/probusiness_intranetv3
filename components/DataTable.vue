<template>
  <div class="">

    <!-- Sticky Top Section -->
    <div v-if="!showTopSection" class="sticky top-0 z-40 bg-[#f0f4f9] dark:bg-gray-800">
      <slot name="filters ">
        <div class="flex flex-col lg:flex-row flex-wrap items-start lg:items-center gap-4 p-4">
          <div class="w-full lg:w-full flex flex-col lg:flex-row justify-between gap-3 items-center">
            <PageHeader :title="title" :subtitle="subtitle" :icon="icon" :hide-back-button="hideBackButton" @back="goBack" />
            <!-- Search and Actions -->
            <div class="flex flex-col lg:flex-row items-start lg:items-center gap-3 w-full lg:w-auto">
              <div v-if="showPrimarySearch" class="flex items-center gap-2 h-10 w-full lg:w-auto">
                <label v-if="showPrimarySearchLabel"
                  class="text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap">{{ primarySearchLabel }}:</label>
                <UInput :model-value="primarySearchValue || ''" :placeholder="primarySearchPlaceholder"
                  class="flex-1 h-10 min-w-0" :ui="{ base: 'h-11' }"
                  @update:model-value="(value) => emit('update:primarySearch', value)">
                  <template #leading>
                    <UIcon name="i-heroicons-magnifying-glass" class="text-gray-400" />
                  </template>
                </UInput>
              </div>
              <UButton v-if="showExport" label="Exportar" icon="i-heroicons-arrow-up-tray"
                class="h-11 font-normal bg-white text-gray-900 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-100 w-full lg:w-auto"
                @click="handleExport" />
              <div class="flex items-center gap-2 relative w-full lg:w-auto">
                <div ref="filtersButtonRef" class="w-full lg:w-auto">
                  <UButton v-if="showFilters" label="Filtros" icon="i-heroicons-funnel"
                    class="h-11 font-normal bg-white text-gray-900 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-100 w-full lg:w-auto"
                    @click="showFiltersPanel = !showFiltersPanel" />
                </div>
                
                <!-- Panel de filtros -->
                <div ref="filtersPanelRef" v-if="showFiltersPanel && showFilters"
                  class="absolute top-full right-0 mt-2 w-full lg:w-96 max-w-[90vw] lg:max-w-none bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 p-4 max-h-[80vh] overflow-y-auto"
                  @click.stop>
                  <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
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
                        })()" :items="filter.options" :placeholder="filter.placeholder" class="w-full"
                          @update:model-value="(value) => {
                            console.log('DataTable - Select cambio:', { key: filter.key, value, currentFiltersValue: filtersValue })
                            handleFilterChange(filter.key, value)
                          }" @click.stop @focus="handleSelectOpen" @blur="handleSelectClose" />
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
         
              <slot name="actions" />
              <!--Show New Button-->
              <div class="flex w-full lg:w-auto">
                <div v-if="showNewButton" class="w-full lg:w-auto">
                  <UButton :label="newButtonLabel || 'Nuevo'" icon="i-heroicons-plus" color="primary"
                    class="h-11 flex-1 font-normal w-full lg:w-auto" @click="onNewButtonClick" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </slot>

      <div v-if="showHeaders" class="bg-transparent border-b border-gray-200 dark:border-gray-700">
        <div class="px-4 lg:px-6 py-3">
          <div class="flex flex-wrap gap-2 lg:gap-3">
            <div v-for="header in headers" :key="header.value" class="flex items-center gap-2">
              <span class="text-xs lg:text-sm text-gray-600 dark:text-gray-400">
                {{ header.label }}:
              </span>
              <UBadge :label="header.value || 'N/A'" color="neutral" variant="outline" size="sm"
                class="font-medium text-xs" />
            </div>
          </div>
        </div>
      </div>

      <!-- Body Top Slot -->
      <div class="flex flex-row justify-between px-4 " v-if="showBodyTop" >
        <slot name="body-top" />
      </div>
    </div>

    <!-- Table Section -->
    <div class="mb-6 ring-0 bg-transparent" :ui="{
      body:'px-0'
    }">
      
      <div class="overflow-x-auto">
        <UTable :data="filteredData" :sticky="true" :columns="columns" :loading="loading"
          class="bg-transparent min-w-full" :ui="{
            thead: 'bg-transparent',
            tbody: 'border-separate border-spacing-y-6',
            td: 'bg-white dark:bg-gray-800 dark:text-white p-2 lg:p-4 text-xs lg:text-sm',
            th: 'font-normal text-xs lg:text-sm p-2 lg:p-4',
            tr: 'border-b border-10 border-[#f0f4f9] dark:border-gray-900'
          }">

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
    </div>

    <!-- Sticky Bottom Section - Pagination -->
    <div v-if="showPagination"
      class="sticky bottom-0 z-40 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 shadow-sm">
      <div class="flex flex-col lg:flex-row items-start lg:items-center justify-between p-4 gap-4">
        <div class="text-xs lg:text-sm text-gray-700 dark:text-gray-300 text-center lg:text-left w-full lg:w-auto">
          Mostrando {{ ((currentPage || 1) - 1) * (itemsPerPage || 100) + 1 }} a {{ Math.min((currentPage || 1) *
            (itemsPerPage || 100), totalRecords) }}
          de {{ totalRecords }} resultados
        </div>
        <div class="flex flex-col lg:flex-row items-center gap-4 w-full lg:w-auto">
          <div class="flex items-center gap-2 justify-center lg:justify-start">
            <label class="text-xs lg:text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap">Mostrar:</label>
            <USelect :model-value="itemsPerPage" :items="PAGINATION_OPTIONS" placeholder="10" class="w-20"
              @update:model-value="(value: any) => onItemsPerPageChange(Number(value))" />
            <span class="text-xs lg:text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap">registros</span>
          </div>
          <UPagination v-if="totalRecords > 0" v-model:page="currentPageModel" :total="totalRecords"
            :items-per-page="itemsPerPage" class="flex justify-center lg:justify-end" />
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
import { navigateTo, useRouter } from '#imports'
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

const router = useRouter()

const goBack = () => {
  if (props.previousPageUrl) {
    navigateTo(props.previousPageUrl)
  } else {
    router.back()
  }
}
</script>
<style scoped>
tr.absolute.z-\[1\].left-0.w-full.h-px.bg-\(--ui-border-accented\) {
  display: none;
}

/* Estilos para mejorar la responsividad */
@media (max-width: 1024px) {
  .field {
    min-width: 100%;
  }
}

/* Asegurar que la tabla sea responsive */
.overflow-x-auto {
  -webkit-overflow-scrolling: touch;
}

/* Mejorar la legibilidad en mobile */
@media (max-width: 768px) {
  .text-xs {
    font-size: 0.75rem;
    line-height: 1rem;
  }

  .p-2 {
    padding: 0.5rem;
  }

  .gap-2 {
    gap: 0.5rem;
  }

  .gap-3 {
    gap: 0.75rem;
  }

  .gap-4 {
    gap: 1rem;
  }
}

/* Asegurar que los botones no se corten en mobile */
@media (max-width: 640px) {
  .h-11 {
    height: 2.75rem;
  }

  .w-full {
    width: 100%;
  }

  .flex-col {
    flex-direction: column;
  }

  .items-start {
    align-items: flex-start;
  }

  .justify-center {
    justify-content: center;
  }

  .text-center {
    text-align: center;
  }
}

/* Mejorar el panel de filtros en mobile */
@media (max-width: 1024px) {
  .filters-panel {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 90vw;
    max-width: 400px;
    max-height: 80vh;
    overflow-y: auto;
  }
}

/* Mejorar la tabla en mobile */
@media (max-width: 768px) {
  .min-w-full {
    min-width: 100%;
  }

  /* Asegurar que las celdas de la tabla no se corten */
  .overflow-x-auto {
    scrollbar-width: thin;
    scrollbar-color: #cbd5e0 #f7fafc;
  }

  .overflow-x-auto::-webkit-scrollbar {
    height: 6px;
  }

  .overflow-x-auto::-webkit-scrollbar-track {
    background: #f7fafc;
    border-radius: 3px;
  }

  .overflow-x-auto::-webkit-scrollbar-thumb {
    background: #cbd5e0;
    border-radius: 3px;
  }

  .overflow-x-auto::-webkit-scrollbar-thumb:hover {
    background: #a0aec0;
  }
}

/* Mejorar la experiencia táctil en mobile */
@media (hover: none) and (pointer: coarse) {
  .h-11 {
    min-height: 44px;
    /* Tamaño mínimo recomendado para touch */
  }

  .gap-2 {
    gap: 0.75rem;
    /* Espaciado más generoso para touch */
  }

  .gap-3 {
    gap: 1rem;
  }

  .gap-4 {
    gap: 1.25rem;
  }
}

/* Asegurar que el overlay funcione correctamente */
.fixed.inset-0 {
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
}

/* Mejorar la legibilidad del texto en mobile */
@media (max-width: 640px) {
  .text-xl {
    font-size: 1.125rem;
    line-height: 1.75rem;
  }

  .text-2xl {
    font-size: 1.5rem;
    line-height: 2rem;
  }
}
</style>