import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import type { DataTableProps } from '../types/data-table'
import { formatDateForInput } from '../utils/data-table'

export const useDataTable = (props: DataTableProps, emit: any) => {
  // Local state
  const showFiltersPanel = ref(false)
  const filtersPanelRef = ref<HTMLElement>()
  const filtersButtonRef = ref<HTMLElement>()
  const isSelectOpen = ref(false)

  // Filtered data (can be overridden by parent)
  const filteredData = computed(() => props.data)

  // Methods
  const handleFilterChange = (filterType: string, value: string) => {
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

  return {
    // State
    showFiltersPanel,
    filtersPanelRef,
    filtersButtonRef,
    isSelectOpen,
    
    // Computed
    filteredData,
    
    // Methods
    handleFilterChange,
    handleSelectOpen,
    handleSelectClose,
    handleExport,
    onPageChange,
    onItemsPerPageChange
  }
} 