  <template>
  <div ref="componentRootRef" class="">

    <!-- Sticky Top Section -->
    <div v-if="!showTopSection" class="sticky top-0 z-40 bg-[#f0f4f9] dark:bg-gray-900">
  <slot name="filters" />
  <template v-if="!$slots.filters">
    <div class="flex flex-col md:flex-row flex-wrap gap-4 p-0 md:p-4 ">
      <div class="w-full lg:w-full flex flex-col md:flex-row items-start md:items-center md:justify-between gap-1 md:gap-3 items-center">
        <PageHeader :title="title" :subtitle="subtitle" :icon="icon" :hide-back-button="hideBackButton" @back="goBack">
          <template v-if="$slots['back-extra']" #back-extra>
            <slot name="back-extra" />
          </template>
        </PageHeader>

        <!-- Headers: show below title and above search/actions -->
        <div v-if="showHeaders" class="bg-transparent border-b border-gray-200 dark:border-gray-700 w-full lg:mt-0 block lg:hidden">
          <div class="overflow-visible">
            <div class="flex flex-wrap items-center md:gap-3 justify-center">
              <div v-for="header in headers" :key="header.value" class="inline-flex items-center gap-1 mr-3">
                <span class="text-xs lg:text-sm text-gray-600 dark:text-gray-400">
                  {{ header.label }}:
                </span>
                <UBadge :label="header.value || 'N/A'" color="neutral" variant="outline" size="sm"
                  class="font-medium text-xs" />
              </div>
            </div>
          </div>
        </div>

        <!-- Search and Actions -->
        <div class="flex lg:flex-row items-center lg:items-center gap-1 md:gap-3 w-full lg:w-auto">
          <div v-if="showPrimarySearch" class="flex items-center gap-2 h-10 w-full lg:w-auto">
            <label v-if="showPrimarySearchLabel"
              class="text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap">{{ translations.primarySearchLabel }}:</label>
            <UInput :model-value="primarySearchInternal" :placeholder="primarySearchPlaceholder"
              class="flex-1 h-5 min-w-0 md:h-10 lg:h-10" :ui="{ base: 'h-7 md:h-10 lg:h-10' }"
              @update:model-value="onPrimarySearchChange">
              <template #leading>
                <UIcon name="i-heroicons-magnifying-glass" class="text-gray-400" />
              </template>
            </UInput>
          </div>

          <UButton v-if="showExport" :label="translations.export" icon="i-heroicons-arrow-up-tray"
            class="h-8 md:h-11 font-normal bg-white text-gray-900 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-100 w-full lg:w-auto hidden md:flex"
            @click="handleExport" />
            <div class="flex items-center gap-2 relative md:w-full lg:w-auto">
            <div ref="filtersButtonRef" class="w-auto lg:w-auto">
              <UButton v-if="showFilters"
                :label="isMobile ? '' : translations.filters"
                :aria-label="translations.filters"
                :title="translations.filters"
                icon="i-heroicons-funnel"

                class="h-8 md:h-11 font-normal bg-white text-gray-900 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-100"
                :class="isMobile ? 'w-10 p-0 ml-0 justify-center gap-0' : 'w-full lg:w-auto'"
                @click="showFiltersPanel = !showFiltersPanel" />
            </div>

            <!-- Desktop: keep inline absolute panel to preserve original behavior on large screens -->
            <div v-if="showFiltersPanel && showFilters && typeof isMobile !== 'undefined' && !isMobile"
              ref="filtersPanelRef"
              class="filters-panel absolute top-full right-0 mt-2 w-full lg:w-96 max-w-[90vw] lg:max-w-none bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 p-4 max-h-[80vh] overflow-y-auto"
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

            <!-- Mobile: teleport the filters panel to body to avoid clipping; only active when isMobile === true -->
            <teleport to="body" v-if="showFiltersPanel && showFilters && typeof isMobile !== 'undefined' && isMobile">
              <!-- Overlay: usando utilidades Tailwind para color y backdrop; mantenemos la clase antigua para compatibilidad -->
              <div class="filters-overlay fixed inset-0 bg-black/40 backdrop-blur-sm z-[990]" @click="showFiltersPanel = false"></div>

              <!-- Panel móvil: utilidades Tailwind para fondo, dark-mode, tamaño y scroll; mantenemos la clase antigua para reglas legacy -->
              <div ref="filtersPanelRef" class="filters-panel-mobile fixed left-4 right-4 top-[12vh] max-h-[calc(100vh-16vh)] mx-auto z-[1000] bg-white text-gray-900 dark:bg-slate-900 dark:text-slate-100 rounded-xl shadow-lg overflow-y-auto p-3" @click.stop>
                <!-- Nota: este panel usa utilidades Tailwind (bg / dark:bg / z-index / spacing) para asegurar comportamiento claro/oscuro -->
                <div class="sticky top-0 bg-transparent pb-2 mb-2 z-10 flex items-center justify-between">
                  <div class="text-sm font-medium text-gray-800 dark:text-gray-200">{{ translations.filters }}</div>
                  <button type="button" class="filters-close bg-transparent border-0 text-lg p-1" @click="showFiltersPanel = false">✕</button>
                </div>

                <div class="grid grid-cols-1 lg:grid-cols-1 gap-4 p-2">
                  <div v-for="filter in displayedFilterConfig" :key="filter.key" class="field grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      {{ filter.label }}
                    </label>
                    <UInput v-if="filter.type === 'date'"
                      :model-value="formatDateForInput(filtersValue && filtersValue[filter.key])" type="date"
                      :placeholder="filter.placeholder" class="w-full"
                      @update:model-value="(value) => handleFilterChange(filter.key, value)" @click.stop />
                    <USelect v-else :model-value="(() => {
                        const value = filtersValue && filtersValue[filter.key]
                        return value
                      })()" :items="filter.options" :placeholder="filter.placeholder" class="w-full"
                        @update:model-value="(value) => {
                          handleFilterChange(filter.key, value)
                        }" @click.stop @focus="handleSelectOpen" @blur="handleSelectClose" />
                  </div>
                </div>

                <div class="mt-2 pt-3 border-t border-gray-200 dark:border-gray-700 px-2">
                  <div class="flex items-center justify-between">
                    <UButton
                      icon="i-heroicons-x-mark"
                      class="h-8 bg-amber-50 dark:bg-amber-900 text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-800 border-0"
                      :label="translations.clearFilters"
                      @click="handleClearFilters"
                    />
                    <button type="button" class="text-sm text-gray-600 dark:text-gray-300 hover:underline" @click="showFiltersPanel = false">
                      {{ translations.close }}
                    </button>
                  </div>
                </div>
              </div>
            </teleport>
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

      <!-- Desktop headers (only on lg and up) - keep original placement for PC layout -->
      <div v-if="showHeaders" class="hidden lg:block bg-transparent border-b border-gray-200 dark:border-gray-700">
        <div class="px-4 lg:px-6 py-3">
          <div class="flex flex-wrap items-center gap-3">
            <div v-for="header in headers" :key="header.value" class="inline-flex items-center gap-2 mr-4">
              <span class="text-xs lg:text-sm text-gray-600 dark:text-gray-400">
                {{ header.label }}:
              </span>
              <UBadge :label="header.value || 'N/A'" color="neutral" variant="outline" size="sm"
                class="font-medium text-xs" />
            </div>
          </div>
        </div>
      </div>

      <!-- Body Top Slot (compact on mobile) -->
      <div class="flex flex-col sm:flex-row justify-center md:justify-between px-0 py-0 md:px-4 sm:py-4 text-xs sm:text-sm gap-2" v-if="showBodyTop">
        <slot name="body-top" />
      </div>
    </div>

    <!-- Table Section -->
    <div class="relative" ref="tableWrapperRef">
      <!-- Indicador de scroll izquierdo -->
      <div 
        v-if="showLeftIndicator && !isMobile" 
        class="scroll-indicator scroll-indicator-left"
      >
        <UIcon name="i-heroicons-chevron-left" class="w-5 h-5 text-gray-500 animate-pulse" />
      </div>
      <!-- Indicador de scroll derecho -->
      <div 
        v-if="showRightIndicator && !isMobile" 
        class="scroll-indicator scroll-indicator-right"
      >
        <UIcon name="i-heroicons-chevron-right" class="w-5 h-5 text-gray-500 animate-pulse" />
      </div>
      
      <div 
        ref="tableContainerRef"
        class="table-scroll-container"
        style="max-height: calc(100vh - 250px);"
        @mousemove="onTableMouseMove"
        @mouseleave="onTableMouseLeave"
        @scroll="onTableScroll"
      >
        <UTable ref="utableRef" :key="tableKey" :data="filteredData" sticky :columns="columns" :loading="loading"
          :class="['', isTableNarrow ? 'utable-narrow' : 'min-w-full']"   :meta="tableMeta"
          :ui="Object.keys(tableMeta).length>0?{}:{
            base: 'min-w-full',
            tbody: 'border-separate border-spacing-y-6',
            td: 'bg-white dark:bg-gray-800 dark:text-white p-2 lg:p-4 text-xs lg:text-sm',
            th: 'font-medium text-xs lg:text-sm font-normal px-2 py-1 md:px-4 md:py-3.5',
            thead: 'sticky top-0 z-30 bg-[#f0f4f9] dark:bg-gray-900 h-10 md:h-15',
            tr: 'border-[#f0f4f9] dark:border-gray-900',
          }"
          >
         
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
      class="md:sticky bottom-0 z-40 bg-[#f0f4f9] dark:bg-gray-900">
      <div class="flex flex-col lg:flex-row items-start lg:items-center justify-between p-4 gap-4">
        <div class="text-xs lg:text-sm text-gray-700 dark:text-gray-300 text-center lg:text-left w-full lg:w-auto">
          {{ translations.showing }} {{ ((currentPage || 1) - 1) * (itemsPerPage || 100) + 1 }} {{translations.a}} {{ Math.min((currentPage || 1) *
            (itemsPerPage || 100), totalRecords) }}
          {{ translations.de }} {{ totalRecords }} {{ translations.resultados }}
        </div>
        <div class="flex flex-col lg:flex-row items-center gap-4 w-full lg:w-auto" v-if="showPagination">
          <div class="flex items-center gap-2 justify-center lg:justify-start hidden md:flex">
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
import { h, resolveComponent, computed, ref, onMounted, onUnmounted, watch, nextTick } from 'vue'
import type { DataTableProps, DataTableEmits } from '../types/data-table'
import { useDataTable } from '../composables/useDataTable'
import { DATA_TABLE_DEFAULTS, PAGINATION_OPTIONS } from '../constants/data-table'
import { ROLES } from '~/constants/roles'
import { useUserRole } from '~/composables/auth/useUserRole'
const { hasRole, isCoordinacion,currentRole } = useUserRole()
const isAlmacen = computed(() => hasRole(ROLES.CONTENEDOR_ALMACEN))
import { formatDateForInput } from '../utils/data-table'
import { setContentNarrow } from '../composables/usePageLayout'
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

  // Scroll hacia arriba cuando cambia la página
  scrollToTop()

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
  
  // Scroll hacia arriba cuando cambia items per page
  scrollToTop()
  
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
  onItemsPerPageChange,
  filtersValue
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

// Referencias de la tabla
const tableContainerRef = ref<HTMLElement | null>(null)
const tableWrapperRef = ref<HTMLElement | null>(null)
const utableRef = ref<HTMLElement | null>(null)
const isTableNarrow = ref(false)

// Mobile detection - DEBE estar antes de las funciones de auto-scroll
const isMobileForScroll = ref(false)

// ============================================================================
// AUTO-SCROLL HORIZONTAL - Solo desktop
// ============================================================================
const autoScrollTimer = ref<ReturnType<typeof setInterval> | null>(null)
const SCROLL_SPEED = 12
const EDGE_ZONE = 100 // Zona de activación en píxeles desde el borde

const startAutoScroll = (direction: 'left' | 'right') => {
  // Detener cualquier scroll anterior
  stopAutoScroll()
  
  autoScrollTimer.value = setInterval(() => {
    const scrollableEl = findScrollableElement()
    if (!scrollableEl) return
    
    const maxScroll = scrollableEl.scrollWidth - scrollableEl.clientWidth
    const currentScroll = scrollableEl.scrollLeft
    
    if (direction === 'right' && currentScroll < maxScroll) {
      scrollableEl.scrollLeft = Math.min(currentScroll + SCROLL_SPEED, maxScroll)
    } else if (direction === 'left' && currentScroll > 0) {
      scrollableEl.scrollLeft = Math.max(currentScroll - SCROLL_SPEED, 0)
    } else {
      stopAutoScroll()
    }
  }, 16) // ~60fps
}

const stopAutoScroll = () => {
  if (autoScrollTimer.value) {
    clearInterval(autoScrollTimer.value)
    autoScrollTimer.value = null
  }
}

// Función para encontrar el elemento con scroll horizontal real
const findScrollableElement = (): HTMLElement | null => {
  const container = tableContainerRef.value
  if (!container) return null
  
  // Primero verificar el contenedor directo
  if (container.scrollWidth > container.clientWidth) {
    return container
  }
  
  // Buscar en hijos: el div interno de UTable
  const innerDiv = container.querySelector('[data-slot="table-root"]') as HTMLElement
  if (innerDiv && innerDiv.scrollWidth > innerDiv.clientWidth) {
    return innerDiv
  }
  
  // Buscar cualquier elemento con overflow-x: auto/scroll
  const scrollable = container.querySelector('.overflow-x-auto, .overflow-auto') as HTMLElement
  if (scrollable && scrollable.scrollWidth > scrollable.clientWidth) {
    return scrollable
  }
  
  // Buscar la tabla directamente
  const table = container.querySelector('table') as HTMLElement
  if (table && table.parentElement) {
    const parent = table.parentElement
    if (parent.scrollWidth > parent.clientWidth) {
      return parent
    }
  }
  
  return container
}

const onTableMouseMove = (e: MouseEvent) => {
  // Solo en desktop (pantallas > 768px)
  if (isMobileForScroll.value) return
  
  const scrollableEl = findScrollableElement()
  if (!scrollableEl) {
    console.log('[AutoScroll] No se encontró elemento scrollable')
    return
  }
  
  // Verificar si hay scroll horizontal disponible
  const hasScroll = scrollableEl.scrollWidth > scrollableEl.clientWidth
  if (!hasScroll) {
    // Debug: mostrar todos los elementos y sus dimensiones
    const container = tableContainerRef.value
    console.log('[AutoScroll] Debug dimensiones:', {
      container: container ? { scrollWidth: container.scrollWidth, clientWidth: container.clientWidth } : null,
      scrollableEl: { scrollWidth: scrollableEl.scrollWidth, clientWidth: scrollableEl.clientWidth, tagName: scrollableEl.tagName }
    })
    stopAutoScroll()
    return
  }
  
  const rect = scrollableEl.getBoundingClientRect()
  const mouseX = e.clientX - rect.left
  const containerWidth = rect.width
  const maxScroll = scrollableEl.scrollWidth - scrollableEl.clientWidth
  
  // Zona izquierda
  if (mouseX < EDGE_ZONE && scrollableEl.scrollLeft > 0) {
    console.log('[AutoScroll] ✅ Zona IZQUIERDA')
    if (!autoScrollTimer.value) startAutoScroll('left')
  }
  // Zona derecha
  else if (mouseX > containerWidth - EDGE_ZONE && scrollableEl.scrollLeft < maxScroll) {
    console.log('[AutoScroll] ✅ Zona DERECHA')
    if (!autoScrollTimer.value) startAutoScroll('right')
  }
  // Zona central - detener
  else {
    stopAutoScroll()
  }
}

const onTableMouseLeave = () => {
  stopAutoScroll()
}

// Indicadores de scroll
const showLeftIndicator = ref(false)
const showRightIndicator = ref(false)

const updateScrollIndicators = () => {
  const container = tableContainerRef.value
  if (!container) {
    showLeftIndicator.value = false
    showRightIndicator.value = false
    return
  }
  
  const maxScroll = container.scrollWidth - container.clientWidth
  showLeftIndicator.value = container.scrollLeft > 10
  showRightIndicator.value = container.scrollLeft < maxScroll - 10
}

const onTableScroll = () => {
  updateScrollIndicators()
}

// Función para hacer scroll hacia arriba
const scrollToTop = () => {
  try {
    if (tableContainerRef.value) {
      tableContainerRef.value.scrollTop = 0
    }
    if (componentRootRef.value) {
      componentRootRef.value.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  } catch (e) {
    // ignore errors
  }
}

// Usar RAF para batching de lecturas de layout
let updateNarrownessScheduled = false
const updateNarrowness = () => {
  if (updateNarrownessScheduled) return
  updateNarrownessScheduled = true
  
  requestAnimationFrame(() => {
    updateNarrownessScheduled = false
    
    try {
      const container = tableContainerRef.value
      if (!container) {
        isTableNarrow.value = false
        return
      }
      
      // Batching: leer todas las propiedades de layout juntas
      const innerTable = container.querySelector && container.querySelector('table')
      const contentWidth = innerTable ? (innerTable.scrollWidth || (innerTable as HTMLElement).offsetWidth) : (container.scrollWidth || 0)
      const containerWidth = container.clientWidth
      
      // Ahora hacer las escrituras
      const hasHorizontal = contentWidth > (containerWidth + 1)
      isTableNarrow.value = !hasHorizontal
      
      // propagate to page-level layout
      try {
        setContentNarrow(isTableNarrow.value)
      } catch (e) {
        // ignore if composable not available
      }
    } catch (e) {
      isTableNarrow.value = false
    }
  })
}


const uiForTable = computed(() => ({
  root: 'relative overflow-visible',
  base: isTableNarrow.value ? 'min-w-[80%]' : 'min-w-full',
  tbody: 'border-separate border-spacing-y-6',
  td: 'bg-white dark:bg-gray-800 dark:text-white p-2 lg:p-4 text-xs lg:text-sm',
  th: 'font-medium text-xs lg:text-sm font-normal px-2 py-1 md:px-4 md:py-3.5',
  // Nuxt UI aplica automáticamente: thead: 'sticky top-0 inset-x-0 bg-default/75 z-[1] backdrop-blur'
  // Make the thead have a thicker bottom border colored like the header background
  thead: 'top-0 bg-[#f0f4f9] dark:bg-gray-900 h-10 md:h-15',
  tr: 'border-[#f0f4f9] dark:border-gray-900',
}))


onMounted(() => {
  // Inicializar detección de mobile para auto-scroll
  isMobileForScroll.value = window.innerWidth <= 768
  
  // Observar cambios de tamaño para actualizar narrowness
  if (tableContainerRef.value) {
    const resizeObserver = new ResizeObserver(() => {
      updateNarrowness()
      updateScrollIndicators()
      // Actualizar detección de mobile
      isMobileForScroll.value = window.innerWidth <= 768
    })
    resizeObserver.observe(tableContainerRef.value)

    // compute initial narrowness
    updateScrollIndicators()
    updateNarrowness()

    // keep narrowness updated on window resize too
    window.addEventListener('resize', updateNarrowness, { passive: true })

    onUnmounted(() => {
      resizeObserver.disconnect()
      window.removeEventListener('resize', updateNarrowness)
    })
  }
})

onUnmounted(() => {
  // reset global page narrow state when component unmounts
  try { setContentNarrow(false) } catch (e) {}
  // Limpiar auto-scroll
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

// Mobile detection reactive used to switch to teleported panel only on small screens
const isMobile = ref(false)
let resizeRafId: number | null = null
const updateIsMobile = () => {
  if (resizeRafId) return
  resizeRafId = requestAnimationFrame(() => {
    resizeRafId = null
    try {
      isMobile.value = window.innerWidth <= 1024
    } catch (e) {
      isMobile.value = false
    }
  })
}
onMounted(() => {
  updateIsMobile()
  window.addEventListener('resize', updateIsMobile, { passive: true })
})
onUnmounted(() => {
  try { 
    window.removeEventListener('resize', updateIsMobile)
    if (resizeRafId) {
      cancelAnimationFrame(resizeRafId)
      resizeRafId = null
    }
  } catch (e) {}
})
</script>

<style scoped>
/* Headers scroll helper: enable smooth touch scrolling and provide a subtle track/thumb for WebKit */
.headers-scroll {
  -webkit-overflow-scrolling: touch;
}
.headers-scroll::-webkit-scrollbar {
  height: 6px;
}
.headers-scroll::-webkit-scrollbar-thumb {
  background: rgba(0,0,0,0.12);
  border-radius: 9999px;
}
/* hide native scrollbar for non-webkit while keeping scroll functionality */
.hide-native-scrollbar {
  scrollbar-width: none; /* Firefox */
  -ms-overflow-style: none; /* IE 10+ */
}
.hide-native-scrollbar::-webkit-scrollbar { display: none; }

/* Ensure overflow is visible on larger screens */
@media (min-width: 640px) {
  .headers-scroll { overflow-x: visible !important; }
}
</style>
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

/* Compact styles for filters panel on small screens */
@media (max-width: 640px) {
  .filters-panel {
    padding: 0.5rem !important;
    max-height: 70vh !important;
    border-radius: 0.5rem !important;
    width: calc(100% - 1rem) !important;
    right: 0.5rem !important;
    left: 0.5rem !important;
  }

  .filters-panel .grid {
    gap: 0.5rem !important;
    padding: 0 !important;
  }

  .filters-panel label {
    font-size: 0.775rem !important;
    margin-bottom: 0.125rem !important;
  }

  .filters-panel input,
  .filters-panel textarea,
  .filters-panel select {
    height: 2rem !important;
    padding: 0.35rem 0.5rem !important;
    box-shadow: 0 12px 40px rgba(2,6,23,0.12);
  }

  .filters-panel .h-8 { height: 2.25rem !important; }
  .filters-panel .h-11 { height: 2.5rem !important; }

  /* Dark mode tweaks for mobile filters panel to improve contrast and harmony */
  .dark .filters-panel-mobile {
    background: #0f1724; /* deep dark to match app dark background */
    color: #e6eef8;
    border: 1px solid rgba(255,255,255,0.04);
    box-shadow: 0 10px 30px rgba(2,6,23,0.6);
  }

  /* Make header/close text lighter in dark mode */
  .dark .filters-panel-mobile .filters-header,
  .dark .filters-panel-mobile .filters-header * {
    color: #cbd5e1;
  }

  /* Ensure inputs / selects inside the panel inherit dark styling if they don't already */
  .dark .filters-panel-mobile input,
  .dark .filters-panel-mobile select,
  .dark .filters-panel-mobile .u-input,
  .dark .filters-panel-mobile .u-select,
  .dark .filters-panel-mobile .combobox-content {
    background: #0b1220 !important;
    color: #e6eef8 !important;
    border-color: rgba(255,255,255,0.06) !important;
  }

  .filters-panel .mt-2 { margin-top: 0.35rem !important; }
  .filters-panel .pt-3 { padding-top: 0.35rem !important; }
}

/* Asegurar que el overlay funcione correctamente */
.fixed.inset-0 {
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
}


/* When table is narrow (no horizontal scroll), center it by applying flex on the UTable root */
.utable-narrow {
  display: flex;
  flex-direction: column;
  align-items: center;
}
.utable-narrow table {
  width: auto !important;
  min-width: 80% !important;
}

/* Scoped styles can't reach inside child components; use deep selector to target inner table rendered by UTable */
.utable-narrow ::v-deep table {
  width: auto !important;
  /* Allow very small tables to keep their natural width; page container enforces minimum instead */
  min-width: 80% !important;
}

/* Add small vertical spacing between tbody rows to make rows breathe */
/* Use ::v-deep to reach the actual <table> rendered by UTable */
.utable-narrow ::v-deep table,
.min-w-full ::v-deep table {
  border-collapse: separate !important;
  /* vertical spacing: 0.5rem (8px) - adjust to taste */
  border-spacing: 0 0.5rem !important;
}

/* When using separate border mode, ensure rows look like separate blocks */



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

<!-- Global styles for teleported mobile filters (must be global to affect elements teleported to body) -->
<style>
/* Backdrop overlay for teleported mobile panel */
.filters-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.35);
  z-index: auto; /* lowered so selects/portals with higher z-index can appear above */
  -webkit-backdrop-filter: blur(3px);
  backdrop-filter: blur(3px);
}

/* Mobile-specific panel styling when teleported */
.filters-panel-mobile {
  position: fixed;
  left: 1rem;
  right: 1rem;
  top: 12vh;
  max-height: calc(100vh - 16vh);
  margin: 0 auto;
  z-index: auto; /* lowered from 1050 to avoid overlapping select portals */
  background: #ffffff;
  border-radius: 0.75rem;
  box-shadow: 0 12px 40px rgba(2,6,23,0.12);
  overflow-y: auto;
  padding: 0.75rem;
  -webkit-overflow-scrolling: touch;
}

.filters-panel-mobile .filters-header {
  position: sticky;
  top: 0;
  background: transparent;
  padding-bottom: 0.5rem;
  margin-bottom: 0.5rem;
  z-index: 2;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.filters-panel-mobile .filters-close {
  background: transparent;
  border: none;
  font-size: 1rem;
  cursor: pointer;
  padding: 0.25rem 0.5rem;
}

@media (min-width: 1025px) {
  /* ensure teleported classes do not affect desktop if somehow present */
  .filters-overlay, .filters-panel-mobile { display: none !important; }
}

/* ==========================================================================
   TABLE SCROLL CONTAINER - Estilos globales para scroll horizontal
   ========================================================================== */

/* Contenedor principal de scroll */
.table-scroll-container {
  position: relative;
  overflow-x: auto !important;
  overflow-y: auto !important;
  -webkit-overflow-scrolling: touch;
  /* Firefox */
  scrollbar-width: thin;
  scrollbar-color: #9ca3af #e5e7eb;
}

/* Forzar que la tabla tenga ancho mínimo para scroll */
.table-scroll-container table {
  min-width: 800px;
}

/* Webkit scrollbar (Chrome, Safari, Edge) */
.table-scroll-container::-webkit-scrollbar {
  width: 10px;
  height: 14px;
}

.table-scroll-container::-webkit-scrollbar-track {
  background: #e5e7eb;
  border-radius: 7px;
}

.table-scroll-container::-webkit-scrollbar-thumb {
  background: #9ca3af;
  border-radius: 7px;
  border: 2px solid #e5e7eb;
}

.table-scroll-container::-webkit-scrollbar-thumb:hover {
  background: #6b7280;
}

.table-scroll-container::-webkit-scrollbar-corner {
  background: #e5e7eb;
}

/* Dark mode */
.dark .table-scroll-container {
  scrollbar-color: #6b7280 #1f2937;
}

.dark .table-scroll-container::-webkit-scrollbar-track {
  background: #1f2937;
}

.dark .table-scroll-container::-webkit-scrollbar-thumb {
  background: #6b7280;
  border-color: #1f2937;
}

.dark .table-scroll-container::-webkit-scrollbar-thumb:hover {
  background: #9ca3af;
}

.dark .table-scroll-container::-webkit-scrollbar-corner {
  background: #1f2937;
}

/* Headers sticky */
.table-scroll-container table thead {
  position: sticky;
  top: 0;
  z-index: 30;
  background: #f0f4f9;
}

.dark .table-scroll-container table thead {
  background: #111827;
}

/* Indicadores de scroll */
.scroll-indicator {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  z-index: 40;
  width: 40px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
  opacity: 0.8;
}

.scroll-indicator-left {
  left: 0;
  background: linear-gradient(to right, rgba(240, 244, 249, 0.95), transparent);
  border-radius: 0 8px 8px 0;
}

.scroll-indicator-right {
  right: 0;
  background: linear-gradient(to left, rgba(240, 244, 249, 0.95), transparent);
  border-radius: 8px 0 0 8px;
}

.dark .scroll-indicator-left {
  background: linear-gradient(to right, rgba(17, 24, 39, 0.95), transparent);
}

.dark .scroll-indicator-right {
  background: linear-gradient(to left, rgba(17, 24, 39, 0.95), transparent);
}
</style>