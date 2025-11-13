import { ROLES } from '~/constants/roles'
import { useUserRole } from '~/composables/auth/useUserRole'
const { hasRole, isCoordinacion,currentRole } = useUserRole()
const isAlmacen = computed(() => hasRole(ROLES.CONTENEDOR_ALMACEN))


const translations = computed(() => {
  if( isAlmacen.value) {
    return {
      search: 'Search for',
      searchPlaceholder: 'Search for',
      emptyStateMessage: 'No records found matching the search criteria.',
    }
  }
  return {
    search: 'Buscar por',
    searchPlaceholder: 'Buscar por',
    emptyStateMessage: 'No se encontraron registros que coincidan con los criterios de búsqueda.',
  }
})

export const DATA_TABLE_DEFAULTS = {
  icon: 'i-heroicons-document-text',
  showSkeleton: true,
  loading: false,
  searchPlaceholder: translations.value.searchPlaceholder,
  showPagination: true,
  showBottomSection: true,
  showPrimarySearch: true,
  primarySearchLabel: translations.value.search,
  primarySearchPlaceholder: translations.value.searchPlaceholder,
  showFilters: false,
  filterConfig: () => [],
  showExport: false,
  currentPage: 1,
  totalPages: 1,
  totalRecords: 0,
  itemsPerPage: 10,
  emptyStateMessage: translations.value.emptyStateMessage,
  hideBackButton: true,
  showBodyTop: false
} as const


export const PAGINATION_OPTIONS = [5, 10, 25, 50, 100] 