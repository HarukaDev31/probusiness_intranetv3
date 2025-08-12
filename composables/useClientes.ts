import { ref, computed } from 'vue'
import { clienteService, type Cliente, type ClientesQueryParams, type PaginationInfo } from '~/services/clienteService'
import type { Header } from '~/types/data-table'
const { withSpinner } = useSpinner()

export const useClientes = () => {
  // State
  const clientes = ref<Cliente[]>([])
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

  // Filtros y búsqueda
  const search = ref('')
  const primarySearch = ref('')
  const filters = ref({
    categoria: 'todos',
    fecha_inicio: '',
    fecha_fin: '',
    servicio: 'todos'
  })
  const headers = ref<Header[]>([])
  // Opciones de filtros
  const filterOptions = ref<{
    categorias: string[]
    fechas: string[]
  }>({
    categorias: ['Cliente', 'Recurrente', 'Premiun', 'Inactivo'],
    fechas: []
  })

  // Computed
  const hasData = computed(() => clientes.value.length > 0)
  const totalPages = computed(() => pagination.value.last_page)
  const currentPage = computed(() => pagination.value.current_page)
  const totalItems = computed(() => pagination.value.total)
  const itemsPerPage = computed(() => {
    return typeof pagination.value.per_page === 'string' ? parseInt(pagination.value.per_page) : pagination.value.per_page
  })

  // Methods
  const loadClientes = async (params: ClientesQueryParams = {}) => {
    loading.value = true
    error.value = null

    try {
      // Combinar parámetros locales con los pasados
      const queryParams: ClientesQueryParams = {
        page: params.page || currentPage.value,
        limit: params.limit || itemsPerPage.value,
        search: params.search || search.value,
        categoria: params.categoria || filters.value.categoria,
        fecha_inicio: params.fecha_inicio || filters.value.fecha_inicio,
        fecha_fin: params.fecha_fin || filters.value.fecha_fin,
        servicio: params.servicio || filters.value.servicio
      }

      // Solo incluir parámetros que tengan valor
      Object.keys(queryParams).forEach(key => {
        if (queryParams[key as keyof ClientesQueryParams] === '' || queryParams[key as keyof ClientesQueryParams] === undefined) {
          delete queryParams[key as keyof ClientesQueryParams]
        }
      })

      const response = await clienteService.getClientes(queryParams)

      clientes.value = response.data
      headers.value = response.headers
      // Actualizar pagination de forma más explícita para asegurar reactividad
      pagination.value.current_page = response.pagination.current_page
      pagination.value.last_page = response.pagination.last_page
      pagination.value.per_page = response.pagination.per_page
      pagination.value.total = response.pagination.total
      pagination.value.from = response.pagination.from
      pagination.value.to = response.pagination.to



      // Si la página actual es mayor que el total de páginas disponibles, 
      // cargar la primera página automáticamente
      if (pagination.value.current_page > pagination.value.last_page && pagination.value.last_page > 0) {
        await loadClientes({ page: 1 })
      }
    } catch (err: any) {
      error.value = err.message || 'Error al cargar clientes'
      console.error('Error loading clientes:', err)
    } finally {
      loading.value = false
    }
  }

  const loadFilterOptions = async () => {
    try {
      const options = await clienteService.getFilterOptions()
      filterOptions.value = options
    } catch (err: any) {
      console.error('Error loading filter options:', err)
      // Mantener opciones por defecto
    }
  }

  const handleSearch = async (searchTerm: string) => {
    search.value = searchTerm
    await loadClientes({ page: 1, search: searchTerm })
  }

  // Función para convertir fecha de DD/MM/YYYY a YYYY-MM-DD
  const formatDateForInput = (dateString: string): string => {
    if (!dateString) return ''
    const parts = dateString.split('/')
    if (parts.length === 3) {
      const [day, month, year] = parts
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
    }
    return dateString
  }

  

  const handleFilterChange = async (filterType: string, value: string) => {
    // Convertir fechas de YYYY-MM-DD a DD/MM/YYYY para el backend
    let formattedValue = value

    // Manejar el valor 'todos' como vacío para el backend
    if (value === 'todos') {
      formattedValue = ''
    } else if ((filterType === 'fecha_inicio' || filterType === 'fecha_fin') && value) {
      formattedValue = formatDateForBackend(value)
    }

    filters.value = { ...filters.value, [filterType]: formattedValue }
    // Resetear a la primera página cuando se cambian los filtros
    await loadClientes({ page: 1 })
  }

  const handlePageChange = async (page: number) => {
    await loadClientes({ page })
  }

  const handleItemsPerPageChange = async (limit: number) => {
    // Cargar los datos con el nuevo límite
    await loadClientes({ page: 1, limit })
  }

  const createCliente = async (clienteData: Partial<Cliente>) => {
    loading.value = true
    error.value = null

    try {
      const newCliente = await clienteService.createCliente(clienteData)
      clientes.value.unshift(newCliente)
      return { success: true, data: newCliente }
    } catch (err: any) {
      error.value = err.message || 'Error al crear cliente'
      return { success: false, error: error.value }
    } finally {
      loading.value = false
    }
  }

  const updateCliente = async (id: number, clienteData: Partial<Cliente>) => {
    loading.value = true
    error.value = null

    try {
      const updatedCliente = await clienteService.updateCliente(id, clienteData)
      const index = clientes.value.findIndex(c => c.id === id)
      if (index !== -1) {
        clientes.value[index] = updatedCliente
      }
      return { success: true, data: updatedCliente }
    } catch (err: any) {
      error.value = err.message || 'Error al actualizar cliente'
      return { success: false, error: error.value }
    } finally {
      loading.value = false
    }
  }

  const deleteCliente = async (id: number) => {
    loading.value = true
    error.value = null

    try {
      await clienteService.deleteCliente(id)
      clientes.value = clientes.value.filter(c => c.id !== id)
      return { success: true }
    } catch (err: any) {
      error.value = err.message || 'Error al eliminar cliente'
      return { success: false, error: error.value }
    } finally {
      loading.value = false
    }
  }

  const uploadClientesFile = async (file: File) => {
    loading.value = true
    error.value = null

    try {
      const result = await clienteService.uploadClientesFile(file)
      // Recargar la lista después de subir
      await loadClientes()
      return { success: true, message: result.message }
    } catch (err: any) {
      error.value = err.message || 'Error al subir archivo'
      return { success: false, error: error.value }
    } finally {
      loading.value = false
    }
  }

  const exportClientes = async () => {
    loading.value = true
    error.value = null

    try {
      await withSpinner(async () => {
        const blob = await clienteService.exportClientes({
          search: search.value,
          categoria: filters.value.categoria,
          fecha_inicio: filters.value.fecha_inicio,
          fecha_fin: filters.value.fecha_fin,
          servicio: filters.value.servicio
        })

        // Crear y descargar el archivo
        const url = window.URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = `clientes_${new Date().toISOString().split('T')[0]}.xlsx`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        window.URL.revokeObjectURL(url)
      }, 'Exportando clientes...')
      return { success: true }
    } catch (err: any) {
      error.value = err.message || 'Error al exportar clientes'
      return { success: false, error: error.value }
    } finally {
      loading.value = false
    }
  }

  const getClienteById = async (id: number) => {
    loading.value = true
    error.value = null

    try {
      const cliente = await clienteService.getClienteById(id)
      return { success: true, data: cliente }
    } catch (err: any) {
      error.value = err.message || 'Error al obtener cliente'
      return { success: false, error: error.value }
    } finally {
      loading.value = false
    }
  }

  const clearError = () => {
    error.value = null
  }

  const resetFilters = () => {
    search.value = ''
    primarySearch.value = ''
    filters.value = {
      categoria: 'todos',
      fecha_inicio: '',
      fecha_fin: '',
      servicio: 'todos'
    }
  }

  return {
    // State
    clientes,
    loading,
    error,
    pagination,
    search,
    primarySearch,
    filters,
    filterOptions,
    headers,

    // Computed
    hasData,
    totalPages,
    currentPage,
    totalItems,
    itemsPerPage,

    // Methods
    loadClientes,
    loadFilterOptions,
    handleSearch,
    handleFilterChange,
    handlePageChange,
    handleItemsPerPageChange,
    createCliente,
    updateCliente,
    deleteCliente,
    uploadClientesFile,
    exportClientes,
    getClienteById,
    clearError,
    resetFilters
  }
} 