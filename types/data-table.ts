import type { TableColumn } from '@nuxt/ui'

export interface FilterOption {
  label: string
  value: string
}
export interface PaginationInfo {
  current_page: number
  last_page: number
  per_page: number
  total: number
  from: number
  to: number
}
/**
 * FilterConfig es una interfaz que define la configuración de los filtros para el DataTable
 * key: string,
 * label: string,
 * type?: string,
 * placeholder: string,
 * options: FilterOption[]
 */
export interface FilterConfig {
  key: string
  label: string
  type?: string
  placeholder: string
  options: FilterOption[]
}
export interface Header {
  label: string
  value: string
  icon?: string
}
export interface DataTableProps {
  // Basic props
  title?: string|null
  subtitle?: string|null
  icon?: string|null
  showTitle?: boolean
  showTopSection?: boolean  
  showPagination?: boolean
  showBodyTop?: boolean | null
  showBottomSection?: boolean
  // Data props
  data: any[]
  columns: TableColumn<any>[]
  loading?: boolean

  // Search props
  searchPlaceholder?: string
  showPrimarySearch?: boolean
  showPrimarySearchLabel?: boolean
  primarySearchLabel?: string
  primarySearchPlaceholder?: string

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

  // Skeleton loading UI
  showSkeleton?: boolean
  skeletonRows?: number
  skeletonCols?: number

  // Values from parent
  searchQueryValue?: string
  primarySearchValue?: string
  /** Delay in milliseconds to debounce the primary search input. When <= 0, search emits immediately. */
  searchDebounceMs?: number
  filtersValue?: Record<string, any>
  showHeaders?: boolean
  headers?: Header[]

  //New Button
  showNewButton?: boolean
  newButtonLabel?: string
  onNewButtonClick?: () => void  

  //Previous Page URL
  previousPageUrl?: string|null
  hideBackButton?: boolean
  // Optional generic prefetch callback: receives the page number to prefetch and itemsPerPage
  // Should return a Promise that resolves when prefetch completes (or rejects on error)
  prefetchNextPage?: (page: number, itemsPerPage: number) => Promise<void>

  // Table Meta
  tableMeta?: Record<string, any>
}

export interface DataTableEmits {
  'update:searchQuery': [value: string]
  'update:primarySearch': [value: string]
  'update:filters': [value: Record<string, any>]
  'update:currentPage': [value: number]
  'update:itemsPerPage': [value: number]
  'export': []
  'filter-change': [filterType: string, value: string]
  'clear-filters': []
  'page-change': [page: number]
  'items-per-page-change': [limit: number]
  'retry': []
} 
export interface HeaderResponse {
  data: Header[] | Record<string, Header>
  data_pagos?: Header[] | Record<string, Header>
  success: boolean,
  carga?: string,
  lista_embarque_url?: string
  /** Fecha límite de pago (contenedor) - usado en cotización final */
  f_puerto?: string
  /** Total diferencia entre lo pagado e impuestos + logística (cotización final, tab Pagos) */
  total_diferencia_impuestos_logistica?: string | number
}