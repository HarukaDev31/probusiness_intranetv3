export const DATA_TABLE_DEFAULTS = {
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
} as const

export const PAGINATION_OPTIONS = [5, 10, 25, 50, 100] 