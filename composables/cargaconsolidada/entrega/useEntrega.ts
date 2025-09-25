import { ref, computed } from 'vue'
import type { PaginationInfo, HeaderResponse } from '~/types/data-table'
import { EntregaService } from '../../../services/cargaconsolidada/entrega/entregaService'
import type { Entrega } from '../../../types/cargaconsolidada/entrega/entrega'

// Define Header type for local use
type Header = {
  label: string
  value: string | number
  icon?: string
}

export const useEntrega = () => {
  const entregas = ref<Entrega[]>([])
  const clientes = ref<Entrega[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  const pagination = ref<PaginationInfo>({
    current_page: 1,
    last_page: 1,
    per_page: 100,
    total: 0,
    from: 0,
    to: 0
  })
  const search = ref('')
  const itemsPerPage = ref(100)
  const totalPages = computed(() => Math.ceil(pagination.value.total / itemsPerPage.value))
  const totalRecords = computed(() => pagination.value.total)
  const currentPage = computed(() => pagination.value.current_page)
  const filters = ref<any>({})
  const clientesFilters = ref<any>({})
  const filterConfig = ref<any>([])
  const clientesFilterConfig = ref<any>([
    {
      key: 'tipo_entrega',
      label: 'T. Entrega',
      options: [
        { label: 'Todos', value: 'todos' },
        { label: 'Lima', value: 'Lima' },
        { label: 'Provincia', value: 'Provincia' }
      ]
    },
    {
      key: 'estado_pago',
      label: 'Estado',
      options: [
        { label: 'Todos', value: 'todos' },
        { label: 'Pagado', value: 'Pagado' },
        { label: 'Pendiente', value: 'Pendiente' },
        { label: 'Parcial', value: 'Parcial' },
        { label: 'Sobrepago', value: 'Sobrepago' }
      ]
    }
  ])

  const headers = ref<any[]>([])
  const carga = ref<string | null>(null)
  const loadingHeaders = ref(false)
  const contenedorId = ref<number | null>(null)

  const getEntregas = async (id: number) => {
    try {
      loading.value = true
      contenedorId.value = id
      const params = {
        page: currentPage.value,
        per_page: itemsPerPage.value,
        search: search.value,
        filters: filters.value
      }
      const response = await EntregaService.getEntregas(id, params)
      entregas.value = response.data
      pagination.value = response.pagination
    } catch (err: any) {
      error.value = err?.message || 'Error al cargar entregas'
    } finally {
      loading.value = false
    }
  }

  // CLIENTES TAB
  const getClientes = async (id: number) => {
    try {
      loading.value = true
      contenedorId.value = id
      const params = {
        page: currentPage.value,
        per_page: itemsPerPage.value,
        search: search.value,
        filters: clientesFilters.value
      }
      const response = await EntregaService.getClientes(id, params)
      clientes.value = response.data
      pagination.value = response.pagination
    } catch (err: any) {
      error.value = err?.message || 'Error al cargar clientes (entrega)'
    } finally {
      loading.value = false
    }
  }

  const marcarRegistrado = async (idCotizacion: number) => {
    return await EntregaService.marcarRegistrado({ id_cotizacion: idCotizacion })
  }
  const marcarEntregadoCliente = async (idCotizacion: number) => {
    return await EntregaService.marcarEntregadoCliente({ id_cotizacion: idCotizacion })
  }
  const getHeaders = async (id: number) => {
    try {
      loadingHeaders.value = true
      const response = await EntregaService.getHeaders(id) as any

      // Casos:
      // 1. data es un array de headers -> lo usamos directo
      // 2. data es un objeto con 'carga' únicamente -> sólo seteamos carga y dejamos headers vacíos
      // 3. data es objeto con varias claves -> convertimos a headers
      const respData = response?.data
      if (Array.isArray(respData)) {
        headers.value = respData as Header[]
      } else if (respData && typeof respData === 'object') {
        if ('carga' in respData && Object.keys(respData).length === 1) {
          carga.value = respData.carga
          headers.value = []
        } else {
          // Transformar cada par clave:valor en un header
          headers.value = Object.entries(respData).filter(([k]) => k !== 'carga').map(([k, v]) => ({
            label: k.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
            value: typeof v === 'number' ? v.toLocaleString('es-PE') : (v ?? 'N/A'),
            icon: 'i-heroicons-information-circle'
          })) as Header[]
          if (respData.carga) carga.value = respData.carga as string
        }
      } else {
        headers.value = []
      }

      // fallback si backend cambiara y enviara carga en la raíz
      if (!carga.value && response?.carga) carga.value = response.carga
    } catch (err: any) {
      error.value = err?.message || 'Error al cargar headers'
    } finally {
      loadingHeaders.value = false
    }
  }

  const handleSearch = (value: string) => {
    search.value = value
    pagination.value.current_page = 1
    if (contenedorId.value) getEntregas(contenedorId.value)
  }
  const handlePageChange = (value: number) => {
    pagination.value.current_page = value
    if (contenedorId.value) getEntregas(contenedorId.value)
  }
  const handleItemsPerPageChange = (value: number) => {
    itemsPerPage.value = value
    pagination.value.current_page = 1
    if (contenedorId.value) getEntregas(contenedorId.value)
  }
  const handleFilterChange = (key: string, value: any) => {
    filters.value[key] = value
    pagination.value.current_page = 1
    if (contenedorId.value) getEntregas(contenedorId.value)
  }

  return {
    entregas,
    loading,
    error,
    pagination,
    search,
    itemsPerPage,
    totalPages,
    totalRecords,
    currentPage,
    filters,
    filterConfig,
    getEntregas,
  getClientes,
  clientes,
  clientesFilterConfig,
  marcarRegistrado,
  marcarEntregadoCliente,
    handleSearch,
    handlePageChange,
    handleItemsPerPageChange,
    handleFilterChange,
    headers,
    carga,
    loadingHeaders,
    getHeaders
  }
}
