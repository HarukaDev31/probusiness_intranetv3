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
}
export interface DataTableProps {
  // Basic props
  title: string
  subtitle: string
  icon?: string
  showTitle?: boolean
  showTopSection?: boolean

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

  // Values from parent
  searchQueryValue?: string
  primarySearchValue?: string
  filtersValue?: Record<string, any>
  showHeaders?: boolean
  headers?: Header[]

  //New Button
  showNewButton?: boolean
  newButtonLabel?: string
  onNewButtonClick?: () => void  
}

export interface DataTableEmits {
  'update:searchQuery': [value: string]
  'update:primarySearch': [value: string]
  'update:filters': [value: Record<string, any>]
  'update:currentPage': [value: number]
  'update:itemsPerPage': [value: number]
  'export': []
  'filter-change': [filterType: string, value: string]
  'page-change': [page: number]
  'items-per-page-change': [limit: number]
} 