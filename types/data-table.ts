import type { TableColumn } from '@nuxt/ui'

export interface FilterOption {
  label: string
  value: string
}

export interface FilterConfig {
  key: string
  label: string
  type?: string
  placeholder: string
  options: FilterOption[]
}

export interface DataTableProps {
  // Basic props
  title: string
  icon?: string

  // Data props
  data: any[]
  columns: TableColumn<any>[]
  loading?: boolean

  // Search props
  searchPlaceholder?: string
  showSecondarySearch?: boolean
  secondarySearchLabel?: string
  secondarySearchPlaceholder?: string

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
  secondarySearchValue?: string
  filtersValue?: Record<string, any>
}

export interface DataTableEmits {
  'update:searchQuery': [value: string]
  'update:secondarySearch': [value: string]
  'update:filters': [value: Record<string, any>]
  'update:currentPage': [value: number]
  'update:itemsPerPage': [value: number]
  'export': []
  'filter-change': [filterType: string, value: string]
  'page-change': [page: number]
  'items-per-page-change': [limit: number]
} 