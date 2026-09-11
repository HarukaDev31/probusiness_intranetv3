import { computed, ref } from 'vue'
import { CustomersService } from '~/services/cargaconsolidada/customersService'
import type { CustomerRow, CustomersFilters, CustomersPaisOption } from '~/types/cargaconsolidada/customers'
import type { FilterConfig, Header, PaginationInfo } from '~/types/data-table'
import { CUSTOMERS_ITEMS_PER_PAGE, CUSTOMERS_STATUS_OPTIONS } from './constants'

const FILTER_ALL_VALUES = ['todos', 'todas', 'all', 'todo']

const unwrapFilterValue = (value: unknown): string => {
  if (value && typeof value === 'object' && 'value' in value) {
    return unwrapFilterValue((value as { value: unknown }).value)
  }
  return String(value ?? '').trim()
}

const normalizeCustomersFilter = (value: unknown): string => {
  const raw = unwrapFilterValue(value)
  if (!raw || FILTER_ALL_VALUES.includes(raw.toLowerCase())) {
    return 'todos'
  }
  return raw
}

export const useCustomers = () => {
  const customers = ref<CustomerRow[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  const search = ref('')
  const itemsPerPage = ref(CUSTOMERS_ITEMS_PER_PAGE)
  const filters = ref<CustomersFilters>({
    id_pais: 'todos',
    estado_china: 'todos',
  })
  const pagination = ref<PaginationInfo>({
    current_page: 1,
    last_page: 1,
    per_page: CUSTOMERS_ITEMS_PER_PAGE,
    total: 0,
    from: 0,
    to: 0,
  })
  const headers = ref<Record<string, Header>>({})
  const paises = ref<CustomersPaisOption[]>([])

  const totalPages = computed(() => pagination.value.last_page || 1)
  const totalRecords = computed(() => pagination.value.total)
  const currentPage = computed(() => pagination.value.current_page)

  const filterConfig = computed<FilterConfig[]>(() => [
    {
      key: 'id_pais',
      label: 'País',
      type: 'select',
      placeholder: 'Seleccionar país',
      options: [
        { label: 'Todos', value: 'todos' },
        ...paises.value.map((pais) => ({
          label: pais.nombre,
          value: String(pais.id),
        })),
      ],
    },
    {
      key: 'estado_china',
      label: 'Estado',
      type: 'select',
      placeholder: 'Seleccionar estado',
      options: CUSTOMERS_STATUS_OPTIONS.map((option) => ({
        label: option.label,
        value: option.value,
      })),
    },
  ])

  const getCustomers = async () => {
    loading.value = true
    error.value = null
    try {
      const response = await CustomersService.getCustomers(
        filters.value,
        search.value,
        itemsPerPage.value,
        pagination.value.current_page,
      )
      customers.value = response.data ?? []
      if (response.pagination) {
        pagination.value = response.pagination
      }
      headers.value = response.headers ?? {}
      paises.value = response.paises ?? []
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Error al obtener customers'
      console.error('Error en getCustomers:', err)
    } finally {
      loading.value = false
    }
  }

  const handleSearch = async (term: string) => {
    search.value = term
    pagination.value.current_page = 1
    await getCustomers()
  }

  const handlePageChange = async (page: number) => {
    pagination.value.current_page = page
    await getCustomers()
  }

  const handleItemsPerPageChange = async (items: number) => {
    itemsPerPage.value = items
    pagination.value.current_page = 1
    await getCustomers()
  }

  const handleFilterChange = async (key: string, value: unknown) => {
    filters.value = {
      ...filters.value,
      [key]: normalizeCustomersFilter(value),
    }
    pagination.value.current_page = 1
    await getCustomers()
  }

  const clearFilters = async () => {
    filters.value = {
      id_pais: 'todos',
      estado_china: 'todos',
    }
    pagination.value.current_page = 1
    await getCustomers()
  }

  const filterByNc = async () => {
    filters.value = {
      ...filters.value,
      estado_china: 'NC',
    }
    pagination.value.current_page = 1
    await getCustomers()
  }

  return {
    customers,
    loading,
    error,
    search,
    itemsPerPage,
    filters,
    pagination,
    headers,
    paises,
    filterConfig,
    totalPages,
    totalRecords,
    currentPage,
    getCustomers,
    handleSearch,
    handlePageChange,
    handleItemsPerPageChange,
    handleFilterChange,
    clearFilters,
    filterByNc,
  }
}
