import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import type { DataTableProps } from '../types/data-table'
import { formatDateForInput } from '../utils/data-table'

export const useDataTable = (props: DataTableProps, emit: any) => {
  // Local state
  const showFiltersPanel = ref(false)
  const filtersPanelRef = ref<HTMLElement>()
  const filtersButtonRef = ref<HTMLElement>()
  const isSelectOpen = ref(false)
  // Draft filter values shown in the panel. Persist across open/close unless explicitly cleared.
  const draftFilters = ref<Record<string, any>>(props.filtersValue ? { ...(props.filtersValue as Record<string, any>) } : {})
  // When true, suppress per-filter 'filter-change' emits (used during bulk clear)
  const suppressFilterEmits = ref(false)

  // Filtered data (can be overridden by parent)
  const filteredData = computed(() => props.data)

  // Methods
  const handleFilterChange = (filterType: string, value: string) => {
    // If suppressed (e.g. during a bulk clear), don't emit per-filter events
    if ((suppressFilterEmits as any)?.value) return
    // keep the draft in sync so the UI shows the last chosen values even if the panel is closed
    try {
      draftFilters.value = { ...(draftFilters.value || {}), [filterType]: value }
    } catch (e) {
      // ignore
    }

    emit('filter-change', filterType, value)

  }

  const handleSelectOpen = () => {
    isSelectOpen.value = true
  }

  const handleSelectClose = () => {
    isSelectOpen.value = false
  }

  const handleExport = () => {
    emit('export')
  }

  const handleClearFilters = () => {
    // Suppress per-filter emits while we clear so parents receive a single
    // 'update:filters' / 'clear-filters' notification instead of many events.
    try {
      suppressFilterEmits.value = true
    } catch (e) {
      // ignore
    }

    // Inform parent that filters were cleared and close the panel.
    emit('clear-filters')
    try {
      emit('update:filters', {})
    } catch (e) {
      // if parent doesn't listen or types mismatch, still proceed
    }
    // clear draft values so the panel shows empty when explicitly cleared
    try {
      draftFilters.value = {}
    } catch (e) {
      // ignore
    }

    // Re-enable per-filter emits shortly after to allow normal interactions.
    try {
      window.setTimeout(() => {
        suppressFilterEmits.value = false
      }, 50)
    } catch (e) {
      suppressFilterEmits.value = false
    }
    // Dispatch a global event so other parts of the app can react if they want
    try {
      if (typeof window !== 'undefined' && typeof CustomEvent !== 'undefined') {
        window.dispatchEvent(new CustomEvent('probusiness:clear-all-filters'))
      }
    } catch (e) {
      // ignore
    }
  }

  const onPageChange = (page: number) => {
    emit('update:currentPage', page)
    emit('page-change', page)
  }

  const onItemsPerPageChange = (limit: number) => {
    emit('update:itemsPerPage', limit)
    emit('items-per-page-change', limit)
  }

  // Click outside handler
  const handleClickOutside = (event: Event) => {
    const target = event.target as HTMLElement
    
    // Solo cerrar si el panel está abierto
    if (!showFiltersPanel.value) return
    
    // No cerrar si un select está abierto
    if (isSelectOpen.value) return
    
    // Verificar que las referencias existan
    if (!filtersPanelRef.value || !filtersButtonRef.value) return
    
    // Verificar que el elemento tenga el método contains
    if (!filtersButtonRef.value.contains) return
    
    // Verificar si el clic fue fuera del panel Y fuera del botón
    const clickedOutsidePanel = !filtersPanelRef.value.contains(target)
    const clickedOutsideButton = !filtersButtonRef.value.contains(target)
    
    // Verificar si el clic fue en un elemento de dropdown o select de Nuxt UI
    const isDropdownElement = target.closest(
      '[role="listbox"], [role="option"], [role="combobox"], ' +
      '.u-select-dropdown, .u-select-options, .u-select-menu, ' +
      '[data-headlessui-state], [data-radix-popper-content-wrapper], ' +
      '.u-dropdown, .u-popover, .u-tooltip, ' +
      '[data-state="open"], [data-state="visible"]'
    )
    
    // Verificar si el clic fue en un portal o teleport (donde Nuxt UI renderiza dropdowns)
    const isInPortal = target.closest('[data-v-], [data-nuxt], .nuxt-portal, .teleport-container')
    
    // Verificar si el clic fue en un elemento que contiene "select" o "dropdown" en su clase
    const hasSelectClasses = target.className && (
      target.className.includes('select') || 
      target.className.includes('dropdown') || 
      target.className.includes('option') ||
      target.className.includes('menu')
    )
    
    // Solo cerrar si el clic fue completamente fuera Y no es un elemento de dropdown
    if (clickedOutsidePanel && clickedOutsideButton && !isDropdownElement && !isInPortal && !hasSelectClasses) {
      showFiltersPanel.value = false
    }
  }

  // Lifecycle
  onMounted(() => {
    document.addEventListener('click', handleClickOutside)
  })

  onUnmounted(() => {
    document.removeEventListener('click', handleClickOutside)
  })

  // Keep draft in sync if parent provides new filters (e.g. via programmatic navigation)
  try {
    watch(() => props.filtersValue, (v) => {
      draftFilters.value = v ? { ...(v as Record<string, any>) } : {}
    })
  } catch (e) {
    // ignore in environments where watch may not be available
  }

  return {
    // State
    showFiltersPanel,
    filtersPanelRef,
    filtersButtonRef,
    isSelectOpen,
    // Expose draft as `filtersValue` so components using the composable (DataTable)
    // bind to this value and preserve inputs across open/close cycles.
    filtersValue: draftFilters,
    
    // Computed
    filteredData,
    
    // Methods
    handleFilterChange,
    handleSelectOpen,
    handleSelectClose,
    handleClearFilters,
    handleExport,
    onPageChange,
    onItemsPerPageChange
  }
} 