export const CUSTOMERS_ITEMS_PER_PAGE = 10
export const CUSTOMERS_PAGINATION_OPTIONS = [10] as const

export const CUSTOMERS_STATUS_OPTIONS = [
  { label: 'Todos', value: 'todos' },
  { label: 'WAIT', value: 'WAIT' },
  { label: 'NC', value: 'NC' },
  { label: 'NP', value: 'NP' },
  { label: 'C', value: 'C' },
  { label: 'NS', value: 'NS' },
  { label: 'R', value: 'R' },
  { label: 'INSPECTION', value: 'INSPECTION' },
  { label: 'LOADED', value: 'LOADED' },
  { label: 'NO LOADED', value: 'NO LOADED' },
] as const
