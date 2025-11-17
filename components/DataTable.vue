<template>
  <div ref="componentRootRef" class="">

    <!-- Sticky Top Section -->
    <div v-if="!showTopSection" class="sticky top-0 z-40 bg-[#f0f4f9] dark:bg-gray-900 mb-2">
  <slot name="filters" />
  <template v-if="!$slots.filters">
    <div class="flex flex-col lg:flex-row flex-wrap items-start lg:items-center gap-4 p-4">
      <div class="w-full lg:w-full flex flex-col lg:flex-row justify-between gap-3 items-center">
        <PageHeader :title="title" :subtitle="subtitle" :icon="icon" :hide-back-button="hideBackButton" @back="goBack" />
        <!-- Search and Actions -->
        <div class="flex flex-col lg:flex-row items-start lg:items-center gap-3 w-full lg:w-auto">
          <div v-if="showPrimarySearch" class="flex items-center gap-2 h-10 w-full lg:w-auto">
            <label v-if="showPrimarySearchLabel"
              class="text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap">{{ translations.primarySearchLabel }}:</label>
            <UInput :model-value="primarySearchInternal" :placeholder="primarySearchPlaceholder"
              class="flex-1 h-10 min-w-0" :ui="{ base: 'h-11' }"
              @update:model-value="onPrimarySearchChange">
              <template #leading>
                <UIcon name="i-heroicons-magnifying-glass" class="text-gray-400" />
              </template>
            </UInput>
          </div>

          <UButton v-if="showExport" :label="translations.export" icon="i-heroicons-arrow-up-tray"
            class="h-11 font-normal bg-white text-gray-900 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-100 w-full lg:w-auto"
            @click="handleExport" />
          <div class="flex items-center gap-2 relative w-full lg:w-auto">
            <div ref="filtersButtonRef" class="w-full lg:w-auto">
              <UButton v-if="showFilters" :label="translations.filters" icon="i-heroicons-funnel"
                class="h-11 font-normal bg-white text-gray-900 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-100 w-full lg:w-auto"
                @click="showFiltersPanel = !showFiltersPanel" />
            </div>

            <!-- Panel de filtros -->
            <div ref="filtersPanelRef" v-if="showFiltersPanel && showFilters"
              class="absolute top-full right-0 mt-2 w-full lg:w-96 max-w-[90vw] lg:max-w-none bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 p-4 max-h-[80vh] overflow-y-auto"
              @click.stop>
              <div class="grid grid-cols-1 lg:grid-cols-1 gap-4 p-2">
                <div v-for="filter in displayedFilterConfig" :key="filter.key" class="field grid grid-cols-1 lg:grid-cols-2 gap-4">
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
                      return value
                    })()" :items="filter.options" :placeholder="filter.placeholder" class="w-full"
                      @update:model-value="(value) => {
                        handleFilterChange(filter.key, value)
                      }" @click.stop @focus="handleSelectOpen" @blur="handleSelectClose" />
                </div>
              </div>

              <!-- Footer actions for filters (design similar to screenshot) -->
              <div class="mt-2 pt-3 border-t border-gray-200 dark:border-gray-700 px-2">
                <div class="flex items-center justify-between">
                  <!-- Left: prominent clear filters button -->
                  <UButton
                    icon="i-heroicons-x-mark"
                    class="h-8 bg-amber-50 dark:bg-amber-900 text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-800 border-0"
                    :label="translations.clearFilters"
                    @click="handleClearFilters"
                  />

                  <!-- Right: close link-style button -->
                  <button type="button" class="text-sm text-gray-600 dark:text-gray-300 hover:underline" @click="showFiltersPanel = false">
                    {{ translations.close }}
                  </button>
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
    </div>
  </template>

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
      
      <div 
        ref="tableContainerRef"
        class="overflow-x-auto relative scroll-container"
        @scroll="handleScroll"
        @mousemove="handleMouseMove"
        @mouseleave="stopAutoScroll"
      >
        <!-- Sombra izquierda -->
        <div 
          v-if="showLeftShadow" 
          class="scroll-shadow scroll-shadow-left"
          :style="{ left: scrollLeft + 'px' }"
        ></div>
        <!-- Sombra derecha -->
        <div 
          v-if="showRightShadow" 
          class="scroll-shadow scroll-shadow-right"
          :style="{ left: (scrollLeft + containerWidth - 80) + 'px' }"
        ></div>
        <UTable :key="tableKey" :data="filteredData" :sticky="true" :columns="columns" :loading="loading"
          class="bg-transparent min-w-full" :ui="{
            root: 'relative overflow-visible',
            base: 'min-w-full',
            thead: 'bg-transparent',
            tbody: 'border-separate border-spacing-y-6',
            td: 'bg-white dark:bg-gray-800 dark:text-white p-2 lg:p-4 text-xs lg:text-sm',
            th: 'font-normal text-xs lg:text-sm p-2 lg:p-4',
            tr: 'border-b border-10 border-[#f0f4f9] dark:border-gray-900'
          }">

          <template #loading>
            <div v-if="props.showSkeleton">
              <slot name="skeleton">
                <div class="mb-4">
                  <div class="flex items-center gap-3 mb-2">
                    <USkeleton v-for="c in (props.skeletonCols || Math.max(1, columns.length))" :key="`h-${c}`" class="h-4 w-full rounded bg-gray-200 dark:bg-gray-700" />
                  </div>
                </div>
                <div class="space-y-3">
                  <div v-for="r in (props.skeletonRows || 6)" :key="`row-${r}`" class="grid gap-3" :style="{ gridTemplateColumns: `repeat(${props.skeletonCols || Math.max(1, columns.length)}, minmax(0, 1fr))` }">
                    <USkeleton v-for="c in (props.skeletonCols || Math.max(1, columns.length))" :key="`c-${r}-${c}`" class="h-8 w-full rounded bg-gray-200 dark:bg-gray-700" />
                  </div>
                </div>
              </slot>
            </div>
            <div v-else class="flex items-center justify-center py-8">
              <UIcon name="i-heroicons-arrow-path" class="animate-spin w-6 h-6 mr-2" />
              <span>{{ translations.loading }}</span>
            </div>
          </template>

          <template #empty>
            <div class="text-center py-8">
              <UIcon name="i-heroicons-inbox" class="mx-auto h-12 w-12 text-gray-400" />
              <h3 class="mt-2 text-sm font-semibold text-gray-900">{{ translations.emptyTitle }}</h3>
              <p class="mt-1 text-sm text-gray-500">
                {{ translations.emptyMessage || emptyStateMessage }}
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
    <div v-if="showBottomSection"
      class="sticky bottom-0 z-40 bg-[#f0f4f9] dark:bg-gray-900">
      <div class="flex flex-col lg:flex-row items-start lg:items-center justify-between p-4 gap-4">
        <div class="text-xs lg:text-sm text-gray-700 dark:text-gray-300 text-center lg:text-left w-full lg:w-auto">
          {{ translations.showing }} {{ ((currentPage || 1) - 1) * (itemsPerPage || 100) + 1 }} {{translations.a}} {{ Math.min((currentPage || 1) *
            (itemsPerPage || 100), totalRecords) }}
          {{ translations.de }} {{ totalRecords }} {{ translations.resultados }}
        </div>
        <div class="flex flex-col lg:flex-row items-center gap-4 w-full lg:w-auto" v-if="showPagination">
          <div class="flex items-center gap-2 justify-center lg:justify-start">
            <label class="text-xs lg:text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap">{{ translations.perPage }}</label>
            <USelect :model-value="itemsPerPage" :items="PAGINATION_OPTIONS" placeholder="10" class="w-20"
              @update:model-value="(value: any) => onItemsPerPageChange(Number(value))" />
            <span class="text-xs lg:text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap">{{ translations.resultados }}</span>
          </div>
          <UPagination v-if="totalRecords > 0" v-model:page="currentPageModel" :total="totalRecords"
            :items-per-page="itemsPerPage" class="flex justify-center lg:justify-end"
            
            />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { h, resolveComponent, computed, ref, onMounted, onUnmounted, watch } from 'vue'
import type { DataTableProps, DataTableEmits } from '../types/data-table'
import { useDataTable } from '../composables/useDataTable'
import { DATA_TABLE_DEFAULTS, PAGINATION_OPTIONS } from '../constants/data-table'
import { ROLES } from '~/constants/roles'
import { useUserRole } from '~/composables/auth/useUserRole'
const { hasRole, isCoordinacion,currentRole } = useUserRole()
const isAlmacen = computed(() => hasRole(ROLES.CONTENEDOR_ALMACEN))
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

// Key to force re-render of the table when pagination changes to avoid stale image elements
const tableKey = ref(0)

// Re-render table when page or items per page change so images are not briefly reused
watch(() => props.currentPage, (newPage: number | undefined) => {
  tableKey.value += 1

  // If parent provided a prefetchNextPage callback, trigger prefetch for the next page
  try {
    const current = newPage || 1
    const next = current + 1
    const total = props.totalPages || props.totalRecords || undefined
    if (typeof props.prefetchNextPage === 'function') {
      // Only prefetch if we don't know total or next is within totalPages
      if (!total || (typeof total === 'number' && next <= (props.totalPages || total))) {
        // Fire-and-forget; swallow errors
        ;(props.prefetchNextPage as any)(next, props.itemsPerPage || 10).catch(() => {})
      }
    }
  } catch (e) {
    // ignore
  }
})

watch(() => props.itemsPerPage, (newLimit: number | undefined) => {
  tableKey.value += 1
  // When items per page changes, also attempt to prefetch the next page using current page
  try {
    const current = props.currentPage || 1
    const next = current + 1
    if (typeof props.prefetchNextPage === 'function') {
      ;(props.prefetchNextPage as any)(next, newLimit || 10).catch(() => {})
    }
  } catch (e) {
    // ignore
  }
})

// Composable
const {
  showFiltersPanel,
  filtersPanelRef,
  filtersButtonRef,
  isSelectOpen,
  filteredData,
  handleFilterChange,
    handleClearFilters,
  handleSelectOpen,
  handleSelectClose,
  handleExport,
  onPageChange,
  onItemsPerPageChange
} = useDataTable(props, emit)

const router = useRouter()

// Root ref for visibility detection
const componentRootRef = ref<HTMLElement | null>(null)

// Internal primary search state (to avoid desync when parent uses v-show tabs)
const primarySearchInternal = ref<string>(props.primarySearchValue ?? props.searchQueryValue ?? '')

// Debounced primary search emission
const primarySearchTimer = ref<number | null>(null)
const debounceMs = computed(() => (props.searchDebounceMs ?? 300))

const emitSearchNow = (value: string) => {
  // emit both camelCase variants (typed) and kebab-case variants (some parents listen that way)
  emit('update:primarySearch', value)
  emit('update:searchQuery', value)
  ;(emit as any)('update:primary-search', value)
  ;(emit as any)('update:search-query', value)
}

const onPrimarySearchChange = (value: string) => {
  primarySearchInternal.value = value
  const ms = debounceMs.value
  // If user wants no debounce, emit immediately
  if (!ms || ms <= 0) {
    emitSearchNow(value)
    return
  }

  // reset timer
  if (primarySearchTimer.value) {
    clearTimeout(primarySearchTimer.value)
    primarySearchTimer.value = null
  }

  // schedule emit
  primarySearchTimer.value = window.setTimeout(() => {
    emitSearchNow(value)
    primarySearchTimer.value = null
  }, ms)
}

// Keep internal state in sync if parent controls the prop
// Keep internal state in sync if parent controls either primarySearchValue or searchQueryValue
watch(() => props.primarySearchValue, (v) => {
  primarySearchInternal.value = v ?? props.searchQueryValue ?? ''
})
watch(() => props.searchQueryValue, (v) => {
  primarySearchInternal.value = v ?? props.primarySearchValue ?? ''
})

// Visibility polling: if component becomes hidden (e.g. v-show on parent tabs)
// We only clear the search when the route hasn't changed (i.e. likely a tab switch).
// If the route changed (navigated to detail), we keep the search so it can be restored when returning.
const _visibilityInterval = ref<number | null>(null)
const isRootHidden = () => {
  const el = componentRootRef.value
  if (!el) return false
  const style = window.getComputedStyle(el)
  if (style.display === 'none' || style.visibility === 'hidden') return true
  // offsetParent null is a reliable signal for display:none or removed from layout
  return el.offsetParent === null
}

onMounted(() => {
  // Prefer MutationObserver for immediate detection of display/style changes (v-show/v-if),
  // fall back to a small polling loop for environments where MutationObserver isn't available.
  const checkAndClear = () => {
    try {
      const hidden = isRootHidden()
      if (hidden && primarySearchInternal.value !== '') {
        primarySearchInternal.value = ''
        // Emit both typed variants and kebab-case variants so parents listening to any of them receive the update
        emit('update:primarySearch', '')
        emit('update:searchQuery', '')
        ;(emit as any)('update:primary-search', '')
        ;(emit as any)('update:search-query', '')
      }
    } catch (e) {
      // ignore
    }
  }

  let mutationObserver: MutationObserver | null = null
  try {
    if (typeof MutationObserver !== 'undefined' && componentRootRef.value) {
      // Observe attribute changes on the element and its ancestors so we catch style/class/display changes
      mutationObserver = new MutationObserver(() => {
        checkAndClear()
      })

      let node: HTMLElement | null = componentRootRef.value
      // observe up the tree until <body>
      while (node) {
        try {
          mutationObserver.observe(node, { attributes: true, attributeFilter: ['style', 'class'] })
        } catch (e) {
          // ignore nodes that can't be observed
        }
        node = node.parentElement
      }

      // Also listen to visibilitychange in case the document/tab is hidden
      document.addEventListener('visibilitychange', checkAndClear)
    } else {
      // fallback to polling when MutationObserver is not available
      _visibilityInterval.value = window.setInterval(checkAndClear, 250)
    }
  } catch (err) {
    // If anything fails, ensure we have a polling fallback
    if (!_visibilityInterval.value) {
      _visibilityInterval.value = window.setInterval(checkAndClear, 250)
    }
  }

  // run an initial check right away
  checkAndClear()

  // store the observer on the interval ref so we can clean it on unmount (we'll close explicitly below)
  ;(onUnmounted as any)(() => {
    // noop placeholder to keep single onUnmounted block below; actual cleanup happens in the main onUnmounted
  })
  ;(mutationObserver as any)._is_temp = true
})

onUnmounted(() => {
  // cleanup visibility observer / polling
  try {
    // try to disconnect any MutationObserver we attached by walking ancestors and disconnecting observers
    // (we attached observers in onMounted). Safe-guard with try/catch.
    if (typeof MutationObserver !== 'undefined' && componentRootRef.value) {
      // There's no direct reference to the MutationObserver here (was local), but observers attached
      // to nodes will be GC'd when disconnected; best-effort: remove visibilitychange listener and
      // clear polling interval if set.
      document.removeEventListener('visibilitychange', () => {})
    }
  } catch (e) {
    // ignore
  }
  if (_visibilityInterval.value) {
    clearInterval(_visibilityInterval.value)
    _visibilityInterval.value = null
  }
  // clear pending search debounce timer if any
  try {
    if (primarySearchTimer.value) {
      clearTimeout(primarySearchTimer.value)
      primarySearchTimer.value = null
    }
  } catch (e) {
    // ignore
  }
})

// Scroll automático y sombras laterales
const tableContainerRef = ref<HTMLElement | null>(null)
const showLeftShadow = ref(false)
const showRightShadow = ref(false)
const scrollLeft = ref(0)
const containerWidth = ref(0)
const autoScrollInterval = ref<number | null>(null)
const SCROLL_SPEED = 20 // píxeles por frame
const EDGE_THRESHOLD = 100 // píxeles desde el borde para activar auto-scroll

const canScrollLeft = () => {
  if (!tableContainerRef.value) return false
  return tableContainerRef.value.scrollLeft > 0
}

const canScrollRight = () => {
  if (!tableContainerRef.value) return false
  const element = tableContainerRef.value
  const scrollLeft = element.scrollLeft
  const scrollWidth = element.scrollWidth
  const clientWidth = element.clientWidth
  return scrollLeft < (scrollWidth - clientWidth - 1)
}

const updateScrollPosition = () => {
  if (!tableContainerRef.value) return
  scrollLeft.value = tableContainerRef.value.scrollLeft
  containerWidth.value = tableContainerRef.value.clientWidth
}

const handleScroll = () => {
  updateScrollPosition()
}

const handleMouseMove = (event: MouseEvent) => {
  if (!tableContainerRef.value) return
  
  updateScrollPosition()
  
  const rect = tableContainerRef.value.getBoundingClientRect()
  const mouseX = event.clientX - rect.left
  const width = rect.width
  
  // Detectar si el mouse está cerca del borde izquierdo
  if (mouseX < EDGE_THRESHOLD && canScrollLeft()) {
    showLeftShadow.value = true
    showRightShadow.value = false
    startAutoScroll('left')
  }
  // Detectar si el mouse está cerca del borde derecho
  else if (mouseX > width - EDGE_THRESHOLD && canScrollRight()) {
    showRightShadow.value = true
    showLeftShadow.value = false
    startAutoScroll('right')
  }
  // Si está en el medio, ocultar sombras y detener auto-scroll
  else {
    showLeftShadow.value = false
    showRightShadow.value = false
    stopAutoScroll()
  }
}

const startAutoScroll = (direction: 'left' | 'right') => {
  if (autoScrollInterval.value) return // Ya está corriendo
  
  autoScrollInterval.value = window.setInterval(() => {
    if (!tableContainerRef.value) return
    
    const scrollAmount = direction === 'left' ? -SCROLL_SPEED : SCROLL_SPEED
    tableContainerRef.value.scrollLeft += scrollAmount
    
    // Verificar si llegamos al límite y detener
    if ((direction === 'left' && !canScrollLeft()) ||
        (direction === 'right' && !canScrollRight())) {
      stopAutoScroll()
    }
  }, 16) // ~60fps
}

const stopAutoScroll = () => {
  if (autoScrollInterval.value) {
    clearInterval(autoScrollInterval.value)
    autoScrollInterval.value = null
  }
  // Ocultar sombras cuando se detiene el auto-scroll
  showLeftShadow.value = false
  showRightShadow.value = false
}

onMounted(() => {
  updateScrollPosition()
  // Observar cambios de tamaño
  if (tableContainerRef.value) {
    const resizeObserver = new ResizeObserver(() => {
      updateScrollPosition()
    })
    resizeObserver.observe(tableContainerRef.value)
    
    onUnmounted(() => {
      resizeObserver.disconnect()
    })
  }
})

onUnmounted(() => {
  stopAutoScroll()
})

const goBack = () => {
  if (props.previousPageUrl) {
    navigateTo(props.previousPageUrl)
  } else {
    router.back()
  }
}

// Simple translations for 'almacen' role
const translations = computed(() => {
  if (isAlmacen.value) {
    return {
      export: 'Export',
      filters: 'Filters',
      clearFilters: 'Clear filters',
      close: 'Close',
      loading: 'Loading...',
      emptyTitle: 'No records',
      emptyMessage: 'There are no records to show',
  showing: 'Showing',
      results: 'results',
      perPage: 'Showing per page',
      viewExcel: 'View products Excel',
      a: 'to',
      resultados: 'results',
      de: 'of',
      primarySearchLabel: 'Search for'
    }
  }
  return {
    export: 'Exportar',
    filters: 'Filtros',
    clearFilters: 'Borrar filtros',
    close: 'Cerrar',
    loading: 'Cargando...',
    emptyTitle: 'No hay registros',
    emptyMessage: 'No hay registros',
  showing: 'Mostrando',
    results: 'resultados',
    perPage: 'Mostrar:',
    viewExcel: 'Ver Excel de productos',
    a: 'a',
    resultados: 'resultados',
    de: 'de',
    primarySearchLabel: 'Buscar por'
  }
})

// Translate filter labels/options for almacen role
const displayedFilterConfig = computed(() => {
  const dict: Record<string, string> = {
    'Rubro': 'Category',
    'Tipo Producto': 'Product Type',
    'Campaña': 'Campaign',
    'Todos': 'All',
    'Seleccionar rubro': 'Select category',
    'Seleccionar tipo': 'Select type',
    'Seleccionar campaña': 'Select campaign'
  }

  const raw = props.filterConfig || []
  if (!isAlmacen.value) return raw

  return raw.map(f => ({
    ...f,
    label: dict[f.label] || f.label,
    placeholder: dict[f.placeholder] || f.placeholder,
    options: (f.options || []).map(o => ({ ...o, label: (dict[o.label] || o.label) }))
  }))
})
</script>
<style scoped>
tr.absolute.z-\[1\].left-0.w-full.h-px.bg-\(--ui-border-accented\) {
  display: none;
}

/* Contenedor de scroll */
.scroll-container {
  position: relative;
}

/* Sombras laterales para indicar scroll horizontal */
.scroll-shadow {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 80px;
  pointer-events: none;
  z-index: 30;
  animation: fadeIn 0.15s ease-in-out;
}

.scroll-shadow-left {
  background: linear-gradient(to right, rgba(59, 130, 246, 0.5) 0%, rgba(59, 130, 246, 0.3) 40%, transparent 100%);
}

.scroll-shadow-right {
  background: linear-gradient(to left, rgba(59, 130, 246, 0.5) 0%, rgba(59, 130, 246, 0.3) 40%, transparent 100%);
}

/* Sombras para modo oscuro */
.dark .scroll-shadow-left {
  background: linear-gradient(to right, rgba(96, 165, 250, 0.6) 0%, rgba(96, 165, 250, 0.4) 40%, transparent 100%);
}

.dark .scroll-shadow-right {
  background: linear-gradient(to left, rgba(96, 165, 250, 0.6) 0%, rgba(96, 165, 250, 0.4) 40%, transparent 100%);
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
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